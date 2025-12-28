import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ExternalLink, Check, X } from 'lucide-react';
import PilotBanner from '@/components/PilotBanner';

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

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
      fetchSubmissions();
    }
  }, [user, isAdmin]);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles(email), brands(name, cashback_amount)')
      .order('created_at', { ascending: false });

    if (data) {
      setSubmissions(data as Submission[]);
    }
    setDataLoading(false);
  };

  const handleApprove = async (submission: Submission) => {
    setProcessing(submission.id);

    const cashbackAmount = submission.brands.cashback_amount;

    // Update submission status
    const { error: subError } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submission.id);

    if (subError) {
      toast({
        title: 'Error',
        description: 'Failed to approve submission',
        variant: 'destructive',
      });
      setProcessing(null);
      return;
    }

    // Update user wallet
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', submission.user_id)
      .single();

    if (profile) {
      const newBalance = (profile.wallet_balance || 0) + cashbackAmount;
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', submission.user_id);
    }

    toast({
      title: 'Approved',
      description: `₹${cashbackAmount} added to user wallet`,
    });

    fetchSubmissions();
    setProcessing(null);
  };

  const handleReject = async (submissionId: string) => {
    setProcessing(submissionId);

    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject submission',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Rejected',
        description: 'Submission has been rejected',
      });
      fetchSubmissions();
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

  if (!isAdmin) {
    return null;
  }

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
        <PilotBanner />
        <h2 className="text-2xl font-bold mb-6 mt-6">Admin Panel</h2>

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
                        <Badge
                          variant={
                            sub.status === 'approved'
                              ? 'default'
                              : sub.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{sub.profiles.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Platform: {sub.platform} • ₹{sub.brands.cashback_amount}
                      </p>
                      <a
                        href={sub.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Content <ExternalLink className="w-3 h-3" />
                      </a>
                      {sub.note && (
                        <p className="text-sm text-muted-foreground mt-2">Note: {sub.note}</p>
                      )}
                    </div>

                    {sub.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(sub)}
                          disabled={processing === sub.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(sub.id)}
                          disabled={processing === sub.id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
