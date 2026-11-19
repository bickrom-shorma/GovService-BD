const express = require('express');
const { GoogleGenAI, ThinkingLevel } = require('@google/genai');

const router = express.Router();

let aiClient = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// AI Assistant API
router.post('/chat', async (req, res) => {
  try {
    const client = getAIClient();
    if (!client) {
      return res.status(503).json({
        message: 'AI Assistant is not configured. Please add GEMINI_API_KEY in Settings > Secrets.'
      });
    }

    const message = String(req.body.message || '').trim();
    const language = req.body.language === 'bn' ? 'bn' : 'en';
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({
        message: 'Please enter a message.'
      });
    }

    const responseLanguage = language === 'bn' ? 'Bangla (বাংলা)' : 'English';

    const systemInstruction = `
You are GovService-BD AI Assistant, helping citizens understand Bangladesh government services.

Supported core service categories:
1. NID Services (services.nidw.gov.bd)
2. Birth Registration (bdris.gov.bd)
3. Passport Services (epassport.gov.bd)
4. Driving Licence (bsp.brta.gov.bd)
5. Marriage Registration (bdlaws.minlaw.gov.bd)

Strict Rules:
- Always reply in ${responseLanguage}.
- Explain application steps and required documents clearly and concisely.
- NEVER fabricate or invent government fees, statutory deadlines, or rules.
- Never falsely claim that an unofficial process or fee is government-approved.
- When fee/time/rule details depend on category, location, or current circular, explicitly state that users should verify current fees and rules on the official government portal.
- Do NOT ask users for passwords, OTPs, full NID numbers, or sensitive personal data.
`.trim();

    const formattedHistory = history
      .slice(-8)
      .filter((item) => item && typeof item.text === 'string' && item.text.trim())
      .map((item) => ({
        role: item.sender === 'user' ? 'user' : 'model',
        parts: [{ text: item.text.trim() }],
      }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    const withTimeout = (promise, ms) => {
      let timerId;
      return Promise.race([
        promise.finally(() => clearTimeout(timerId)),
        new Promise((_, reject) => {
          timerId = setTimeout(() => {
            const timeoutErr = new Error('AI request timed out.');
            timeoutErr.status = 503;
            reject(timeoutErr);
          }, ms);
        }),
      ]);
    };

    let result = null;
    try {
      result = await withTimeout(
        client.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        22000
      );
    } catch (primaryErr) {
      let primaryStatus = Number(primaryErr?.status || primaryErr?.statusCode || 0);
      if (!primaryStatus && typeof primaryErr?.message === 'string') {
        try {
          primaryStatus = Number(JSON.parse(primaryErr.message)?.error?.code || 0);
        } catch {
          // ignore
        }
      }
      if (primaryStatus === 503 || primaryStatus === 404 || primaryStatus === 429 || primaryStatus >= 500) {
        await new Promise((r) => setTimeout(r, 250));
        result = await withTimeout(
          client.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction,
            },
          }),
          22000
        );
      } else {
        throw primaryErr;
      }
    }

    const reply = (result.text || '').trim();
    if (!reply) {
      return res.status(502).json({
        message: 'AI Assistant returned an empty response. Please try again.'
      });
    }

    return res.status(200).json({
      message: 'AI response generated successfully!',
      reply
    });
  } catch (error) {
    let status = Number(error?.status || error?.statusCode || 0);
    if (!status && typeof error?.message === 'string') {
      try {
        const parsed = JSON.parse(error.message);
        status = Number(parsed?.error?.code || 0);
      } catch {
        // Not a JSON error message
      }
    }
    console.error('AI Assistant error:', status || 500, error.message);
    if (status === 400 || status === 403) {
      return res.status(status).json({
        message: 'AI service authorization failed. Please check GEMINI_API_KEY in Settings > Secrets.'
      });
    }
    if (status === 404) {
      return res.status(502).json({
        message: 'Configured AI model is currently unavailable.'
      });
    }
    if (status === 429) {
      return res.status(429).json({
        message: 'AI service rate limit reached. Please try again shortly.'
      });
    }
    if (status === 503) {
      return res.status(503).json({
        message: 'AI Assistant is temporarily unavailable. Please try again.'
      });
    }
    return res.status(500).json({
      message: 'AI Assistant is temporarily unavailable. Please try again.'
    });
  }
});

module.exports = router;
