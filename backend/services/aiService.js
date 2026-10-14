import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Service to interact with the Google Gemini API using @google/genai SDK.
 */
class AIService {
  constructor() {
    this.client = null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  /**
   * Lazily initialize client to allow .env loading and dynamic configuration.
   */
  getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_actual_api_key' || apiKey === 'your_gemini_api_key_here') {
      const err = new Error(
        'GEMINI_API_KEY is not configured on the backend. Please add your valid Gemini API key to backend/.env and restart the server.'
      );
      err.statusCode = 503;
      err.isConfigError = true;
      throw err;
    }

    if (!this.client || this.currentApiKey !== apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.currentApiKey = apiKey;
    }
    return this.client;
  }

  /**
   * Safely parse JSON from model output, handling potential markdown code blocks or trailing text.
   */
  cleanAndParseJSON(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Received empty response from AI model.');
    }

    let cleaned = rawText.trim();

    // Strip Markdown code fences if present (```json ... ``` or ``` ...)
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/, '');
      cleaned = cleaned.trim();
    }

    // If there is any surrounding text before first '{' or after last '}'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;

    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    if (startIdx > 0) {
      cleaned = cleaned.substring(startIdx);
    }

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);

    if (endIdx !== -1 && endIdx < cleaned.length - 1) {
      cleaned = cleaned.substring(0, endIdx + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Failed to parse AI response as valid JSON: ${parseError.message}. Content snippet: "${cleaned.slice(0, 160)}..."`);
    }
  }

  /**
   * Generates structured JSON output using Gemini API.
   * Tries generateContent with responseMimeType & responseSchema first,
   * with fallback to interaction or prompt-enforced JSON.
   */
  async generateStructuredJSON({ systemInstruction, prompt, schema, agentName = 'Agent' }) {
    const client = this.getClient();

    const config = {
      responseMimeType: 'application/json',
    };

    if (schema) {
      config.responseSchema = schema;
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    // Try configured model, with automatic fallback if the model is experiencing high demand (503)
    const modelsToTry = [
      this.modelName,
      this.modelName !== 'gemini-3.5-flash-lite' ? 'gemini-3.5-flash-lite' : null,
      'gemini-3.1-flash-lite',
    ].filter(Boolean);

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
        if (responseText) {
          return this.cleanAndParseJSON(responseText);
        }
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();

        // If auth or quota error, do not retry other models — rethrow immediately
        if (err.isConfigError) throw err;
        if (msg.includes('api key not valid') || msg.includes('api_key_invalid') || err.status === 401 || err.status === 403) {
          const authErr = new Error('The configured GEMINI_API_KEY is invalid or unauthorized. Please verify your API key in backend/.env.');
          authErr.statusCode = 401;
          throw authErr;
        }
        if (msg.includes('quota') || msg.includes('resource_exhausted') || err.status === 429) {
          const rateErr = new Error('Gemini API rate limit or quota exceeded. Please wait a few moments and try again.');
          rateErr.statusCode = 429;
          throw rateErr;
        }

        // If 503 / high demand, log and try next fallback model
        if (msg.includes('high demand') || msg.includes('unavailable') || err.status === 503) {
          console.warn(`[AIService] Model ${model} is experiencing high demand (503). Attempting fallback...`);
          await new Promise((res) => setTimeout(res, 800));
          continue;
        }

        // For other errors, try interaction API fallback if available
        if (client.interactions?.create) {
          try {
            const interaction = await client.interactions.create({
              model,
              input: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}\n\nIMPORTANT: Respond with pure, valid JSON only matching the schema. No markdown formatting.`,
              response_format: schema ? {
                type: 'text',
                mime_type: 'application/json',
                schema,
              } : undefined,
            });

            if (interaction.output_text) {
              return this.cleanAndParseJSON(interaction.output_text);
            }
          } catch (intErr) {
            // Continue loop
          }
        }
      }
    }

    console.error(`[AIService] All model attempts failed for ${agentName}:`, lastError?.message);
    const finalErr = new Error(`AI generation error in ${agentName}: ${lastError?.message || 'Model temporarily unavailable'}`);
    finalErr.statusCode = lastError?.statusCode || lastError?.status || 500;
    throw finalErr;
  }
}

export const aiService = new AIService();
