import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          FYNXX
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Earn cashback by posting brand content.
        </p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Get Started
        </Button>
      </div>
    </main>
  );
};

export default Index;
