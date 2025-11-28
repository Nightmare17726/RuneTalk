import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { vocabularyAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { BookmarkPlus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';

export default function Vocabulary() {
  const { vocabulary, setVocabulary, vocabularyStats, setVocabularyStats, addToast } = useStore();
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewWords, setReviewWords] = useState([]);
  const [currentReview, setCurrentReview] = useState(null);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      const [vocabRes, statsRes] = await Promise.all([
        vocabularyAPI.getAll(),
        vocabularyAPI.getStats(),
      ]);

      setVocabulary(vocabRes.data);
      setVocabularyStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      addToast({ title: 'Failed to load vocabulary', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startReview = async () => {
    try {
      const res = await vocabularyAPI.getReview();
      setReviewWords(res.data);

      if (res.data.length === 0) {
        addToast({ title: 'No words due for review!', type: 'success' });
      } else {
        setCurrentReview(res.data[0]);
        setReviewing(true);
      }
    } catch (error) {
      addToast({ title: 'Failed to load review words', type: 'error' });
    }
  };

  const handleReview = async (correct) => {
    if (!currentReview) return;

    try {
      await vocabularyAPI.updateReview(currentReview.id, correct);

      const nextWords = reviewWords.slice(1);
      setReviewWords(nextWords);

      if (nextWords.length > 0) {
        setCurrentReview(nextWords[0]);
      } else {
        setReviewing(false);
        setCurrentReview(null);
        addToast({ title: 'Review complete!', type: 'success' });
        loadVocabulary();
      }
    } catch (error) {
      addToast({ title: 'Failed to update review', type: 'error' });
    }
  };

  const deleteWord = async (id) => {
    try {
      await vocabularyAPI.delete(id);
      setVocabulary(vocabulary.filter((v) => v.id !== id));
      addToast({ title: 'Word deleted', type: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete word', type: 'error' });
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

  if (reviewing && currentReview) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center">Vocabulary Review</CardTitle>
              <p className="text-center text-muted-foreground">
                {reviewWords.length} words remaining
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-2">Translate this word:</p>
                <h2 className="text-5xl font-bold mb-8">{currentReview.word}</h2>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      alert(`Translation: ${currentReview.translation}`);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Show Translation
                  </Button>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleReview(false)}
                      variant="destructive"
                      className="flex-1"
                    >
                      ✗ Incorrect
                    </Button>
                    <Button
                      onClick={() => handleReview(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      ✓ Correct
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Vocabulary</h1>
            <p className="text-muted-foreground mt-2">Your saved words and review progress</p>
          </div>
          <Button onClick={startReview} size="lg">
            <RefreshCw className="h-5 w-5 mr-2" />
            Start Review
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabularyStats?.total_words || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mastered</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabularyStats?.mastered_words || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
              <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabularyStats?.languages || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabularyStats?.due_for_review || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Word List */}
        <Card>
          <CardHeader>
            <CardTitle>All Words</CardTitle>
          </CardHeader>
          <CardContent>
            {vocabulary.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No saved words yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on words while reading to save them
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {vocabulary.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">{word.word}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-lg">{word.translation}</span>
                      </div>
                      {word.context_sentence && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{word.context_sentence}"
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Mastery: {word.mastery_level}/5</span>
                        <span>Reviewed: {word.times_reviewed} times</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWord(word.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
