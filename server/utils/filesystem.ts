import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = process.env.DATA_DIR || 'data';
const TEMP_DIR = process.env.TEMP_DIR || 'temp';

export async function setupDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

export async function writeJobResult(id: string, data: any): Promise<void> {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  const tempPath = `${filePath}.tmp`;

  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

export async function readJobResult(id: string): Promise<any | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function listJobResults(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ results: any[]; total: number }> {
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const results: any[] = [];

  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      results.push(data);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  let filtered = results;

  if (filters?.status) {
    filtered = filtered.filter(r => {
      const status = r.status || (r.summary ? 'completed' : 'failed');
      return status === filters.status;
    });
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(r => {
      const transcript = r.transcript?.text?.toLowerCase() || '';
      const summary = JSON.stringify(r.summary)?.toLowerCase();
      const caption = r.metadata?.caption?.toLowerCase() || '';
      return transcript.includes(search) || summary.includes(search) || caption.includes(search);
    });
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 20;
  const paginated = filtered.slice(offset, offset + limit);

  return { results: paginated, total: filtered.length };
}

export function getTempFilePath(id: string, extension: string): string {
  return path.join(TEMP_DIR, `${id}.${extension}`);
}

export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting temp file:', error);
  }
}

export async function deleteJobResult(id: string): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    return false;
  }
}
