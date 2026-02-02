-- =====================================================
-- TABELA DE COTACOES USD/BRL (PTAX)
-- fx_rates: Cotacao do dolar por data (BRT)
-- =====================================================

CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date DATE NOT NULL UNIQUE,
  reference_date DATE,
  usd_brl DECIMAL(12,6) NOT NULL,
  source TEXT NOT NULL DEFAULT 'BCB PTAX',
  data_hora_cotacao TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_rate_date ON fx_rates(rate_date);

-- Habilitar RLS
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;

-- Policies para fx_rates
DROP POLICY IF EXISTS "Anyone can view fx rates" ON fx_rates;
CREATE POLICY "Anyone can view fx rates" ON fx_rates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage fx rates" ON fx_rates;
CREATE POLICY "Service role manage fx rates" ON fx_rates
  FOR ALL TO service_role USING (true) WITH CHECK (true);
