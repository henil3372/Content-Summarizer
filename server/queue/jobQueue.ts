import { EventEmitter } from 'events';
import { JobProgress, JobStatus } from '../types';

interface QueuedJob {
  id: string;
  reelUrl: string;
  retryCount: number;
}

class JobQueue extends EventEmitter {
  private queue: QueuedJob[] = [];
  private processing = false;
  private statusMap = new Map<string, JobProgress>();

  enqueue(id: string, reelUrl: string): void {
    this.queue.push({ id, reelUrl, retryCount: 0 });
    this.updateStatus(id, 'queued', 0);
    this.processNext();
  }

  retry(id: string, reelUrl: string): void {
    const existingIndex = this.queue.findIndex(job => job.id === id);
    if (existingIndex >= 0) {
      this.queue.splice(existingIndex, 1);
    }

    this.queue.unshift({ id, reelUrl, retryCount: 0 });
    this.updateStatus(id, 'queued', 0);
    this.processNext();
  }

  updateStatus(id: string, status: JobStatus, progress: number, errorMessage?: string, currentStep?: string): void {
    this.statusMap.set(id, { id, status, progress, errorMessage, currentStep });
  }

  getStatus(id: string): JobProgress | undefined {
    return this.statusMap.get(id);
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const job = this.queue.shift()!;

    try {
      this.emit('job:start', job);
      await this.processJob(job);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }

  private async processJob(job: QueuedJob): Promise<void> {
    this.emit('job:process', job);
  }
}

export const jobQueue = new JobQueue();
