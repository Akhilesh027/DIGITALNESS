import { authHeaders, jsonHeaders, getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api';

export const executeCommand = async (payload: {
  prompt: string;
  requestId?: string;
  explicitHints?: any;
  autoExecute?: boolean;
}) => {
  const res = await fetch(`${API_URL}/ai/command`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const approveCommand = async (executionId: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to approve command');
  }
  return await res.json();
};

export const rejectCommand = async (executionId: string, reason?: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}/reject`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to reject command');
  }
  return await res.json();
};

export const rollbackCommand = async (executionId: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}/rollback`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to rollback command');
  }
  return await res.json();
};

export const submitIntakeAnswer = async (executionId: string, answer: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}/answer`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit intake answer');
  }
  return await res.json();
};

export const finishIntake = async (executionId: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}/finish-intake`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to finish intake');
  }
  return await res.json();
};

export const getCommandExecutionById = async (executionId: string) => {
  const res = await fetch(`${API_URL}/ai/command/${executionId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch command execution');
  const data = await res.json();
  return data.data;
};

export const getCommandHistory = async (limit = 30) => {
  const res = await fetch(`${API_URL}/ai/commands/history?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch command history');
  const data = await res.json();
  return data.data || [];
};

export const getCommandRegistry = async () => {
  const res = await fetch(`${API_URL}/ai/command-registry`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch command registry');
  const data = await res.json();
  return data.data || [];
};

export const getAIStatus = async () => {
  const res = await fetch(`${API_URL}/ai/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AI status');
  const data = await res.json();
  return data.data;
};

export const createAIRequest = async (payload: { prompt: string; customerId?: string; locationId?: string }) => {
  const res = await fetch(`${API_URL}/ai/requests`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit AI request');
  return await res.json();
};

export const getAgentRuns = async () => {
  const res = await fetch(`${API_URL}/ai/runs`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AgentRuns');
  const data = await res.json();
  return data.data || [];
};

export const getAgentRunById = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AgentRun details');
  const data = await res.json();
  return data.data;
};

export const approveAIPlan = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/approve-plan`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to approve plan');
  return await res.json();
};

export const requestAIRevision = async (id: string, feedback: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/request-revision`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error('Failed to request revision');
  return await res.json();
};

export const regenerateAIOutput = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/regenerate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to regenerate output');
  return await res.json();
};

export const approveAIOutput = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/approve-output`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to approve output');
  return await res.json();
};

export const scheduleAIOutput = async (id: string, scheduledFor?: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/schedule-output`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ scheduledFor }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to schedule output');
  }
  return await res.json();
};

export const saveOnlyAIOutput = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/save-only`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to save output');
  return await res.json();
};

export const generateAIPosterImage = async (id: string) => {
  const res = await fetch(`${API_URL}/ai/runs/${id}/generate-image`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to generate poster image');
  return await res.json();
};
