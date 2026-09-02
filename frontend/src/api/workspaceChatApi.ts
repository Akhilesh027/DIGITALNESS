import { WorkspaceResponse, WorkspaceMessage } from "@/types/workspaceChat";
import { getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function sendWorkspaceMessage({
  conversationId,
  input,
}: {
  conversationId?: string;
  input: {
    type: "text" | "entity_selection" | "intake_answer" | "approval" | "revision" | "rollback";
    text?: string;
    pendingCommandId?: string;
    entityId?: string;
    entityType?: string;
    field?: string;
    value?: any;
    isSkip?: boolean;
    decision?: "approve" | "reject";
    instruction?: string;
    creativeRunId?: string;
  };
}): Promise<WorkspaceResponse> {
  const res = await fetch(`${API_BASE}/ai/workspace/message`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ conversationId, input }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to process AI message");
  }
  return json.data;
}

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/ai/workspace/conversations`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data || [];
}

export async function fetchConversationById(conversationId: string) {
  const res = await fetch(`${API_BASE}/ai/workspace/conversations/${conversationId}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data;
}

export async function deleteConversationApi(conversationId: string) {
  const res = await fetch(`${API_BASE}/ai/workspace/conversations/${conversationId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}
