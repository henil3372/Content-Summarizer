import { ApifyClient } from 'apify-client';
import { ApifyReelData } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN
});

const ACTOR_ID = 'apify/instagram-reel-scraper';
const MAX_WAIT_SECS = 300;

export async function resolveReelVideo(reelUrl: string): Promise<ApifyReelData> {
  try {
    const run = await client.actor(ACTOR_ID).call({
      username: [reelUrl],
      resultsLimit: 1
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error('No data returned from Instagram. The reel may be private or unavailable.');
    }

    const item = items[0];

    let videoUrl: string | undefined;

    if (item.videoUrl) {
      videoUrl = item.videoUrl;
    } else if (item.videoVersions && Array.isArray(item.videoVersions)) {
      const sorted = [...item.videoVersions].sort((a, b) => (b.width || 0) - (a.width || 0));
      videoUrl = sorted[0]?.url;
    } else if (item.video_url) {
      videoUrl = item.video_url;
    }

    return {
      videoUrl,
      caption: item.caption || item.text,
      likesCount: item.likesCount || item.likes_count,
      commentsCount: item.commentsCount || item.comments_count,
      videoPlayCount: item.videoPlayCount || item.play_count,
      videoDuration: item.videoDuration || item.video_duration
    };

  } catch (error: any) {
    if (error.message?.includes('private') || error.message?.includes('unavailable')) {
      throw error;
    }
    throw new Error(`Failed to fetch reel data: ${error.message}`);
  }
}
