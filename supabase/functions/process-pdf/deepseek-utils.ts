import { retryWithBackoff, ProcessingErrorHandler } from './error-handler.ts';
import { validateDeepseekResponse, validateJSON } from './validation-utils.ts';
import { DEEPSEEK_BASE_URL, DEFAULT_CONFIG } from './config.ts';
import { Logger } from './logger.ts';

export async function callDeepseek(
  prompt: string,
  systemPrompt: string = 'Você é um assistente especializado em análise literária.',
  options: { temperature?: number; maxTokens?: number } = {},
  logger?: Logger,
  phase: string = 'Deepseek Call'
): Promise<string> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    throw new ProcessingErrorHandler(
      'DEEPSEEK_API_KEY_MISSING',
      'DEEPSEEK_API_KEY environment variable not set',
      phase,
      false
    );
  }

  const temperature = options.temperature ?? DEFAULT_CONFIG.deepseekTemperature;
  const maxTokens = options.maxTokens ?? DEFAULT_CONFIG.deepseekMaxTokens;

  const makeRequest = async () => {
    logger?.info(phase, `Calling Deepseek API (temp: ${temperature}, tokens: ${maxTokens})`);

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_CONFIG.deepseekModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(DEFAULT_CONFIG.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger?.error(phase, `Deepseek API error: ${response.status}`, errorText);
      throw new ProcessingErrorHandler(
        'DEEPSEEK_API_ERROR',
        `Deepseek API returned ${response.status}: ${errorText}`,
        phase,
        [408, 429, 500, 502, 503, 504].includes(response.status)
      );
    }

    const data = await response.json();

    // Validate response
    const validation = validateDeepseekResponse(data);
    if (!validation.valid) {
      throw new ProcessingErrorHandler(
        'DEEPSEEK_RESPONSE_INVALID',
        `Invalid Deepseek response: ${validation.errors.join(', ')}`,
        phase,
        false,
        data
      );
    }

    const content = data.choices[0].message.content;
    logger?.debug(phase, 'Deepseek response received', { length: content.length });

    return content;
  };

  try {
    return await retryWithBackoff(makeRequest, DEFAULT_CONFIG.maxRetries, DEFAULT_CONFIG.retryDelay);
  } catch (error: any) {
    if (error instanceof ProcessingErrorHandler) {
      throw error;
    }
    throw new ProcessingErrorHandler(
      'DEEPSEEK_CALL_FAILED',
      error.message || 'Unknown error calling Deepseek',
      phase,
      true,
      error
    );
  }
}

/**
 * Extrai JSON da resposta do Deepseek
 */
export function extractJSON(text: string, logger?: Logger, phase: string = 'JSON Extraction'): any {
  try {
    // Remove markdown code blocks
    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const validation = validateJSON(jsonStr);
    if (!validation.valid) {
      throw new ProcessingErrorHandler(
        'JSON_PARSE_ERROR',
        `Failed to parse JSON: ${validation.error}`,
        phase,
        false,
        { originalText: text.substring(0, 500) }
      );
    }

    logger?.debug(phase, 'JSON extracted successfully');
    return validation.data;
  } catch (error: any) {
    if (error instanceof ProcessingErrorHandler) {
      throw error;
    }
    throw new ProcessingErrorHandler(
      'JSON_EXTRACTION_FAILED',
      error.message || 'Unknown error extracting JSON',
      phase,
      false,
      { text: text.substring(0, 500) }
    );
  }
}
