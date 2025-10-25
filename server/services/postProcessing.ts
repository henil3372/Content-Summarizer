import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const apifyClient = new ApifyClient({
  token: process.env.APIFY_TOKEN!
});

export interface PostMetadata {
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
  ownerUsername?: string;
  ownerFullName?: string;
  imageUrls?: string[];
  videoUrl?: string;
  type?: string;
}

export async function extractPostMetadata(postUrl: string): Promise<PostMetadata> {
  try {
    console.log('Extracting post metadata from:', postUrl);

    const run = await apifyClient.actor('apify/instagram-post-scraper').call({
      directUrls: [postUrl],
      resultsLimit: 1
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error('No data returned from Instagram post scraper');
    }

    const post = items[0];

    return {
      caption: post.caption || '',
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      timestamp: post.timestamp || new Date().toISOString(),
      ownerUsername: post.ownerUsername || '',
      ownerFullName: post.ownerFullName || '',
      imageUrls: post.imageUrls || [],
      videoUrl: post.videoUrl || null,
      type: post.type || 'unknown'
    };
  } catch (error: any) {
    console.error('Post metadata extraction failed:', error);
    throw new Error(`Failed to extract post metadata: ${error.message}`);
  }
}
