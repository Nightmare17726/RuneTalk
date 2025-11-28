import { create } from 'zustand';
import { auth } from '../lib/firebase';

export const useStore = create((set, get) => ({
  // Auth state
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),

  // UI state
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () => {
    const newMode = !get().darkMode;
    localStorage.setItem('darkMode', newMode);
    set({ darkMode: newMode });
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Stories state
  stories: [],
  currentStory: null,
  setStories: (stories) => set({ stories }),
  setCurrentStory: (story) => set({ currentStory: story }),

  // Reader state
  currentChapter: null,
  chapters: [],
  readingProgress: 0,
  languageMixPercentage: null,
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setChapters: (chapters) => set({ chapters }),
  setReadingProgress: (progress) => set({ readingProgress: progress }),
  setLanguageMixPercentage: (percentage) => set({ languageMixPercentage: percentage }),

  // Vocabulary state
  vocabulary: [],
  vocabularyStats: null,
  setVocabulary: (vocabulary) => set({ vocabulary }),
  setVocabularyStats: (stats) => set({ vocabularyStats: stats }),

  // Subscription state
  subscription: null,
  isPremium: false,
  setSubscription: (subscription) => set({
    subscription,
    isPremium: subscription?.isPremium || false
  }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, toast.duration || 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));

// Initialize dark mode
if (useStore.getState().darkMode) {
  document.documentElement.classList.add('dark');
}

// Listen to auth state
auth.onAuthStateChanged((user) => {
  useStore.getState().setUser(user);
});
