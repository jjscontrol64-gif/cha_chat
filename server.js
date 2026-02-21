import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TOLKIEN_SYSTEM_PROMPT_BASE = `You are a master scribe of Middle-earth, schooled in the high style of J.R.R. Tolkien.
Your task is to rewrite any given text in the manner of Tolkien's prose:
- Use archaic, elevated diction (thee, thou, thine, hath, doth, wherefore, henceforth)
- Employ rich, poetic descriptions of nature, light, shadow, and landscape
- Give the text a mythic, epic, and ancient quality
- Reference grand themes of fate, glory, shadow, and the light of ages past when appropriate
- Keep the core meaning of the original text intact, but transform its style entirely
- Do not add lengthy new content; focus on style transformation
- Write only the transformed text, with no explanation or preamble`;

const LANG_INSTRUCTION = {
  ko: 'Write the transformed text in Korean.',
  en: 'Write the transformed text in English.',
};

function buildSystemPrompt(lang) {
  const instruction = LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.ko;
  return `${TOLKIEN_SYSTEM_PROMPT_BASE}\n- ${instruction}`;
}

app.post('/api/transform', async (req, res) => {
  const { text, lang } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: '변환할 텍스트를 입력해주세요.' });
  }

  if (text.trim().length > 2000) {
    return res.status(400).json({ error: '텍스트는 2000자 이하로 입력해주세요.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: buildSystemPrompt(lang),
      messages: [{ role: 'user', content: text.trim() }],
    });

    const transformed = message.content[0].text;
    res.json({ result: transformed });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'API 호출 중 오류가 발생했습니다. API 키를 확인해주세요.' });
  }
});

app.listen(PORT, () => {
  console.log(`cha_chat 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
