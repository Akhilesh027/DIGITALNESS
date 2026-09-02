const Blog = require("../models/Blog.js");

const ADMIN_ROLES = ["Admin", "admin", "Operational Manager"];

const getUserId = (user) => user?._id || user?.id || user;

const canManageBlogs = (user) => {
  return ADMIN_ROLES.includes(user?.role);
};

const generateSlug = (title = "") => {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const toArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePayload = (body = {}, userId = null) => {
  const data = { ...body };

  data.title = data.title ? String(data.title).trim() : "";
  data.slug = data.slug ? generateSlug(data.slug) : generateSlug(data.title);
  data.category = data.category ? String(data.category).trim() : "";
  data.author = data.author || "Digitalness";
  data.shortDescription = data.shortDescription || "";
  data.content = data.content || "";

  data.tags = toArray(data.tags);
  data.metaKeywords = toArray(data.metaKeywords);

  data.status = data.status || "Draft";
  data.isFeatured = Boolean(data.isFeatured);

  if (data.status === "Published" && !data.publishedAt) {
    data.publishedAt = new Date();
  }

  if (data.status !== "Published") {
    data.publishedAt = null;
  }

  data.updatedBy = userId;

  return data;
};

exports.createBlog = async (req, res) => {
  try {
    if (!canManageBlogs(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can create blogs",
      });
    }

    const userId = getUserId(req.user);
    const payload = normalizePayload(req.body, userId);

    if (!payload.title || !payload.category || !payload.shortDescription || !payload.content) {
      return res.status(400).json({
        success: false,
        message: "Title, category, short description and content are required",
      });
    }

    const existingSlug = await Blog.findOne({ slug: payload.slug });

    if (existingSlug) {
      payload.slug = `${payload.slug}-${Date.now()}`;
    }

    const blog = await Blog.create({
      ...payload,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.log("Create blog error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const { status, category, featured, search } = req.query;

    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (featured === "true") filter.isFeatured = true;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Public website can pass ?public=true to show only published blogs
    if (req.query.public === "true") {
      filter.status = "Published";
    }

    const blogs = await Blog.find(filter)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.log("Get blogs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "Published",
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    if (!canManageBlogs(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can update blogs",
      });
    }

    const existingBlog = await Blog.findById(req.params.id);

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const userId = getUserId(req.user);
    const payload = normalizePayload(req.body, userId);

    delete payload._id;
    delete payload.createdBy;
    delete payload.createdAt;
    delete payload.updatedAt;

    const duplicateSlug = await Blog.findOne({
      _id: { $ne: req.params.id },
      slug: payload.slug,
    });

    if (duplicateSlug) {
      return res.status(400).json({
        success: false,
        message: "Another blog already exists with this slug",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.log("Update blog error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    if (!canManageBlogs(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can delete blogs",
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.log("Delete blog error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: error.message,
    });
  }
};

exports.updateBlogStatus = async (req, res) => {
  try {
    if (!canManageBlogs(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can update blog status",
      });
    }

    const { status } = req.body;

    if (!["Draft", "Published", "Archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog status",
      });
    }

    const updateData = {
      status,
      updatedBy: getUserId(req.user),
      publishedAt: status === "Published" ? new Date() : null,
    };

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      message: "Blog status updated successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update blog status",
      error: error.message,
    });
  }
};

exports.toggleFeaturedBlog = async (req, res) => {
  try {
    if (!canManageBlogs(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can feature blogs",
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    blog.isFeatured = !blog.isFeatured;
    blog.updatedBy = getUserId(req.user);

    await blog.save();

    res.json({
      success: true,
      message: "Featured status updated successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update featured status",
      error: error.message,
    });
  }
};