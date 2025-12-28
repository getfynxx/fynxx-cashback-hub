import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ExternalLink, Check, X } from 'lucide-react';

interface Submission {
  id: string;
  platform: string;
  content_url: string;
  note: string | null;
  status: string;
  cashback_amount: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
  };
  brands: {
    name: string;
    cashback_amount: number;
  };
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_holder_name: string | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    wallet_balance: number;
  };
}

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    const [submissionsRes, withdrawalsRes] = await Promise.all([
      supabase
        .from('submissions')
        .select('*, profiles(email), brands(name, cashback_amount)')
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawals')
        .select('*, profiles(email, wallet_balance)')
        .order('created_at', { ascending: false })
    ]);

    if (submissionsRes.data) {
      setSubmissions(submissionsRes.data as Submission[]);
    }
    if (withdrawalsRes.data) {
      setWithdrawals(withdrawalsRes.data as Withdrawal[]);
    }
    setDataLoading(false);
  };

  const handleApproveSubmission = async (submission: Submission) => {
    setProcessing(submission.id);

    const cashbackAmount = submission.brands.cashback_amount;

    const { error: subError } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submission.id);

    if (subError) {
      toast({ title: 'Error', description: 'Failed to approve submission', variant: 'destructive' });
      setProcessing(null);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', submission.user_id)
      .single();

    if (profile) {
      const newBalance = (profile.wallet_balance || 0) + cashbackAmount;
      await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', submission.user_id);
    }

    toast({ title: 'Approved', description: `₹${cashbackAmount} added to user wallet` });
    fetchData();
    setProcessing(null);
  };

  const handleRejectSubmission = async (submissionId: string) => {
    setProcessing(submissionId);
    const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', submissionId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to reject submission', variant: 'destructive' });
    } else {
      toast({ title: 'Rejected', description: 'Submission has been rejected' });
      fetchData();
    }
    setProcessing(null);
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);

    const currentBalance = withdrawal.profiles.wallet_balance || 0;
    if (currentBalance < withdrawal.amount) {
      toast({ title: 'Error', description: 'User has insufficient balance', variant: 'destructive' });
      setProcessing(null);
      return;
    }

    const { error: wError } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', withdrawal.id);

    if (wError) {
      toast({ title: 'Error', description: 'Failed to approve withdrawal', variant: 'destructive' });
      setProcessing(null);
      return;
    }

    const newBalance = currentBalance - withdrawal.amount;
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', withdrawal.user_id);

    toast({ title: 'Approved', description: `₹${withdrawal.amount} deducted from user wallet` });
    fetchData();
    setProcessing(null);
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    setProcessing(withdrawalId);
    const { error } = await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', withdrawalId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to reject withdrawal', variant: 'destructive' });
    } else {
      toast({ title: 'Rejected', description: 'Withdrawal has been rejected' });
      fetchData();
    }
    setProcessing(null);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

        <Tabs defaultValue="submissions">
          <TabsList className="mb-6">
            <TabsTrigger value="submissions">
              Submissions {pendingSubmissions.length > 0 && `(${pendingSubmissions.length})`}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Withdrawals {pendingWithdrawals.length > 0 && `(${pendingWithdrawals.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{sub.brands.name}</p>
                            <Badge variant={sub.status === 'approved' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {sub.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{sub.profiles.email}</p>
                          <p className="text-sm text-muted-foreground">Platform: {sub.platform} • ₹{sub.brands.cashback_amount}</p>
                          <a href={sub.content_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                            View Content <ExternalLink className="w-3 h-3" />
                          </a>
                          {sub.note && <p className="text-sm text-muted-foreground mt-2">Note: {sub.note}</p>}
                        </div>
                        {sub.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" onClick={() => handleApproveSubmission(sub)} disabled={processing === sub.id}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectSubmission(sub.id)} disabled={processing === sub.id}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals">
            {withdrawals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No withdrawal requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((w) => (
                  <Card key={w.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">₹{w.amount.toFixed(2)}</p>
                            <Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {w.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{w.profiles.email}</p>
                          <p className="text-sm text-muted-foreground">Method: {w.method.toUpperCase()}</p>
                          {w.method === 'upi' && w.upi_id && (
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded">UPI: {w.upi_id}</p>
                          )}
                          {w.method === 'bank' && (
                            <div className="text-sm font-mono bg-muted px-2 py-1 rounded space-y-1">
                              <p>Name: {w.bank_holder_name}</p>
                              <p>A/C: {w.bank_account_number}</p>
                              <p>IFSC: {w.bank_ifsc}</p>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            User Balance: ₹{w.profiles.wallet_balance?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" onClick={() => handleApproveWithdrawal(w)} disabled={processing === w.id}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(w.id)} disabled={processing === w.id}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Admin;
