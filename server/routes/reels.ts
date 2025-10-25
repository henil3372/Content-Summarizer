import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { jobQueue } from '../queue/jobQueue';
import { downloadReelJson, deleteJobResult, listJobResults } from '../services/supabaseStorage';

export const reelsRouter = Router();

function isValidInstagramUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'www.instagram.com' || parsedUrl.hostname === 'instagram.com';
  } catch {
    return false;
  }
}

reelsRouter.get('/ingest', async (req: Request, res: Response) => {
  try {
    const { reelUrl } = req.query;

    if (!reelUrl || typeof reelUrl !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'reelUrl is required and must be a string'
      });
    }

    if (!isValidInstagramUrl(reelUrl)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Only Instagram reel URLs are allowed'
      });
    }

    const jobId = randomUUID();
    jobQueue.enqueue(jobId, reelUrl);

    res.status(202).json({
      id: jobId,
      status: 'queued'
    });

  } catch (error: any) {
    console.error('Ingest error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

reelsRouter.get('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = jobQueue.getStatus(id);

    if (!status) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job not found'
      });
    }

    res.json(status);

  } catch (error: any) {
    console.error('Status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

reelsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await downloadReelJson(id);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job result not found'
      });
    }

    res.json(result);

  } catch (error: any) {
    console.error('Get result error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

reelsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit, offset, search } = req.query;

    const filters = {
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
      search: search as string | undefined
    };

    const { results, total } = await listJobResults(filters);

    res.json({
      results,
      total,
      limit: filters.limit,
      offset: filters.offset
    });

  } catch (error: any) {
    console.error('List error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

reelsRouter.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await downloadReelJson(id);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Job not found'
      });
    }

    jobQueue.retry(id, result.reelUrl);

    res.json({
      id,
      status: 'queued',
      message: 'Job re-queued for retry'
    });

  } catch (error: any) {
    console.error('Retry error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

reelsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await downloadReelJson(id);
    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Process not found'
      });
    }

    const deleted = await deleteJobResult(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete process'
      });
    }

    res.status(200).json({
      message: 'Process deleted successfully',
      id
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
