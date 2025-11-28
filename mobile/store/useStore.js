import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),

  stories: [],
  setStories: (stories) => set({ stories }),

  currentStory: null,
  currentChapter: null,
  setCurrentStory: (story) => set({ currentStory: story }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

  subscription: null,
  isPremium: false,
  setSubscription: (subscription) => set({
    subscription,
    isPremium: subscription?.isPremium || false
  }),

  offlineStories: [],
  addOfflineStory: (story) => set((state) => ({
    offlineStories: [...state.offlineStories, story]
  })),
  removeOfflineStory: (storyId) => set((state) => ({
    offlineStories: state.offlineStories.filter(s => s.id !== storyId)
  })),
}));
