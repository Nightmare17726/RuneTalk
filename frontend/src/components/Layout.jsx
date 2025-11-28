import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { logout } from '../lib/firebase';
import { Button } from './ui/Button';
import { BookOpen, Home, Library, TrendingUp, Settings, LogOut, Moon, Sun, Crown } from 'lucide-react';

export default function Layout({ children }) {
  const { user, darkMode, toggleDarkMode, isPremium } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return children;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <BookOpen className="h-8 w-8" />
              RuneTalk
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/library" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Library className="h-4 w-4" />
                My Stories
              </Link>
              <Link to="/analytics" className="flex items-center gap-2 hover:text-primary transition-colors">
                <TrendingUp className="h-4 w-4" />
                Progress
              </Link>
              <Link to="/settings" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {!isPremium && (
                <Button onClick={() => navigate('/subscription')} size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Crown className="h-4 w-4 mr-2" />
                  Go Premium
                </Button>
              )}

              <Button onClick={toggleDarkMode} variant="ghost" size="icon">
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || 'https://via.placeholder.com/40'}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full"
                />
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Premium Banner for Free Users */}
      {!isPremium && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <span className="font-medium">Upgrade to Premium for unlimited stories and advanced features</span>
            </div>
            <Button onClick={() => navigate('/subscription')} variant="secondary" size="sm">
              Learn More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
