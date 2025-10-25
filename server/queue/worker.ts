import { jobQueue } from './jobQueue';
import { resolveReelVideo } from '../services/apify';
import { downloadVideo } from '../services/download';
import { transcribeAudio } from '../services/transcription';
import { summarizeTranscript } from '../services/summarization';
import { JobResult } from '../types';
import dotenv from 'dotenv';
import { uploadReelJson } from '../services/supabaseStorage';

dotenv.config();

interface Job {
  id: string;
  reelUrl: string;
  retryCount: number;
}

export function initializeWorker() {
  jobQueue.on('job:process', async (job: Job) => {
    const startTime = Date.now();
    const metrics: JobResult['metrics'] = {};

    const result: JobResult = {
      id: job.id,
      reelUrl: job.reelUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modelInfo: {
        transcription: process.env.TRANSCRIPTION_MODEL || 'whisper-1',
        summarization: process.env.SUMMARIZATION_MODEL || 'gpt-4o-mini'
      },
      metrics
    };

    try {
      jobQueue.updateStatus(job.id, 'resolving_video', 10, undefined, 'Fetching reel metadata...');
      const resolveStart = Date.now();
      const reelData = await resolveReelVideo(job.reelUrl);
      metrics.resolveMs = Date.now() - resolveStart;

      if (!reelData.videoUrl) {
        throw new Error('No video URL found. The reel may be private or unavailable.');
      }

      result.videoUrl = reelData.videoUrl;
      result.metadata = {
        caption: reelData.caption,
        likesCount: reelData.likesCount,
        commentsCount: reelData.commentsCount,
        duration: reelData.videoDuration
      };

      jobQueue.updateStatus(job.id, 'downloading', 25, undefined, 'Downloading video...');
      const downloadStart = Date.now();
      const videoPath = await downloadVideo(job.id, reelData.videoUrl);
      metrics.downloadMs = Date.now() - downloadStart;

      jobQueue.updateStatus(job.id, 'transcribing', 50, undefined, 'Transcribing audio...');
      const transcribeStart = Date.now();
      const transcriptData = await transcribeAudio(videoPath);
      metrics.transcribeMs = Date.now() - transcribeStart;

      result.transcript = transcriptData.transcript;
      result.language = transcriptData.language;

      jobQueue.updateStatus(job.id, 'summarizing', 75, undefined, 'Generating summary...');
      const summarizeStart = Date.now();
      const summary = await summarizeTranscript(transcriptData.transcript.text, transcriptData.segments);
      metrics.summarizeMs = Date.now() - summarizeStart;

      result.summary = summary;
      result.updatedAt = new Date().toISOString();

      await uploadReelJson(job.id, result);

      jobQueue.updateStatus(job.id, 'completed', 100);

    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);
      result.updatedAt = new Date().toISOString();

      await uploadReelJson(job.id, result);

      jobQueue.updateStatus(
        job.id,
        'failed',
        0,
        error.message || 'An unknown error occurred'
      );
    }
  });

  console.log('Worker initialized');
}
