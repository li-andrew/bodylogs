import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a nutrition expert. The user will describe one or more foods they ate.
Split distinct foods into separate items and return a JSON array. Each item has:
- name: string (concise food name)
- grams: number (the serving weight in grams you are using for this entry, integer)
- cal: number (total calories, integer)
- protein: number (grams, one decimal)
- carbs: number (grams, one decimal)
- fat: number (grams, one decimal)
- sodium: number (milligrams, integer)
- sugar: number (grams, one decimal)

Use standard nutrition databases for estimates. If amounts are unspecified, assume a typical serving.
Respond with ONLY the JSON array. No markdown, no explanation.`;

/**
 * Update an existing entry using a natural-language instruction.
 */
export async function updateFoodEntry(entry, instruction) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are a nutrition expert. The user has an existing food log entry and wants to update it based on an instruction. Return ONLY a valid JSON object with the updated fields: name, grams, cal, protein, carbs, fat, sodium, sugar. Respond with ONLY the JSON object. No markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Current entry: ${JSON.stringify(entry)}\n\nInstruction: ${instruction}`,
    }],
  });

  const raw = message.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in response: ${raw}`);
  return JSON.parse(match[0]);
}

/**
 * Parse a natural-language food description into one or more macro entries.
 * @param {string} text - e.g. "apple, orange, chipotle bowl with beans and rice"
 * @returns {Promise<Array<{ name, cal, protein, carbs, fat, sodium, sugar }>>}
 */
export async function parseFoodEntry(text) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  const raw = message.content[0].text.trim();

  // Prefer array, fall back to single object, always return an array
  const match = raw.match(/\[[\s\S]*\]/) ?? raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in response: ${raw}`);
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed) ? parsed : [parsed];
}
