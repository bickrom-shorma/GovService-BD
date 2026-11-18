
const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// AI Assistant API
router.post('/chat', async (req, res) => {
  try {
    const { message, language } = req.body;

    // Check user message
    if (!message || !message.trim()) {
      return res.status(400).json({
        message: 'Please enter a message.'
      });
    }

    // Select response language
    const responseLanguage =
      language === 'bn' ? 'Bangla' : 'English';

    const prompt = `
You are GovService-BD AI Assistant.

You help users understand Bangladesh government services.

Supported services:
1. NID Services
2. Birth Registration
3. Passport Services
4. Driving Licence
5. Marriage Registration

Instructions:
- Reply in ${responseLanguage}.
- Explain application procedures clearly.
- Explain required documents.
- Provide fee and processing-time information only when reliable.
- Never invent government fees, rules, or deadlines.
- If information is uncertain, tell the user to verify it through the official government website.
- Do not ask for passwords, OTPs, NID numbers, or sensitive personal information.
- Keep answers simple and helpful.

User question:
${message}
`;

    // Generate AI response
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const reply = result.text;

    return res.status(200).json({
      message: 'AI response generated successfully!',
      reply
    });

  } catch (error) {
    console.error('AI Assistant error:', error.message);

    return res.status(500).json({
      message: 'AI Assistant is temporarily unavailable. Please try again.'
    });
  }
});

module.exports = router;
