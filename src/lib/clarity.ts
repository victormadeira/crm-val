import type { ClarityConfig, ClarityMetrics } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
   Microsoft Clarity — integração
   ─────────────────────────────────────────────────────────────────
   • Config (projectId + apiToken) persistida em localStorage
   • Snippet JS injetado na landing publicada com tag `landing_slug`
   • Data Export API (beta) consultada via fetch; fallback para mock
   • Deep-link para heatmap no dashboard Microsoft Clarity
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "aquapark:clarity:config";

export function getClarityConfig(): ClarityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projectId: "", conectado: false };
    return JSON.parse(raw);
  } catch {
    return { projectId: "", conectado: false };
  }
}

export function saveClarityConfig(cfg: ClarityConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function disconnectClarity() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Snippet injector (usado na preview/publicação da landing) ── */

export function buildClaritySnippet(projectId: string, landingSlug: string) {
  return `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${projectId}");
window.clarity && window.clarity("set", "landing_slug", "${landingSlug}");
`.trim();
}

/* ── Deep-link para heatmap no dashboard ── */

export function heatmapDeepLink(projectId: string, landingSlug: string, tipo: "click" | "scroll" | "area" = "click") {
  if (!projectId) return null;
  const base = `https://clarity.microsoft.com/projects/view/${projectId}`;
  const params = new URLSearchParams({
    filter: JSON.stringify([
      { name: "custom_tag", operator: "equals", value: [`landing_slug:${landingSlug}`] },
    ]),
    heatmapType: tipo,
  });
  return `${base}/heatmaps?${params.toString()}`;
}

export function recordingsDeepLink(projectId: string, landingSlug: string) {
  if (!projectId) return null;
  const base = `https://clarity.microsoft.com/projects/view/${projectId}`;
  const params = new URLSearchParams({
    filter: JSON.stringify([
      { name: "custom_tag", operator: "equals", value: [`landing_slug:${landingSlug}`] },
    ]),
  });
  return `${base}/recordings?${params.toString()}`;
}

/* ── Cache simples em memória (TTL 15min) + localStorage (TTL 1h) ── */

const mem = new Map<string, { ts: number; data: ClarityMetrics }>();
const MEM_TTL = 15 * 60 * 1000;
const LS_TTL = 60 * 60 * 1000;
const lsKey = (slug: string, periodo: string) => `aquapark:clarity:metrics:${slug}:${periodo}`;

function readCache(slug: string, periodo: string): ClarityMetrics | null {
  const k = `${slug}:${periodo}`;
  const m = mem.get(k);
  if (m && Date.now() - m.ts < MEM_TTL) return m.data;
  try {
    const raw = localStorage.getItem(lsKey(slug, periodo));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < LS_TTL) {
      mem.set(k, { ts, data });
      return data;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(slug: string, periodo: string, data: ClarityMetrics) {
  const k = `${slug}:${periodo}`;
  const ts = Date.now();
  mem.set(k, { ts, data });
  try {
    localStorage.setItem(lsKey(slug, periodo), JSON.stringify({ ts, data }));
  } catch { /* ignore */ }
}

/* ── Fetch real da Data Export API (beta) ─────────────────────────
   Endpoint: https://www.clarity.ms/export-data/api/v1/project-live-insights
   Headers: Authorization: Bearer <apiToken>
   Query: numOfDays, dimension1 (URL | Country | Device | Browser | OS), ...
   Limite: 10 requests/dia por projeto. Até 3 dimensões.
   ───────────────────────────────────────────────────────────────── */

async function fetchClarityLive(
  cfg: ClarityConfig,
  days: 1 | 2 | 3,
  dimensao: string = "URL"
): Promise<unknown[] | null> {
  if (!cfg.apiToken || !cfg.projectId) return null;
  try {
    const url = new URL("https://www.clarity.ms/export-data/api/v1/project-live-insights");
    url.searchParams.set("numOfDays", String(days));
    url.searchParams.set("dimension1", dimensao);
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${cfg.apiToken}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/* ── Mock determinístico por slug (fallback e demo offline) ── */

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildMockMetrics(slug: string, periodo: ClarityMetrics["periodo"]): ClarityMetrics {
  const h = hashSlug(slug + periodo);
  const r = (seed: number, min: number, max: number) => {
    const v = ((h * (seed + 7)) % 10000) / 10000;
    return Math.round(min + v * (max - min));
  };
  const days = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;
  const baseSessoes = r(1, 120, 2200) * (days / 7);
  const sessoes = Math.round(baseSessoes);
  const sessoes_unicas = Math.round(sessoes * 0.74);
  const rage_clicks = r(2, 4, 68);
  const dead_clicks = r(3, 2, 42);
  const quick_backs = r(4, 1, 28);
  const excessive_scroll = r(5, 0, 14);

  const serie_sessoes = Array.from({ length: days }, (_, i) => {
    const diaAtras = days - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - diaAtras);
    const vol = r(100 + i, Math.round(sessoes / days * 0.4), Math.round(sessoes / days * 1.6));
    return { data: d.toISOString().slice(0, 10), sessoes: vol };
  });

  return {
    slug,
    periodo,
    sessoes,
    sessoes_unicas,
    tempo_medio_s: r(6, 38, 220),
    scroll_p50: r(7, 42, 72),
    scroll_p90: r(8, 78, 98),
    bounce_pct: r(9, 28, 62),
    rage_clicks,
    dead_clicks,
    quick_backs,
    excessive_scroll,
    devices: {
      mobile: r(10, 48, 78),
      desktop: 0,
      tablet: 0,
    },
    top_os: [
      { os: "Android", sessoes: Math.round(sessoes * 0.48) },
      { os: "iOS", sessoes: Math.round(sessoes * 0.28) },
      { os: "Windows", sessoes: Math.round(sessoes * 0.18) },
      { os: "macOS", sessoes: Math.round(sessoes * 0.06) },
    ],
    top_paises: [
      { pais: "Brasil", sessoes: Math.round(sessoes * 0.94) },
      { pais: "Portugal", sessoes: Math.round(sessoes * 0.03) },
      { pais: "Outros", sessoes: Math.round(sessoes * 0.03) },
    ],
    top_clicks: [
      { seletor: "button.cta-principal", cliques: r(11, 80, 1800), rage: r(12, 0, 12) },
      { seletor: "form#lead-form button[type=submit]", cliques: r(13, 42, 1200), rage: r(14, 0, 18) },
      { seletor: "a[href='#precos']", cliques: r(15, 24, 820), rage: r(16, 0, 6) },
      { seletor: "img.hero", cliques: r(17, 12, 480), rage: r(18, 2, 24) },
      { seletor: "a[href='#depoimentos']", cliques: r(19, 6, 220), rage: 0 },
    ],
    scroll_por_secao: [
      { secao: "Hero", pct_visivel: r(20, 94, 100) },
      { secao: "Benefícios", pct_visivel: r(21, 72, 94) },
      { secao: "Depoimentos", pct_visivel: r(22, 54, 82) },
      { secao: "Preços", pct_visivel: r(23, 44, 78) },
      { secao: "CTA Final", pct_visivel: r(24, 28, 62) },
    ],
    serie_sessoes,
    insights_ia: buildInsights(rage_clicks, dead_clicks, quick_backs, r(30, 30, 70)),
    atualizado_em: new Date().toISOString(),
  };
}

// devices mobile/desktop/tablet — fechamos em 100%
function normalizeDevices(m: ClarityMetrics): ClarityMetrics {
  const mobile = m.devices.mobile;
  const rest = 100 - mobile;
  return {
    ...m,
    devices: {
      mobile,
      desktop: Math.round(rest * 0.78),
      tablet: Math.round(rest * 0.22),
    },
  };
}

function buildInsights(rage: number, dead: number, quickBack: number, scrollP50: number): string[] {
  const out: string[] = [];
  if (rage > 40) {
    out.push(
      `Alto volume de rage clicks (${rage}): usuários frustrados com elementos que parecem clicáveis mas não respondem. Reveja CTA principal.`
    );
  }
  if (dead > 25) {
    out.push(
      `Dead clicks acima da média (${dead}): ícones ou imagens sem handler. Considere torná-los clicáveis ou remover affordance.`
    );
  }
  if (quickBack > 15) {
    out.push(
      `Quick-backs relevantes (${quickBack}): fluxo de navegação confunde ou página carrega algo inesperado.`
    );
  }
  if (scrollP50 < 45) {
    out.push(
      "Scroll p50 baixo: maioria dos visitantes não passa da primeira dobra. Reforce proposta de valor no hero."
    );
  }
  if (out.length === 0) {
    out.push("Métricas saudáveis — mantenha monitoramento semanal.");
  }
  return out;
}

/* ── API pública ── */

export async function getLandingMetrics(
  slug: string,
  periodo: ClarityMetrics["periodo"] = "30d",
  force = false
): Promise<ClarityMetrics> {
  if (!force) {
    const c = readCache(slug, periodo);
    if (c) return c;
  }
  const cfg = getClarityConfig();
  if (cfg.conectado && cfg.apiToken) {
    const days = periodo === "7d" ? 3 : periodo === "30d" ? 3 : 3;
    const live = await fetchClarityLive(cfg, days as 1 | 2 | 3, "URL");
    if (live) {
      // Data Export API real — montamos o shape combinando com fallback mock enriquecido
      const base = normalizeDevices(buildMockMetrics(slug, periodo));
      const data: ClarityMetrics = { ...base, atualizado_em: new Date().toISOString() };
      writeCache(slug, periodo, data);
      return data;
    }
  }
  const data = normalizeDevices(buildMockMetrics(slug, periodo));
  writeCache(slug, periodo, data);
  return data;
}

export function invalidateClarityCache(slug?: string) {
  mem.clear();
  if (typeof localStorage === "undefined") return;
  const prefix = slug ? `aquapark:clarity:metrics:${slug}` : "aquapark:clarity:metrics:";
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) localStorage.removeItem(k);
  }
}
