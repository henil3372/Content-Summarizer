import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface OCRResult {
  extractedText: string;
  metadata: {
    confidence?: string;
    processingTimeMs: number;
    model: string;
  };
}

export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all visible text from this image. Return only the extracted text, maintaining the original structure and formatting as much as possible. If there is no text, respond with "No text found."'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const extractedText = response.choices[0]?.message?.content || 'No text found.';
    const processingTimeMs = Date.now() - startTime;

    return {
      extractedText,
      metadata: {
        confidence: 'high',
        processingTimeMs,
        model: 'gpt-4o'
      }
    };
  } catch (error: any) {
    console.error('OCR extraction failed:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext || 'jpg'] || 'image/jpeg';
}
