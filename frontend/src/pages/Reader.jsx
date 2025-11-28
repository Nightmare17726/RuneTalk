import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { storyAPI, progressAPI, vocabularyAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight, BookmarkPlus, Volume2, Settings } from 'lucide-react';

export default function Reader() {
  const { storyId, chapterNumber } = useParams();
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [story, setStory] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(null);
  const contentRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    loadChapter();
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [storyId, chapterNumber]);

  useEffect(() => {
    if (chapter) {
      // Track reading progress every 10 seconds
      progressInterval.current = setInterval(() => {
        saveProgress();
      }, 10000);
    }
  }, [chapter]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const [storyRes, chapterRes, chaptersRes] = await Promise.all([
        storyAPI.getOne(storyId),
        storyAPI.getChapter(storyId, chapterNumber),
        storyAPI.getChapters(storyId),
      ]);

      setStory(storyRes.data);
      setChapter(chapterRes.data);
      setChapters(chaptersRes.data);
    } catch (error) {
      console.error('Failed to load chapter:', error);
      addToast({ title: 'Failed to load chapter', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!contentRef.current) return;

    const scrollPercentage = (contentRef.current.scrollTop / contentRef.current.scrollHeight) * 100;

    try {
      await progressAPI.update({
        storyId: story.id,
        chapterId: chapter.id,
        completionPercentage: Math.min(100, Math.round(scrollPercentage)),
        lastPosition: contentRef.current.scrollTop,
        timeSpent: 10, // 10 seconds interval
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleWordClick = (word, translation) => {
    setShowTranslation({ word, translation });
  };

  const saveWord = async (word, translation) => {
    try {
      await vocabularyAPI.save({
        storyId: story.id,
        chapterId: chapter.id,
        word,
        translation,
        language: story.target_language,
        contextSentence: '',
        partOfSpeech: '',
        difficulty: story.difficulty_level,
      });

      addToast({ title: 'Word saved!', type: 'success' });
    } catch (error) {
      if (error.response?.data?.upgradeRequired) {
        addToast({
          title: 'Vocabulary limit reached',
          description: 'Upgrade to Premium for unlimited vocabulary',
          type: 'error',
        });
      } else {
        addToast({ title: 'Failed to save word', type: 'error' });
      }
    }
  };

  const renderContent = () => {
    if (!chapter) return null;

    const highlightedWords = chapter.highlighted_words || [];
    let content = chapter.content;

    // Replace target word tags with interactive spans
    const targetRegex = /<target data-translation="([^"]+)">([^<]+)<\/target>/g;

    content = content.replace(targetRegex, (match, translation, word) => {
      return `<span class="target-word" data-word="${word}" data-translation="${translation}">${word}<span class="translation-tooltip">${translation}</span></span>`;
    });

    return (
      <div
        className="reading-mode prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
        onClick={(e) => {
          if (e.target.classList.contains('target-word')) {
            const word = e.target.dataset.word;
            const translation = e.target.dataset.translation;
            handleWordClick(word, translation);
          }
        }}
      />
    );
  };

  const goToChapter = (num) => {
    navigate(`/story/${storyId}/chapter/${num}`);
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

  const currentChapterNum = parseInt(chapterNumber);
  const hasNext = currentChapterNum < chapters.length;
  const hasPrev = currentChapterNum > 1;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Reader Header */}
        <div className="mb-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate(`/story/${storyId}`)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Story
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Volume2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{chapter?.title}</h1>
              <p className="text-muted-foreground mt-1">
                Chapter {currentChapterNum} of {chapters.length} • {chapter?.native_percentage}% {story?.native_language} / {chapter?.target_percentage}% {story?.target_language}
              </p>
            </div>
          </div>
        </div>

        {/* Chapter Content */}
        <div ref={contentRef} className="mb-8 min-h-[400px]">
          {renderContent()}
        </div>

        {/* Grammar Notes */}
        {chapter?.grammar_notes && chapter.grammar_notes.length > 0 && (
          <div className="mb-8 p-6 bg-primary/5 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Grammar Notes</h3>
            <div className="space-y-4">
              {chapter.grammar_notes.map((note, i) => (
                <div key={i} className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">{note.word}</h4>
                  <p className="text-sm text-muted-foreground">{note.type}</p>
                  <p className="mt-2">{note.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between py-6 border-t">
          <Button
            variant="outline"
            onClick={() => goToChapter(currentChapterNum - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Chapter
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentChapterNum} / {chapters.length}
          </span>

          <Button
            onClick={() => goToChapter(currentChapterNum + 1)}
            disabled={!hasNext}
          >
            Next Chapter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Word Translation Modal */}
        {showTranslation && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowTranslation(null)}
          >
            <div
              className="bg-card p-6 rounded-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-2">{showTranslation.word}</h3>
              <p className="text-muted-foreground mb-4">{showTranslation.translation}</p>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    saveWord(showTranslation.word, showTranslation.translation);
                    setShowTranslation(null);
                  }}
                  className="flex-1"
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save Word
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTranslation(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
