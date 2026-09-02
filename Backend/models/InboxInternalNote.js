const mongoose = require("mongoose");

const inboxInternalNoteSchema = new mongoose.Schema(
  {
    inboxItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InboxItem",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    mentions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String, default: "" },
      },
    ],
    attachments: [
      {
        fileName: { type: String, default: "" },
        fileUrl: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

inboxInternalNoteSchema.index({ inboxItemId: 1, createdAt: -1 });

let InboxInternalNoteModel;
try {
  InboxInternalNoteModel = mongoose.model("InboxInternalNote");
} catch (e) {
  InboxInternalNoteModel = mongoose.model("InboxInternalNote", inboxInternalNoteSchema);
}

module.exports = InboxInternalNoteModel;
