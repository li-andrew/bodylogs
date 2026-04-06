import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authenticate } from '../../middleware/auth.js';
import db from '../../config/db.js';

const router = Router();
router.use(authenticate);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSE_SYSTEM = `You are a nutrition expert. The user will describe one or more foods they ate.
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

const UPDATE_SYSTEM = `You are a nutrition expert. The user has an existing food log entry and wants to update it based on an instruction. Return ONLY a valid JSON object with the updated fields: name, grams, cal, protein, carbs, fat, sodium, sugar. Respond with ONLY the JSON object. No markdown, no explanation.`;

async function checkPremium(userId) {
  const result = await db.query('SELECT 1 FROM premium_users WHERE user_id = $1', [userId]);
  return result.rows.length > 0;
}

router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    if (!(await checkPremium(req.userId))) return res.status(403).json({ error: 'Premium feature' });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: PARSE_SYSTEM,
      messages: [{ role: 'user', content: text }],
    });

    const raw = message.content[0].text.trim();
    const match = raw.match(/\[[\s\S]*\]/) ?? raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No JSON in AI response' });
    const parsed = JSON.parse(match[0]);
    res.json(Array.isArray(parsed) ? parsed : [parsed]);
  } catch (err) {
    console.error('AI parse error:', err.message);
    res.status(500).json({ error: 'Failed to parse food' });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { entry, instruction } = req.body;
    if (!entry || !instruction) return res.status(400).json({ error: 'entry and instruction are required' });
    if (!(await checkPremium(req.userId))) return res.status(403).json({ error: 'Premium feature' });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: UPDATE_SYSTEM,
      messages: [{
        role: 'user',
        content: `Current entry: ${JSON.stringify(entry)}\n\nInstruction: ${instruction}`,
      }],
    });

    const raw = message.content[0].text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No JSON in AI response' });
    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('AI update error:', err.message);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

export default router;
