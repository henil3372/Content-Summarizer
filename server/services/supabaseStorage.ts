import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;``
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET!;

// Create a Supabase client instance
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Uploads a JSON file to Supabase Storage
 * @param record - The JSON object to upload
 * @returns The uploaded file path
 */
export async function uploadReelJson(id: string, reelData: any): Promise<string> {
  try {
    const fileName = `${id}.json`;
    const fileContent = JSON.stringify(reelData, null, 2);

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, fileContent, {
        contentType: "application/json",
        upsert: true, // overwrite if already exists
      });

    if (error) throw new Error(error.message);

    console.log(`Uploaded JSON: ${fileName}`);
    return data?.path ?? fileName;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
}

/**
 * Downloads and parses a JSON file from Supabase Storage
 * @param id - The reel's unique ID (without .json)
 * @returns Parsed JSON object
 */
export async function downloadReelJson(id: string): Promise<any> {
  try {
    const fileName = `${id}.json`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(fileName);

    if (error) throw new Error(error.message);
    if (!data) throw new Error("File not found or empty response");

    const text = await data.text();
    const json: any = JSON.parse(text);

    console.log(`Downloaded JSON: ${fileName}`);
    return json;
  } catch (err) {
    console.error("Download failed:", err);
    throw err;
  }
}

/**
 * Lists and filters JSON job result files from Supabase storage
 * Supports search, pagination, and concurrent downloads
 */
export async function listJobResults(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ results: any[]; total: number }> {
  try {
    // Step 1: List all JSON files
    const { data: files, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list("", { limit: 1000 });

    if (error) throw new Error(error.message);

    const jsonFiles = files?.filter((f) => f.name.endsWith(".json")) ?? [];

    // Step 2: Download all concurrently (with Promise.allSettled)
    const downloadPromises = jsonFiles.map(async (file) => {
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .download(file.name);
      if (error || !data) return null;
      const text = await data.text();
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`Invalid JSON: ${file.name}`);
        return null;
      }
    });

    const resultsSettled = await Promise.allSettled(downloadPromises);
    const results = resultsSettled
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r: any) => r.value);

    // Step 3: Apply filters
    let filtered = results;

    if (filters?.status) {
      filtered = filtered.filter((r) => {
        const status = r.status || (r.summary ? "completed" : "failed");
        return status === filters.status;
      });
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((r) => {
        const transcript = r.transcript?.text?.toLowerCase() || "";
        const summary = JSON.stringify(r.summary)?.toLowerCase() || "";
        const caption = r.metadata?.caption?.toLowerCase() || "";
        const fileId = r.id?.toLowerCase() || "";
        return (
          transcript.includes(search) ||
          summary.includes(search) ||
          caption.includes(search) ||
          fileId.includes(search)
        );
      });
    }

    // Step 4: Sort and paginate
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 20;
    const paginated = filtered.slice(offset, offset + limit);

    console.log(
      `listJobResults: ${paginated.length}/${filtered.length} results (total files: ${jsonFiles.length})`
    );
    return { results: paginated, total: filtered.length };
  } catch (err) {
    console.error("listJobResults failed:", err);
    throw err;
  }
}

export async function deleteJobResult(id: string): Promise<boolean> {
  try {
    const fileName = `${id}.json`;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([fileName]);

    if (error) throw new Error(error.message);

    console.log(`Deleted JSON: ${fileName}`);
    return true;
  } catch (err) {
    console.error(`Error deleting ${id}:`, err);
    return false;
  }
}

/**
 * (Optional) Get the public URL for a stored file
 * Works only if the bucket is public
 */
export function getReelPublicUrl(id: string): string {
  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(`${id}.json`);
  return data.publicUrl;
}