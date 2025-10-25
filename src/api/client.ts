const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface JobStatus {
  id: string;
  status: 'queued' | 'resolving_video' | 'downloading' | 'transcribing' | 'summarizing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  currentStep?: string;
}

export interface Summary {
  title: string;
  bullets: string[];
  tldr: string;
  entities: string[];
  keyMoments?: Array<{ time: string; description: string }>;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface JobResult {
  id: string;
  reelUrl: string;
  videoUrl?: string;
  transcript?: {
    text: string;
    segments?: TranscriptSegment[];
  };
  summary?: Summary;
  language?: string;
  createdAt: string;
  updatedAt: string;
  modelInfo: {
    transcription: string;
    summarization: string;
  };
  metrics: {
    resolveMs?: number;
    downloadMs?: number;
    transcribeMs?: number;
    summarizeMs?: number;
  };
  metadata?: {
    caption?: string;
    likesCount?: number;
    commentsCount?: number;
    duration?: number;
  };
}

export interface ListResponse {
  results: JobResult[];
  total: number;
  limit: number;
  offset: number;
}

export async function ingestReel(reelUrl: string): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/reels/ingest?reelUrl=${encodeURIComponent(reelUrl)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit reel');
  }

  return response.json();
}

export async function getJobStatus(id: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/reels/${id}/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get job status');
  }

  return response.json();
}

export async function getJobResult(id: string): Promise<JobResult> {
  const response = await fetch(`${API_BASE_URL}/reels/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get job result');
  }

  return response.json();
}

export async function listJobs(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE_URL}/reels?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list jobs');
  }

  return response.json();
}

export async function retryJob(id: string): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/reels/${id}/retry`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retry job');
  }

  return response.json();
}

export async function processVideoByUrl(url: string): Promise<{ processId: string; status: string; message: string }> {
  const params = new URLSearchParams({ url });
  const response = await fetch(`${API_BASE_URL}/reels/process?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process video');
  }

  return response.json();
}

export async function deleteJob(id: string): Promise<{ message: string; id: string }> {
  const response = await fetch(`${API_BASE_URL}/reels/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete process');
  }

  return response.json();
}

export interface OCRResult {
  id: string;
  status: string;
  result: any;
}

export async function uploadImageForOCR(imageFile: File): Promise<OCRResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE_URL}/content/ocr`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process image');
  }

  return response.json();
}

export interface ContentSubmitResponse {
  id: string;
  contentType: 'reel' | 'post';
  status: string;
}

export async function submitContent(url: string): Promise<ContentSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/content/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit content');
  }

  return response.json();
}

export async function getContentItem(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get content item');
  }

  return response.json();
}

export async function listContentItems(filters?: {
  content_type?: 'reel' | 'post' | 'ocr';
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: any[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams();
  if (filters?.content_type) params.append('content_type', filters.content_type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE_URL}/content?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list content items');
  }

  return response.json();
}

export async function deleteContentItem(id: string): Promise<{ message: string; id: string }> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete content item');
  }

  return response.json();
}
