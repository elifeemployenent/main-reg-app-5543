-- Create applications table for category form submissions
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  panchayath_id UUID REFERENCES public.panchayaths(id),
  preference TEXT,
  agent_pro TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  fee_paid NUMERIC DEFAULT 0,
  approved_date TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Admins can manage all applications" 
ON public.applications 
FOR ALL 
USING (is_admin_context())
WITH CHECK (is_admin_context());

CREATE POLICY "Anyone can create applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view applications" 
ON public.applications 
FOR SELECT 
USING (true);

-- Create trigger for customer_id generation
CREATE TRIGGER generate_customer_id_applications
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_customer_id();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for cash summary updates
CREATE TRIGGER update_cash_summary_applications
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_summary();