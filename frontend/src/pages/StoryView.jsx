import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { storyAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { BookOpen, Plus, Trash2, Bookmark } from 'lucide-react';

export default function StoryView() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      const [storyRes, chaptersRes] = await Promise.all([
        storyAPI.getOne(storyId),
        storyAPI.getChapters(storyId),
      ]);

      setStory(storyRes.data);
      setChapters(chaptersRes.data);
    } catch (error) {
      console.error('Failed to load story:', error);
      addToast({ title: 'Failed to load story', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generateNextChapter = async () => {
    setGenerating(true);

    try {
      const res = await storyAPI.generateChapter(storyId);
      setChapters([...chapters, res.data]);
      setStory({ ...story, total_chapters: story.total_chapters + 1 });
      addToast({ title: 'Chapter generated!', type: 'success' });
    } catch (error) {
      if (error.response?.data?.upgradeRequired) {
        addToast({
          title: 'Daily limit reached',
          description: 'Upgrade to Premium for unlimited chapters',
          type: 'error',
        });
      } else {
        addToast({ title: 'Failed to generate chapter', type: 'error' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const deleteStory = async () => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      await storyAPI.delete(storyId);
      addToast({ title: 'Story deleted', type: 'success' });
      navigate('/dashboard');
    } catch (error) {
      addToast({ title: 'Failed to delete story', type: 'error' });
    }
  };

  const toggleBookmark = async () => {
    try {
      await storyAPI.toggleBookmark(storyId);
      setStory({ ...story, is_bookmarked: !story.is_bookmarked });
    } catch (error) {
      addToast({ title: 'Failed to update bookmark', type: 'error' });
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
      <div className="max-w-4xl mx-auto">
        {/* Story Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{story?.title}</h1>
              <p className="text-muted-foreground">
                {story?.genre} • Learning {story?.target_language} from {story?.native_language} • {story?.difficulty_level}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                <Bookmark className={`h-5 w-5 ${story?.is_bookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
              <Button variant="destructive" size="icon" onClick={deleteStory}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {story?.description && (
            <p className="text-muted-foreground">{story.description}</p>
          )}
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chapters</h2>
            <Button onClick={generateNextChapter} disabled={generating}>
              {generating ? (
                <>
                  <div className="spinner mr-2 !w-5 !h-5 !border-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Generate Next Chapter
                </>
              )}
            </Button>
          </div>

          {chapters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No chapters yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <Card
                  key={chapter.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/story/${storyId}/chapter/${chapter.chapter_number}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          Chapter {chapter.chapter_number}: {chapter.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {chapter.native_percentage}% {story.native_language} / {chapter.target_percentage}% {story.target_language}
                        </p>
                      </div>
                      <Button variant="ghost">
                        Read →
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
