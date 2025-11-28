import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { storyAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { LANGUAGES, GENRES, DIFFICULTY_LEVELS } from '../lib/utils';
import { Sparkles } from 'lucide-react';

export default function CreateStory() {
  const navigate = useNavigate();
  const addToast = useStore((state) => state.addToast);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Fantasy',
    nativeLanguage: 'en',
    targetLanguage: 'es',
    difficultyLevel: 'beginner',
    description: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await storyAPI.create(formData);
      addToast({
        title: 'Story created!',
        description: 'Your first chapter has been generated',
        type: 'success',
      });
      navigate(`/story/${response.data.story.id}`);
    } catch (error) {
      console.error('Failed to create story:', error);

      if (error.response?.data?.upgradeRequired) {
        addToast({
          title: 'Daily limit reached',
          description: 'Upgrade to Premium for unlimited stories',
          type: 'error',
        });
        navigate('/subscription');
      } else {
        addToast({
          title: 'Failed to create story',
          description: error.response?.data?.error || 'Please try again',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Create Your Story
            </CardTitle>
            <CardDescription>
              AI will generate an immersive story that teaches you a new language
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Story Title</label>
                <Input
                  name="title"
                  placeholder="Enter a title or let AI generate one"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <Select name="genre" value={formData.genre} onChange={handleChange}>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Native Language
                  </label>
                  <Select
                    name="nativeLanguage"
                    value={formData.nativeLanguage}
                    onChange={handleChange}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Language to Learn
                  </label>
                  <Select
                    name="targetLanguage"
                    value={formData.targetLanguage}
                    onChange={handleChange}
                  >
                    {LANGUAGES.filter((l) => l.code !== formData.nativeLanguage).map(
                      (lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      )
                    )}
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <Select
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleChange}
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Story Description (Optional)
                </label>
                <textarea
                  name="description"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Describe the type of story you want... or leave blank for AI to surprise you"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="spinner mr-2 !w-5 !h-5 !border-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create Story
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
