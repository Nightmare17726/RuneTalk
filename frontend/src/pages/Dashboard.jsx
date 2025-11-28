import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { storyAPI, progressAPI, vocabularyAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { Plus, Book, BookOpen, Trophy, Flame } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { stories, setStories, isPremium, addToast } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [storiesRes, statsRes, vocabStatsRes] = await Promise.all([
        storyAPI.getAll(),
        progressAPI.getStats(),
        vocabularyAPI.getStats(),
      ]);

      setStories(storiesRes.data);
      setStats({
        ...statsRes.data,
        ...vocabStatsRes.data,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      addToast({ title: 'Failed to load dashboard', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Continue your language learning journey
            </p>
          </div>
          <Button onClick={() => navigate('/create')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Story
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stories_read || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chapters_completed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Words Learned</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_words || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reading_streak || 0} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Stories */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Stories</h2>
          {stories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first AI-powered language learning story
                </p>
                <Button onClick={() => navigate('/create')}>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Story
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card
                  key={story.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/story/${story.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {story.genre} • {story.target_language}
                        </CardDescription>
                      </div>
                      {story.is_bookmarked && (
                        <span className="text-yellow-500">⭐</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          Chapter {story.current_chapter}/{story.total_chapters}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${(story.current_chapter / story.total_chapters) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
