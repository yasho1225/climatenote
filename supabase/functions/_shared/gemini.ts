/** Current Gemini model for generateContent (1.5/2.0 families are shut down). */
export const GEMINI_MODEL = 'gemini-2.5-flash';

export function geminiGenerateContentUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

export async function callGeminiGenerateContent(
  apiKey: string,
  prompt: string,
  generationConfig: Record<string, unknown> = {},
  options?: { jsonMode?: boolean },
): Promise<string> {
  const config = { ...generationConfig };
  if (options?.jsonMode) {
    config.responseMimeType = 'application/json';
  }

  const response = await fetch(geminiGenerateContentUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: config,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini error: ${response.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) throw new Error('Empty Gemini response');
  return raw;
}
