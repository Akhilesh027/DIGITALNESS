const express = require("express");

const router = express.Router();

const {protect} = require("../middleware/authMiddleware");

const {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");

router.post("/", protect, createTicket);

router.get("/", protect, getTickets);

router.put("/:id", protect, updateTicket);

router.delete("/:id", protect, deleteTicket);

module.exports = router;