import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import PilotBanner from '@/components/PilotBanner';
import { z } from 'zod';

const submitSchema = z.object({
  platform: z.string().min(1, 'Please select a platform'),
  contentUrl: z.string().url('Please enter a valid URL').max(500, 'URL is too long'),
  note: z.string().max(500, 'Note is too long').optional(),
});

interface Brand {
  id: string;
  name: string;
  cashback_amount: number;
}

const Submit = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get('brand');
  const { toast } = useToast();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [platform, setPlatform] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (brandId) {
      fetchBrand();
    } else {
      navigate('/brands');
    }
  }, [brandId]);

  const fetchBrand = async () => {
    const { data } = await supabase.from('brands').select('id, name, cashback_amount').eq('id', brandId).maybeSingle();
    if (data) {
      setBrand(data);
    } else {
      navigate('/brands');
    }
    setDataLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = submitSchema.safeParse({ platform, contentUrl, note });
    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!user || !brand) return;

    setSubmitting(true);

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      brand_id: brand.id,
      platform,
      content_url: contentUrl,
      note: note || null,
      cashback_amount: brand.cashback_amount,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
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
            <h2 className="text-xl font-bold mb-2">Submission Received!</h2>
            <p className="text-muted-foreground mb-6">
              Your content is under review. We'll update your dashboard once it's approved.
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
          <Link to="/brands" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Brands
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-lg">
        <PilotBanner />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Submit Content for {brand?.name}</CardTitle>
            <CardDescription>
              Share your content link and earn up to ₹{brand?.cashback_amount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentUrl">Content URL</Label>
                <Input
                  id="contentUrl"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Any additional details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Submit;
