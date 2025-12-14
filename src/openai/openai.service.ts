import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment variables');
    }

    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const res = await this.client.chat.completions.create({
      model,
      messages,
      temperature: 0,
    });

    return res.choices[0]?.message?.content ?? '';
  }
}
