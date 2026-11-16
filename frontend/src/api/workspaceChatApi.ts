import { WorkspaceResponse, WorkspaceMessage } from "@/types/workspaceChat";
import { getToken } from "./auth";

export const API_BASE = (import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api").replace(/\/$/, "");

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
  if (!res.ok || !json.success) throw new Error(json.message || "Unable to load conversations");
  return json.data || [];
}

export async function fetchConversationById(conversationId: string) {
  const res = await fetch(`${API_BASE}/ai/workspace/conversations/${encodeURIComponent(conversationId)}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw Object.assign(new Error(json.message || "Unable to load conversation"), { status: res.status });
  return json.data;
}

export async function deleteConversationApi(conversationId: string) {
  const res = await fetch(`${API_BASE}/ai/workspace/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Unable to delete conversation");
  return json;
}
