import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Clock, CheckCircle, LogOut, ShieldCheck, ArrowDownToLine } from 'lucide-react';

interface Profile {
  wallet_balance: number;
}

interface Submission {
  id: string;
  status: string;
  cashback_amount: number | null;
  created_at: string;
  brands: {
    name: string;
  };
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, submissionsRes, withdrawalsRes] = await Promise.all([
      supabase.from('profiles').select('wallet_balance').eq('id', user.id).maybeSingle(),
      supabase
        .from('submissions')
        .select('id, status, cashback_amount, created_at, brands(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawals')
        .select('id, amount, method, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    if (submissionsRes.data) {
      setSubmissions(submissionsRes.data as Submission[]);
    }

    if (withdrawalsRes.data) {
      setWithdrawals(withdrawalsRes.data);
    }

    setDataLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-bold">FYNXX</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{profile?.wallet_balance?.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingWithdrawals}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Link to="/brands">
            <Button>View Brands</Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw Funds
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {submissions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
              <div className="space-y-3">
                {submissions.slice(0, 5).map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{sub.brands.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={sub.status === 'approved' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {sub.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {withdrawals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
              <div className="space-y-3">
                {withdrawals.slice(0, 5).map((w) => (
                  <Card key={w.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">₹{w.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.method.toUpperCase()} • {new Date(w.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {w.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
