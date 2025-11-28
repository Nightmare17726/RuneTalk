import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { subscriptionAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { Check, Crown, Zap } from 'lucide-react';

export default function Subscription() {
  const navigate = useNavigate();
  const { subscription, setSubscription, isPremium, addToast } = useStore();
  const [loading, setLoading] = useState('');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await subscriptionAPI.getStatus();
      setSubscription(res.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleSubscribe = async (planType) => {
    setLoading(planType);

    try {
      const res = await subscriptionAPI.createCheckout(planType);
      window.location.href = res.data.url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      addToast({ title: 'Failed to start checkout', type: 'error' });
      setLoading('');
    }
  };

  const handleManage = async () => {
    try {
      const res = await subscriptionAPI.createPortal();
      window.location.href = res.data.url;
    } catch (error) {
      console.error('Failed to open portal:', error);
      addToast({ title: 'Failed to open billing portal', type: 'error' });
    }
  };

  const features = {
    free: [
      '3 story generations per day',
      'Save up to 100 vocabulary words',
      'Basic quizzes',
      'Limited audio narration',
      'Ads supported',
    ],
    premium: [
      'Unlimited story generation',
      'Unlimited vocabulary bank',
      'Advanced quizzes with explanations',
      'Full audio narration (TTS)',
      'Offline mobile access',
      'No ads',
      'Priority support',
      'Custom learning pace control',
      'Detailed analytics dashboard',
    ],
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-muted-foreground">
            Unlock unlimited language learning with AI-powered stories
          </p>
        </div>

        {isPremium && (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="text-xl font-semibold">You're a Premium Member!</h3>
                <p className="text-muted-foreground">
                  Thank you for supporting RuneTalk
                </p>
              </div>
            </div>
            <Button onClick={handleManage} variant="outline" className="mt-4">
              Manage Subscription
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => navigate('/dashboard')}
                disabled={!isPremium}
              >
                {isPremium ? 'Current Plan' : 'Continue with Free'}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className="relative border-primary shadow-lg scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Premium Monthly
              </CardTitle>
              <CardDescription>Full access, billed monthly</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80"
                onClick={() => handleSubscribe('monthly')}
                disabled={isPremium || loading === 'monthly'}
              >
                {loading === 'monthly' ? (
                  <>
                    <div className="spinner mr-2 !w-5 !h-5 !border-2" />
                    Processing...
                  </>
                ) : isPremium ? (
                  'Current Plan'
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Subscribe Monthly
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Save 17%
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Premium Yearly
              </CardTitle>
              <CardDescription>Best value, billed annually</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Save $19.89 compared to monthly
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-500"
                onClick={() => handleSubscribe('yearly')}
                disabled={isPremium || loading === 'yearly'}
              >
                {loading === 'yearly' ? (
                  <>
                    <div className="spinner mr-2 !w-5 !h-5 !border-2" />
                    Processing...
                  </>
                ) : isPremium ? (
                  'Current Plan'
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Subscribe Yearly
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day money-back guarantee</p>
          <p className="mt-2">Cancel anytime, no questions asked</p>
        </div>
      </div>
    </Layout>
  );
}
