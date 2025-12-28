import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  cashback_amount: number;
}

const Brands = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBrands();
    }
  }, [user]);

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('*').order('name');
    if (data) {
      setBrands(data);
    }
    setDataLoading(false);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
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

      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Available Brands</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <CardTitle>{brand.name}</CardTitle>
                <CardDescription>{brand.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Earn up to <span className="font-semibold text-primary">₹{brand.cashback_amount}</span>
                </p>
                <Link to={`/submit?brand=${brand.id}`}>
                  <Button className="w-full">I've Posted Content</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Brands;
