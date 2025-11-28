import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { adminAPI } from '../lib/api';
import { useStore } from '../store/useStore';
import { Users, DollarSign, Zap, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user, addToast } = useStore();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [aiUsage, setAIUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) {
      addToast({ title: 'Access denied', type: 'error' });
      return;
    }

    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      const [statsRes, revenueRes, aiUsageRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRevenue(30),
        adminAPI.getAIUsage(30),
        adminAPI.getUsers(1, 10),
      ]);

      setStats(statsRes.data);
      setRevenue(revenueRes.data);
      setAIUsage(aiUsageRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      addToast({ title: 'Failed to load admin data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-4">You don't have admin permissions</p>
        </div>
      </Layout>
    );
  }

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
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform overview and management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.new_users_30d || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.premium_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_users > 0
                  ? Math.round((stats.premium_users / stats.total_users) * 100)
                  : 0}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_stories || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_chapters || 0} chapters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Cost (30d)</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${aiUsage?.summary?.[0]?.total_cost?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {aiUsage?.summary?.[0]?.total_operations || 0} operations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${((revenue?.summary?.total_revenue || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">
                    {revenue?.summary?.total_payments || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paying Users</p>
                  <p className="text-2xl font-bold">
                    {revenue?.summary?.paying_users || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.display_name || 'No name'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.subscription_tier === 'premium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.subscription_tier}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.story_count || 0} stories
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
