const express = require("express");

const {
  createBlog,
  getBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  updateBlogStatus,
  toggleFeaturedBlog,
} = require("../controllers/blogController.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public website routes
router.get("/public", getBlogs);
router.get("/slug/:slug", getBlogBySlug);

// CRM routes
router.get("/", protect, getBlogs);
router.post("/", protect, createBlog);
router.get("/:id", protect, getBlogById);
router.put("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);

router.patch("/:id/status", protect, updateBlogStatus);
router.patch("/:id/featured", protect, toggleFeaturedBlog);

module.exports = router;