/**
 * aiWorkspaceConversationController.js
 * Controller for the Conversational AI Workspace endpoints.
 */

const workspaceConversationService = require("../ai/conversation/workspaceConversationService");
const AIConversation = require("../models/AIConversation");

exports.handleWorkspaceMessage = async (req, res) => {
  try {
    const { conversationId, input } = req.body;
    if (!input || (!input.text && !input.type)) {
      return res.status(400).json({ success: false, message: "Input payload is required." });
    }

    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "Manager";

    const response = await workspaceConversationService.processTurn({
      conversationId,
      userId,
      userRole,
      input,
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("[aiWorkspaceConversationController Error]:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const filter = userId ? { userId } : {};
    const list = await AIConversation.find(filter)
      .select("conversationId title state activeCustomerName updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conv = await AIConversation.findOne({ conversationId }).lean();
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    return res.status(200).json({
      success: true,
      data: conv,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await AIConversation.deleteOne({ conversationId });
    return res.status(200).json({ success: true, message: "Conversation deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
