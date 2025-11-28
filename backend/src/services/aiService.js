import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../config/database.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cost tracking (approximate per 1k tokens)
const PRICING = {
  openai: { input: 0.003, output: 0.006 },
  gemini: { input: 0.00025, output: 0.0005 }
};

export const selectProvider = () => {
  // Use Gemini by default (cheaper), fallback to OpenAI
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  throw new Error('No AI provider configured');
};

export const generateStoryChapter = async (params) => {
  const {
    userId,
    storyId,
    chapterNumber,
    genre,
    nativeLanguage,
    targetLanguage,
    difficulty,
    previousContext,
    characters,
    plotSummary
  } = params;

  // Calculate language mixing percentage
  const targetPercentage = Math.min(10 + (chapterNumber - 1) * 10, 90);
  const nativePercentage = 100 - targetPercentage;

  const prompt = buildStoryPrompt({
    genre,
    nativeLanguage,
    targetLanguage,
    difficulty,
    chapterNumber,
    nativePercentage,
    targetPercentage,
    previousContext,
    characters,
    plotSummary
  });

  const provider = selectProvider();
  const startTime = Date.now();

  let content, tokensUsed, cost;

  if (provider === 'gemini') {
    const result = await generateWithGemini(prompt);
    content = result.content;
    tokensUsed = result.tokens;
    cost = (tokensUsed / 1000) * (PRICING.gemini.input + PRICING.gemini.output) / 2;
  } else {
    const result = await generateWithOpenAI(prompt);
    content = result.content;
    tokensUsed = result.tokens;
    cost = (tokensUsed / 1000) * (PRICING.openai.input + PRICING.openai.output) / 2;
  }

  const responseTime = Date.now() - startTime;

  // Log usage
  await query(
    `INSERT INTO ai_usage (user_id, provider, operation_type, tokens_used, cost_usd, response_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, provider, 'story_generation', tokensUsed, cost, responseTime]
  );

  // Parse the generated content
  const parsed = parseStoryContent(content, targetLanguage);

  return {
    content: parsed.text,
    highlightedWords: parsed.highlightedWords,
    grammarNotes: parsed.grammarNotes,
    title: parsed.title,
    nativePercentage,
    targetPercentage
  };
};

async function generateWithOpenAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 2000
  });

  return {
    content: completion.choices[0].message.content,
    tokens: completion.usage.total_tokens
  };
}

async function generateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const response = await result.response;

  return {
    content: response.text(),
    tokens: response.text().split(' ').length * 1.3 // Approximate
  };
}

function buildStoryPrompt(params) {
  const {
    genre,
    nativeLanguage,
    targetLanguage,
    difficulty,
    chapterNumber,
    nativePercentage,
    targetPercentage,
    previousContext,
    characters,
    plotSummary
  } = params;

  return `You are a language learning story generator for RuneTalk.

Generate Chapter ${chapterNumber} of a ${genre} story that teaches ${targetLanguage} to ${nativeLanguage} speakers.

LANGUAGE MIXING RULES:
- ${nativePercentage}% in ${nativeLanguage}
- ${targetPercentage}% in ${targetLanguage}
- Gradually introduce ${targetLanguage} words and phrases naturally
- Use ${targetLanguage} for common words, greetings, simple phrases first
- Mark all ${targetLanguage} words with <target>word</target> tags
- Provide inline translations: <target data-translation="hello">bonjour</target>

DIFFICULTY LEVEL: ${difficulty}
- beginner: Simple sentences, common words, present tense
- intermediate: Varied sentence structure, past/future tense, idioms
- advanced: Complex grammar, literary style, cultural references

${previousContext ? `PREVIOUS CONTEXT:\n${previousContext}\n` : ''}
${characters ? `CHARACTERS:\n${JSON.stringify(characters)}\n` : ''}
${plotSummary ? `PLOT:\n${plotSummary}\n` : ''}

GRAMMAR NOTES:
Include 3-5 grammar explanations in this format:
<grammar type="verb_conjugation" word="palabra">Explanation here</grammar>

OUTPUT FORMAT:
{
  "title": "Chapter ${chapterNumber} Title",
  "content": "The story content with <target> tags...",
  "grammarNotes": [
    {"type": "verb_conjugation", "word": "word", "explanation": "..."},
  ]
}

Generate an engaging, immersive chapter that maintains narrative flow while teaching effectively.`;
}

function parseStoryContent(content, targetLanguage) {
  try {
    const parsed = JSON.parse(content);

    // Extract highlighted words
    const highlightedWords = [];
    const targetRegex = /<target data-translation="([^"]+)">([^<]+)<\/target>/g;
    let match;

    while ((match = targetRegex.exec(parsed.content)) !== null) {
      highlightedWords.push({
        word: match[2],
        translation: match[1],
        language: targetLanguage
      });
    }

    return {
      title: parsed.title,
      text: parsed.content,
      highlightedWords,
      grammarNotes: parsed.grammarNotes || []
    };
  } catch (error) {
    // Fallback parsing
    return {
      title: `Chapter`,
      text: content,
      highlightedWords: [],
      grammarNotes: []
    };
  }
}

export const generateQuiz = async (chapterId, content, targetLanguage, difficulty) => {
  const prompt = `Generate a 5-question quiz for language learners based on this chapter content.

CONTENT:
${content}

TARGET LANGUAGE: ${targetLanguage}
DIFFICULTY: ${difficulty}

Create questions that test:
1. Vocabulary comprehension
2. Grammar understanding
3. Reading comprehension
4. Cultural context
5. Sentence construction

OUTPUT JSON FORMAT:
{
  "questions": [
    {
      "question": "What does 'palabra' mean?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}`;

  const provider = selectProvider();

  if (provider === 'gemini') {
    const result = await generateWithGemini(prompt);
    return JSON.parse(result.content);
  } else {
    const result = await generateWithOpenAI(prompt);
    return JSON.parse(result.content);
  }
};

export const generateTranslation = async (word, fromLang, toLang) => {
  const prompt = `Translate "${word}" from ${fromLang} to ${toLang}.

  Provide:
  1. Direct translation
  2. Part of speech
  3. Example sentence in ${fromLang}
  4. Example sentence in ${toLang}

  JSON format:
  {
    "translation": "...",
    "partOfSpeech": "...",
    "exampleFrom": "...",
    "exampleTo": "..."
  }`;

  const provider = selectProvider();

  if (provider === 'gemini') {
    const result = await generateWithGemini(prompt);
    return JSON.parse(result.content);
  } else {
    const result = await generateWithOpenAI(prompt);
    return JSON.parse(result.content);
  }
};
