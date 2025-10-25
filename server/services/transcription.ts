import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
import { TranscriptSegment } from '../types';
import { deleteTempFile } from '../utils/filesystem';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TRANSCRIPTION_MODEL = process.env.TRANSCRIPTION_MODEL || 'whisper-1';

interface TranscriptionResult {
  transcript: {
    text: string;
    segments?: TranscriptSegment[];
  };
  language?: string;
  segments?: TranscriptSegment[];
}

export async function transcribeAudio(videoPath: string): Promise<TranscriptionResult> {
  try {
    const stats = fs.statSync(videoPath);
    if (stats.size > 25 * 1024 * 1024) {
      throw new Error('Video file exceeds 25MB limit for transcription');
    }

    const fileStream = fs.createReadStream(videoPath);

    let transcription: any;

    if (TRANSCRIPTION_MODEL === 'whisper-1') {
      transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: TRANSCRIPTION_MODEL,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });
    } else {
      transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: TRANSCRIPTION_MODEL,
        response_format: 'json'
      });
    }

    await deleteTempFile(videoPath);

    const segments: TranscriptSegment[] | undefined = transcription.segments?.map((seg: any, idx: number) => ({
      id: idx,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim()
    }));

    return {
      transcript: {
        text: transcription.text,
        segments
      },
      language: transcription.language,
      segments
    };

  } catch (error: any) {
    await deleteTempFile(videoPath);

    if (error.message?.includes('unsupported')) {
      throw new Error('Unsupported audio format. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm');
    }

    if (error.message?.includes('limit') || error.message?.includes('25')) {
      throw new Error('Audio file too large. Maximum size is 25MB.');
    }

    throw new Error(`Transcription failed: ${error.message}`);
  }
}
