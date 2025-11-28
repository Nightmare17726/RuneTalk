import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { progressAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { TrendingUp, BookOpen, Clock, Target } from 'lucide-react';
import { formatTime } from '../lib/utils';

export default function Analytics() {
  const { addToast } = useStore();
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        progressAPI.getAnalytics(),
        progressAPI.getStats(),
      ]);

      setAnalytics(analyticsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      addToast({ title: 'Failed to load analytics', type: 'error' });
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
        <div>
          <h1 className="text-4xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your language learning progress</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reading Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(stats?.total_time_seconds || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stories_read || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chapters_completed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats?.avg_completion || 0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Languages You're Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.languageStats?.map((lang, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{lang.target_language}</p>
                    <p className="text-sm text-muted-foreground">
                      {lang.story_count} stories • {lang.chapters_read} chapters
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{lang.chapters_read}</p>
                    <p className="text-sm text-muted-foreground">chapters</p>
                  </div>
                </div>
              ))}

              {(!analytics?.languageStats || analytics.languageStats.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Start reading stories to see your language progress
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Genre Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Genres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.genreStats?.map((genre, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium">{genre.genre}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{
                          width: `${(genre.count / analytics.genreStats[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {genre.count}
                    </span>
                  </div>
                </div>
              ))}

              {(!analytics?.genreStats || analytics.genreStats.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No genre data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
