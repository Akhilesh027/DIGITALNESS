// src/pages/BlogsPage.tsx

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UploadCloud,
  Save,
  X,
  FileText,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

type BlogStatus = "Draft" | "Published" | "Archived";

type BlogForm = {
  _id?: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  shortDescription: string;
  content: string;
  featuredImage: string;
  bannerImage: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  status: BlogStatus;
  isFeatured: boolean;
};

const emptyBlog: BlogForm = {
  title: "",
  slug: "",
  category: "",
  author: "Digitalness",
  shortDescription: "",
  content: "",
  featuredImage: "",
  bannerImage: "",
  tags: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  status: "Draft",
  isFeatured: false,
};

const categories = [
  "Digital Marketing",
  "SEO",
  "Website Development",
  "Social Media",
  "Branding",
  "CRM",
  "Hiring",
  "Business Growth",
];

export default function BlogsPage() {
  const { toast } = useToast();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);

  const [form, setForm] = useState<BlogForm>(emptyBlog);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/blogs`, getAuthConfig());
      setBlogs(res.data?.data || res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title?.toLowerCase().includes(search.toLowerCase()) ||
        blog.category?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || blog.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [blogs, search, statusFilter]);

  const handleInput = (key: keyof BlogForm, value: any) => {
    if (key === "title") {
      setForm({
        ...form,
        title: value,
        slug: form.slug || generateSlug(value),
        metaTitle: form.metaTitle || value,
      });
      return;
    }

    setForm({ ...form, [key]: value });
  };

  const handleCreate = () => {
    setForm(emptyBlog);
    setShowForm(true);
  };

  const handleEdit = (blog: any) => {
    setForm({
      _id: blog._id,
      title: blog.title || "",
      slug: blog.slug || "",
      category: blog.category || "",
      author: blog.author || "Digitalness",
      shortDescription: blog.shortDescription || "",
      content: blog.content || "",
      featuredImage: blog.featuredImage || "",
      bannerImage: blog.bannerImage || "",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      metaKeywords: Array.isArray(blog.metaKeywords)
        ? blog.metaKeywords.join(", ")
        : blog.metaKeywords || "",
      status: blog.status || "Draft",
      isFeatured: Boolean(blog.isFeatured),
    });

    setShowForm(true);
  };

  const validate = () => {
    if (!form.title || !form.category || !form.shortDescription || !form.content) {
      toast({
        title: "Missing Details",
        description: "Title, category, short description and content are required",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    ...form,
    slug: form.slug || generateSlug(form.title),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    metaKeywords: form.metaKeywords
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaveLoading(true);

      if (form._id) {
        await axios.put(
          `${API_URL}/blogs/${form._id}`,
          buildPayload(),
          getAuthConfig()
        );
        toast({ title: "Blog Updated", description: "Blog updated successfully" });
      } else {
        await axios.post(`${API_URL}/blogs`, buildPayload(), getAuthConfig());
        toast({ title: "Blog Created", description: "Blog created successfully" });
      }

      setShowForm(false);
      fetchBlogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save blog",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      await axios.delete(`${API_URL}/blogs/${id}`, getAuthConfig());
      toast({ title: "Deleted", description: "Blog deleted successfully" });
      fetchBlogs();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete blog",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (file: File, key: "featuredImage" | "bannerImage") => {
    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        [key]: String(reader.result || ""),
      }));
    };

    reader.readAsDataURL(file);
  };

  const openView = (blog: any) => {
    setSelectedBlog(blog);
    setShowView(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Management</h1>
          <p className="text-sm text-slate-500">
            Create, edit, publish and manage website blogs with SEO details.
          </p>
        </div>

        <Button onClick={handleCreate} className="w-full lg:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Blog
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold">{blogs.length}</p>
          <p className="text-sm text-slate-500">Total Blogs</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold">
            {blogs.filter((b) => b.status === "Published").length}
          </p>
          <p className="text-sm text-slate-500">Published</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold">
            {blogs.filter((b) => b.status === "Draft").length}
          </p>
          <p className="text-sm text-slate-500">Drafts</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold">
            {blogs.filter((b) => b.isFeatured).length}
          </p>
          <p className="text-sm text-slate-500">Featured</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border bg-white p-8 text-center text-slate-500">
            Loading blogs...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="col-span-full rounded-2xl border bg-white p-8 text-center text-slate-500">
            No blogs found
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="h-44 bg-slate-100">
                {blog.featuredImage ? (
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{blog.category}</Badge>
                  <Badge variant={blog.status === "Published" ? "default" : "secondary"}>
                    {blog.status}
                  </Badge>
                  {blog.isFeatured && (
                    <Badge variant="outline">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h3 className="line-clamp-2 text-lg font-semibold">
                  {blog.title}
                </h3>

                <p className="line-clamp-3 text-sm text-slate-500">
                  {blog.shortDescription}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openView(blog)}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(blog)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(blog._id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form._id ? "Edit Blog" : "Create Blog"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Input
                placeholder="Blog Title *"
                value={form.title}
                onChange={(e) => handleInput("title", e.target.value)}
              />

              <Input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => handleInput("slug", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  value={form.category}
                  onValueChange={(v) => handleInput("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category *" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={form.status}
                  onValueChange={(v: BlogStatus) => handleInput("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Short Description *"
                value={form.shortDescription}
                onChange={(e) => handleInput("shortDescription", e.target.value)}
              />

              <Textarea
                className="min-h-[320px]"
                placeholder="Write blog content here... *"
                value={form.content}
                onChange={(e) => handleInput("content", e.target.value)}
              />

              <Input
                placeholder="Tags comma separated"
                value={form.tags}
                onChange={(e) => handleInput("tags", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border p-4">
                <label className="mb-2 block text-sm font-medium">
                  Featured Image
                </label>

                {form.featuredImage && (
                  <img
                    src={form.featuredImage}
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                  />
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-slate-500">
                  <UploadCloud className="h-4 w-4" />
                  Upload Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "featuredImage");
                    }}
                  />
                </label>

                <Input
                  className="mt-3"
                  placeholder="or paste image URL"
                  value={
                    form.featuredImage?.startsWith("data:")
                      ? "Uploaded image selected"
                      : form.featuredImage
                  }
                  onChange={(e) => handleInput("featuredImage", e.target.value)}
                  disabled={form.featuredImage?.startsWith("data:")}
                />
              </div>

              <div className="rounded-2xl border p-4">
                <label className="mb-2 block text-sm font-medium">
                  Banner Image
                </label>

                {form.bannerImage && (
                  <img
                    src={form.bannerImage}
                    className="mb-3 h-28 w-full rounded-xl object-cover"
                  />
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-slate-500">
                  <UploadCloud className="h-4 w-4" />
                  Upload Banner
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "bannerImage");
                    }}
                  />
                </label>
              </div>

              <div className="rounded-2xl border p-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => handleInput("isFeatured", e.target.checked)}
                  />
                  Mark as Featured Blog
                </label>
              </div>

              <div className="rounded-2xl border p-4 space-y-3">
                <h3 className="font-semibold">SEO Details</h3>

                <Input
                  placeholder="Meta Title"
                  value={form.metaTitle}
                  onChange={(e) => handleInput("metaTitle", e.target.value)}
                />

                <Textarea
                  placeholder="Meta Description"
                  value={form.metaDescription}
                  onChange={(e) =>
                    handleInput("metaDescription", e.target.value)
                  }
                />

                <Input
                  placeholder="Meta Keywords"
                  value={form.metaKeywords}
                  onChange={(e) => handleInput("metaKeywords", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowForm(false)}
              disabled={saveLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button className="flex-1" onClick={handleSave} disabled={saveLoading}>
              <Save className="mr-2 h-4 w-4" />
              {saveLoading ? "Saving..." : "Save Blog"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blog Preview</DialogTitle>
          </DialogHeader>

          {selectedBlog && (
            <div className="space-y-5">
              {selectedBlog.bannerImage && (
                <img
                  src={selectedBlog.bannerImage}
                  className="h-64 w-full rounded-2xl object-cover"
                />
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedBlog.category}</Badge>
                  <Badge>{selectedBlog.status}</Badge>
                  {selectedBlog.isFeatured && <Badge>Featured</Badge>}
                </div>

                <h1 className="text-3xl font-bold">{selectedBlog.title}</h1>
                <p className="text-slate-500">{selectedBlog.shortDescription}</p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-5 whitespace-pre-line leading-7">
                {selectedBlog.content}
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">SEO Preview</h3>
                <p className="mt-2 font-medium">{selectedBlog.metaTitle}</p>
                <p className="text-sm text-slate-500">
                  {selectedBlog.metaDescription}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}