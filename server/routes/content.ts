import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { extractTextFromImage } from '../services/ocr';
import { analyzeInstagramURL } from '../services/urlIntelligence';
import { extractPostMetadata } from '../services/postProcessing';
import {
  createContentItem,
  updateContentItem,
  createOCRExtraction,
  createContentMetadata,
  createProcessingMetrics,
  getContentItemWithDetails,
  listContentItems,
  deleteContentItem,
  supabase
} from '../services/database';
import { jobQueue } from '../queue/jobQueue';

export const contentRouter = Router();

const TEMP_DIR = process.env.TEMP_DIR || './temp';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'reel-results';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(TEMP_DIR, { recursive: true });
      cb(null, TEMP_DIR);
    } catch (error: any) {
      cb(error, TEMP_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

contentRouter.post('/ocr', upload.single('image'), async (req: Request, res: Response) => {
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'No image file provided'
      });
    }

    tempFilePath = req.file.path;
    const startTime = Date.now();

    const contentItem = await createContentItem({
      content_type: 'ocr',
      status: 'processing'
    });

    const imageBuffer = await fs.readFile(tempFilePath);
    const supabasePath = `ocr/${contentItem.id}${path.extname(req.file.originalname)}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(supabasePath, imageBuffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const ocrResult = await extractTextFromImage(tempFilePath);

    await createOCRExtraction({
      content_item_id: contentItem.id,
      extracted_text: ocrResult.extractedText,
      image_path: supabasePath,
      metadata: ocrResult.metadata
    });

    await createProcessingMetrics({
      content_item_id: contentItem.id,
      ocr_ms: Date.now() - startTime,
      model_info: { ocr: ocrResult.metadata.model }
    });

    await updateContentItem(contentItem.id, { status: 'completed' });

    const result = await getContentItemWithDetails(contentItem.id);

    res.status(200).json({
      id: contentItem.id,
      status: 'completed',
      result
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
  }
});

contentRouter.post('/submit', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'URL is required and must be a string'
      });
    }

    const analysis = analyzeInstagramURL(url);

    if (!analysis.isValid) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid Instagram reel or post URL'
      });
    }

    if (analysis.contentType === 'reel') {
      const jobId = randomUUID();
      jobQueue.enqueue(jobId, url);

      return res.status(202).json({
        id: jobId,
        contentType: 'reel',
        status: 'queued'
      });
    }

    if (analysis.contentType === 'post') {
      const contentItem = await createContentItem({
        content_type: 'post',
        source_url: url,
        status: 'processing'
      });

      res.status(202).json({
        id: contentItem.id,
        contentType: 'post',
        status: 'processing'
      });

      processPostInBackground(contentItem.id, url);
    } else {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Could not determine content type'
      });
    }

  } catch (error: any) {
    console.error('Submit error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

async function processPostInBackground(contentItemId: string, postUrl: string): Promise<void> {
  try {
    const startTime = Date.now();

    const metadata = await extractPostMetadata(postUrl);

    await createContentMetadata({
      content_item_id: contentItemId,
      caption: metadata.caption,
      likes_count: metadata.likesCount,
      comments_count: metadata.commentsCount,
      additional_data: {
        ownerUsername: metadata.ownerUsername,
        ownerFullName: metadata.ownerFullName,
        imageUrls: metadata.imageUrls,
        videoUrl: metadata.videoUrl,
        type: metadata.type,
        timestamp: metadata.timestamp
      }
    });

    await createProcessingMetrics({
      content_item_id: contentItemId,
      resolve_ms: Date.now() - startTime,
      model_info: { source: 'apify-instagram-post-scraper' }
    });

    await updateContentItem(contentItemId, {
      status: 'completed',
      video_url: metadata.videoUrl || undefined
    });

  } catch (error: any) {
    console.error('Post processing error:', error);
    await updateContentItem(contentItemId, {
      status: 'failed',
      error_message: error.message
    });
  }
}

contentRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { content_type, status, limit, offset } = req.query;

    const filters = {
      content_type: content_type as 'reel' | 'post' | 'ocr' | undefined,
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0
    };

    const { items, total } = await listContentItems(filters);

    res.json({
      results: items,
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

contentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getContentItemWithDetails(id);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content item not found'
      });
    }

    res.json(result);

  } catch (error: any) {
    console.error('Get content error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

contentRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getContentItemWithDetails(id);
    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content item not found'
      });
    }

    const deleted = await deleteContentItem(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete content item'
      });
    }

    res.status(200).json({
      message: 'Content item deleted successfully',
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

contentRouter.get('/:id/image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getContentItemWithDetails(id);

    if (!result || !result.ocr || !result.ocr.image_path) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Image not found'
      });
    }

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(result.ocr.image_path);

    if (error || !data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Image file not found'
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type);
    res.send(buffer);

  } catch (error: any) {
    console.error('Get image error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
