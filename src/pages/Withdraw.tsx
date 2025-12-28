import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const upiSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is ₹10'),
  upiId: z.string().min(1, 'UPI ID is required').regex(/^[\w.-]+@[\w]+$/, 'Invalid UPI ID format'),
});

const bankSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is ₹10'),
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  holderName: z.string().min(2, 'Account holder name is required'),
});

const Withdraw = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [walletBalance, setWalletBalance] = useState(0);
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setWalletBalance(Number(data.wallet_balance) || 0);
    }
    setDataLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (amountNum > walletBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ₹${walletBalance.toFixed(2)} available`,
        variant: 'destructive',
      });
      return;
    }

    if (method === 'upi') {
      const result = upiSchema.safeParse({ amount: amountNum, upiId });
      if (!result.success) {
        toast({
          title: 'Validation Error',
          description: result.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    } else {
      const result = bankSchema.safeParse({ amount: amountNum, accountNumber, ifsc, holderName });
      if (!result.success) {
        toast({
          title: 'Validation Error',
          description: result.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!user) return;

    setSubmitting(true);

    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount: amountNum,
      method,
      upi_id: method === 'upi' ? upiId : null,
      bank_account_number: method === 'bank' ? accountNumber : null,
      bank_ifsc: method === 'bank' ? ifsc.toUpperCase() : null,
      bank_holder_name: method === 'bank' ? holderName : null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit withdrawal request',
        variant: 'destructive',
      });
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Withdrawal Requested!</h2>
            <p className="text-muted-foreground mb-6">
              Your withdrawal request is being processed. You'll be notified once it's approved.
            </p>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
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

      <div className="container py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>
              Available balance: <span className="font-semibold text-primary">₹{walletBalance.toFixed(2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {walletBalance < 10 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Minimum withdrawal amount is ₹10. Keep earning cashback!
                </p>
                <Link to="/brands">
                  <Button>View Brands</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    max={walletBalance}
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <RadioGroup value={method} onValueChange={(v) => setMethod(v as 'upi' | 'bank')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="font-normal cursor-pointer">UPI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="font-normal cursor-pointer">Bank Transfer</Label>
                    </div>
                  </RadioGroup>
                </div>

                {method === 'upi' && (
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                  </div>
                )}

                {method === 'bank' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="holderName">Account Holder Name</Label>
                      <Input
                        id="holderName"
                        type="text"
                        placeholder="Full name as per bank records"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="Enter account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc">IFSC Code</Label>
                      <Input
                        id="ifsc"
                        type="text"
                        placeholder="e.g., SBIN0001234"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Withdraw;
