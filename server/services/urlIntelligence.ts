export type ContentType = 'reel' | 'post' | 'unknown';

export interface URLAnalysisResult {
  contentType: ContentType;
  platform: 'instagram' | 'unknown';
  isValid: boolean;
  url: string;
}

export function analyzeInstagramURL(url: string): URLAnalysisResult {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname !== 'www.instagram.com' && hostname !== 'instagram.com') {
      return {
        contentType: 'unknown',
        platform: 'unknown',
        isValid: false,
        url
      };
    }

    const pathname = parsedUrl.pathname.toLowerCase();

    if (pathname.includes('/reel/') || pathname.includes('/reels/')) {
      return {
        contentType: 'reel',
        platform: 'instagram',
        isValid: true,
        url
      };
    }

    if (pathname.includes('/p/')) {
      return {
        contentType: 'post',
        platform: 'instagram',
        isValid: true,
        url
      };
    }

    return {
      contentType: 'unknown',
      platform: 'instagram',
      isValid: false,
      url
    };
  } catch (error) {
    return {
      contentType: 'unknown',
      platform: 'unknown',
      isValid: false,
      url
    };
  }
}

export function isInstagramReel(url: string): boolean {
  const analysis = analyzeInstagramURL(url);
  return analysis.contentType === 'reel' && analysis.isValid;
}

export function isInstagramPost(url: string): boolean {
  const analysis = analyzeInstagramURL(url);
  return analysis.contentType === 'post' && analysis.isValid;
}

export function isValidInstagramURL(url: string): boolean {
  const analysis = analyzeInstagramURL(url);
  return analysis.isValid;
}
