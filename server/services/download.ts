import https from 'https';
import http from 'http';
import fs from 'fs';
import { getTempFilePath, deleteTempFile } from '../utils/filesystem';

const MAX_SIZE = 25 * 1024 * 1024;
const TIMEOUT = 120000;

export async function downloadVideo(jobId: string, videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempPath = getTempFilePath(jobId, 'mp4');
    const fileStream = fs.createWriteStream(tempPath);
    let downloadedSize = 0;

    const protocol = videoUrl.startsWith('https') ? https : http;

    const request = protocol.get(videoUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          fileStream.close();
          fs.unlinkSync(tempPath);
          return downloadVideo(jobId, redirectUrl).then(resolve).catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        fileStream.close();
        deleteTempFile(tempPath);
        return reject(new Error(`Failed to download video: HTTP ${response.statusCode}`));
      }

      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('video') && !contentType.includes('octet-stream')) {
        fileStream.close();
        deleteTempFile(tempPath);
        return reject(new Error(`Invalid content type: ${contentType}. Expected video.`));
      }

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (downloadedSize > MAX_SIZE) {
          request.destroy();
          fileStream.close();
          deleteTempFile(tempPath);
          reject(new Error('Video file too large (> 25MB)'));
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(tempPath);
      });

      fileStream.on('error', (err) => {
        fileStream.close();
        deleteTempFile(tempPath);
        reject(err);
      });
    });

    request.setTimeout(TIMEOUT, () => {
      request.destroy();
      fileStream.close();
      deleteTempFile(tempPath);
      reject(new Error('Download timeout'));
    });

    request.on('error', (err) => {
      fileStream.close();
      deleteTempFile(tempPath);
      reject(err);
    });
  });
}
