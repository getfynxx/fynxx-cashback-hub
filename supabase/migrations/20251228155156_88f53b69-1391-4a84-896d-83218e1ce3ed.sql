-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('upi', 'bank')),
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_holder_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();