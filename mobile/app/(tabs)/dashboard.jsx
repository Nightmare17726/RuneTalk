import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { storyAPI, progressAPI } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const router = useRouter();
  const { stories, setStories } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [storiesRes, statsRes] = await Promise.all([
        storyAPI.getAll(),
        progressAPI.getStats(),
      ]);

      setStories(storiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-story')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.createButtonText}>New Story</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats?.stories_read || 0}</Text>
          <Text style={styles.statLabel}>Stories Read</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="bookmark" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats?.chapters_completed || 0}</Text>
          <Text style={styles.statLabel}>Chapters</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats?.total_words || 0}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#FF6B35" />
          <Text style={styles.statNumber}>{stats?.reading_streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Recent Stories */}
      <Text style={styles.sectionTitle}>Your Stories</Text>
      {stories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyText}>No stories yet</Text>
          <Text style={styles.emptySubtext}>Create your first story to start learning</Text>
        </View>
      ) : (
        <View style={styles.storiesContainer}>
          {stories.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={styles.storyCard}
              onPress={() => router.push(`/story/${story.id}`)}
            >
              <View style={styles.storyHeader}>
                <Text style={styles.storyTitle} numberOfLines={2}>
                  {story.title}
                </Text>
                {story.is_bookmarked && (
                  <Ionicons name="star" size={20} color="#FFD700" />
                )}
              </View>
              <Text style={styles.storyMeta}>
                {story.genre} • {story.target_language}
              </Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Chapter {story.current_chapter}/{story.total_chapters}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(story.current_chapter / story.total_chapters) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    margin: '1%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    padding: 20,
    paddingBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  storiesContainer: {
    padding: 10,
  },
  storyCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  storyMeta: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});
