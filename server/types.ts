export type JobStatus =
  | 'queued'
  | 'resolving_video'
  | 'downloading'
  | 'transcribing'
  | 'summarizing'
  | 'completed'
  | 'failed';

export interface JobProgress {
  id: string;
  status: JobStatus;
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

export interface ApifyReelData {
  videoUrl?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoPlayCount?: number;
  videoDuration?: number;
}
