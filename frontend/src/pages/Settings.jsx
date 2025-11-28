import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { userAPI, subscriptionAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { logout } from '../lib/firebase';
import { LANGUAGES } from '../lib/utils';
import { User, Bell, CreditCard, LogOut, Trash2 } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPremium, addToast, toggleDarkMode, darkMode } = useStore();
  const [profile, setProfile] = useState({
    display_name: '',
    native_language: 'en',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setProfile({
        display_name: res.data.display_name || '',
        native_language: res.data.native_language || 'en',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updateProfile(profile);
      addToast({ title: 'Profile updated!', type: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await subscriptionAPI.createPortal();
      window.location.href = res.data.url;
    } catch (error) {
      addToast({ title: 'Failed to open billing portal', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you'd have a delete account endpoint
      addToast({ title: 'Account deletion requested', type: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete account', type: 'error' });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" value={user?.email || ''} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Native Language</label>
                <Select
                  value={profile.native_language}
                  onChange={(e) => setProfile({ ...profile, native_language: e.target.value })}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Toggle dark mode for comfortable reading
                </p>
              </div>
              <Button onClick={toggleDarkMode} variant="outline">
                {darkMode ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPremium
                    ? 'You have access to all premium features'
                    : 'Upgrade to unlock unlimited stories and features'}
                </p>
              </div>
              {isPremium ? (
                <Button onClick={handleManageSubscription} variant="outline">
                  Manage
                </Button>
              ) : (
                <Button onClick={() => navigate('/subscription')}>
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>

            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="w-full justify-start"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>RuneTalk v1.0.0</p>
          <p className="mt-1">
            Need help? <a href="mailto:support@runetalk.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
