import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function parseStoryContent(content) {
  // Parse story content with target language tags
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');

  const targetWords = doc.querySelectorAll('target');
  const words = [];

  targetWords.forEach((word) => {
    words.push({
      word: word.textContent,
      translation: word.getAttribute('data-translation'),
    });
  });

  return { html: content, words };
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export const GENRES = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Adventure',
  'Historical Fiction',
  'Horror',
  'Comedy',
  'Drama',
];

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Simple vocabulary and grammar' },
  { value: 'intermediate', label: 'Intermediate', description: 'More complex sentences and tenses' },
  { value: 'advanced', label: 'Advanced', description: 'Native-level complexity' },
];
