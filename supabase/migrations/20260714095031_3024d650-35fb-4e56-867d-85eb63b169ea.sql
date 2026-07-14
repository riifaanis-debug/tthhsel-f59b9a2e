
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.rf_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number text,
  amount numeric,
  note text,
  action text,
  agent_employee_id text,
  agent_name text,
  supervisor_employee_id text,
  supervisor_name text,
  product text,
  customer_name text,
  national_id text,
  product_type text,
  eviction_agency text,
  eviction_action text,
  property_city text,
  property_kind text,
  execution_action text,
  case_number text,
  payment numeric,
  imported_by text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rf_customers_agent_idx ON public.rf_customers(agent_employee_id);
CREATE INDEX rf_customers_account_idx ON public.rf_customers(account_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rf_customers TO authenticated;
GRANT SELECT ON public.rf_customers TO anon;
GRANT ALL ON public.rf_customers TO service_role;

ALTER TABLE public.rf_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rf_customers read all" ON public.rf_customers FOR SELECT USING (true);
CREATE POLICY "rf_customers insert all" ON public.rf_customers FOR INSERT WITH CHECK (true);
CREATE POLICY "rf_customers update all" ON public.rf_customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "rf_customers delete all" ON public.rf_customers FOR DELETE USING (true);

CREATE TRIGGER rf_customers_set_updated_at
BEFORE UPDATE ON public.rf_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
