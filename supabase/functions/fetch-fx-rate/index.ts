import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const BCB_BASE_URL = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
const DEFAULT_LOOKBACK_DAYS = 7;

type PtaxQuote = {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  tipoBoletim?: string;
};

const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const formatBcbDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${month}-${day}-${year}`;
};

const subtractDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const pickClosingQuote = (quotes: PtaxQuote[]) => {
  if (!quotes.length) return null;
  const closing = quotes.filter((q) => q.tipoBoletim === "Fechamento");
  const list = closing.length ? closing : quotes;
  return list
    .slice()
    .sort((a, b) => a.dataHoraCotacao.localeCompare(b.dataHoraCotacao))
    .at(-1) || null;
};

const fetchPtaxDay = async (isoDate: string) => {
  const bcbDate = formatBcbDate(isoDate);
  const url =
    `${BCB_BASE_URL}/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)` +
    `?@moeda='USD'&@dataCotacao='${bcbDate}'&$top=100&$format=json`;

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const quotes = (data?.value || []) as PtaxQuote[];
  return pickClosingQuote(quotes);
};

const fetchPtaxPeriod = async (startIso: string, endIso: string) => {
  const startBcb = formatBcbDate(startIso);
  const endBcb = formatBcbDate(endIso);
  const url =
    `${BCB_BASE_URL}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@moeda='USD'&@dataInicial='${startBcb}'&@dataFinalCotacao='${endBcb}'&$top=100&$format=json`;

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const quotes = (data?.value || []) as PtaxQuote[];
  return pickClosingQuote(quotes);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const rawDates = Array.isArray(body?.dates)
      ? body.dates
      : body?.date
        ? [body.date]
        : [];

    if (!rawDates.length) {
      return new Response(
        JSON.stringify({ error: "Informe date ou dates no body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uniqueDates = Array.from(
      new Set(rawDates.filter((value: unknown) => typeof value === "string"))
    ) as string[];

    const results: Array<Record<string, unknown>> = [];

    for (const isoDate of uniqueDates) {
      if (!isValidIsoDate(isoDate)) {
        results.push({ date: isoDate, error: "invalid_date" });
        continue;
      }

      const { data: existing } = await supabaseAdmin
        .from("fx_rates")
        .select("rate_date, usd_brl, reference_date, source")
        .eq("rate_date", isoDate)
        .maybeSingle();

      if (existing) {
        results.push({
          date: isoDate,
          usd_brl: Number(existing.usd_brl),
          reference_date: existing.reference_date,
          source: existing.source,
          cached: true,
        });
        continue;
      }

      let quote = await fetchPtaxDay(isoDate);
      if (!quote) {
        const lookbackStart = subtractDays(isoDate, DEFAULT_LOOKBACK_DAYS);
        quote = await fetchPtaxPeriod(lookbackStart, isoDate);
      }

      if (!quote) {
        results.push({ date: isoDate, error: "rate_not_found" });
        continue;
      }

      const usdBrl = Number(quote.cotacaoVenda ?? quote.cotacaoCompra);
      const referenceDate = quote.dataHoraCotacao.split("T")[0];

      const { data: saved } = await supabaseAdmin
        .from("fx_rates")
        .upsert(
          {
            rate_date: isoDate,
            reference_date: referenceDate,
            usd_brl: usdBrl,
            source: "BCB PTAX",
            data_hora_cotacao: quote.dataHoraCotacao,
          },
          { onConflict: "rate_date" }
        )
        .select("rate_date, usd_brl, reference_date, source")
        .single();

      results.push({
        date: isoDate,
        usd_brl: Number(saved.usd_brl),
        reference_date: saved.reference_date,
        source: saved.source,
        cached: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, rates: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
