import OpenAI from 'openai';
import { Summary, TranscriptSegment } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SUMMARIZATION_MODEL = process.env.SUMMARIZATION_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are an expert at analyzing and summarizing short-form video content from social media.
Your task is to create faithful, concise summaries that capture the key points and essence of the content.

Return your response as a JSON object with this exact structure:
{
  "title": "A catchy, descriptive title (max 10 words)",
  "bullets": ["Five key points from the video", "Each bullet should be concise", "Focus on main ideas", "Include important details", "Make them actionable when possible"],
  "tldr": "A single sentence summary of the entire video",
  "entities": ["List of named entities mentioned", "People", "Places", "Products", "Organizations"],
  "keyMoments": [{"time": "0:15", "description": "What happens at this timestamp"}]
}

Guidelines:
- Be accurate and faithful to the source content
- Keep bullets concise but informative (1-2 sentences each)
- Extract all named entities (people, places, products, brands, organizations)
- For keyMoments, only include if timestamps are available and moments are significant
- If no clear entities or key moments, use empty arrays`;

export async function summarizeTranscript(
  transcriptText: string,
  segments?: TranscriptSegment[]
): Promise<Summary> {
  try {
    let userMessage = `Here is the transcript from an Instagram Reel:\n\n${transcriptText}`;

    if (segments && segments.length > 0) {
      userMessage += '\n\nTimestamped segments:\n';
      segments.forEach(seg => {
        const timestamp = formatTimestamp(seg.start);
        userMessage += `[${timestamp}] ${seg.text}\n`;
      });
    }

    const completion = await openai.chat.completions.create({
      model: SUMMARIZATION_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from summarization API');
    }

    const summary: Summary = JSON.parse(content);

    if (!summary.keyMoments || summary.keyMoments.length === 0) {
      delete summary.keyMoments;
    }

    return summary;

  } catch (error: any) {
    console.error('Summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
