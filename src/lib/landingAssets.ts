/* ═══════════════════════════════════════════════════════════════════
   LANDING ASSETS — backgrounds animados temáticos + ícones de botão
   ═══════════════════════════════════════════════════════════════════ */

export type BgAnimationId =
  | "ocean_waves"
  | "tropical_sunset"
  | "deep_bubbles"
  | "aurora_aqua"
  | "palm_breeze"
  | "splash_drops"
  | "vip_gold"
  | "corp_night"
  | "confetti_party"
  | "family_sunshine";

export interface BgAnimation {
  id: BgAnimationId;
  label: string;
  desc: string;
  categoria: "aquatico" | "natureza" | "premium" | "festa" | "corporativo";
  /** Gradient base (fallback estático) */
  bg: string;
  /** Swatch pequena usada na paleta de preview (gradient simples) */
  swatch: string;
  /** Tom do texto recomendado sobre este background */
  toneTexto: "light" | "dark";
}

export const BG_ANIMATIONS: BgAnimation[] = [
  {
    id: "ocean_waves",
    label: "Ondas do Oceano",
    desc: "Ondas azuis animadas com espuma — ideal para passaporte família",
    categoria: "aquatico",
    bg: "linear-gradient(180deg,#0ea5e9 0%,#0369a1 100%)",
    swatch: "linear-gradient(135deg,#22d3ee,#0284c7,#1e3a8a)",
    toneTexto: "light",
  },
  {
    id: "tropical_sunset",
    label: "Pôr-do-sol Tropical",
    desc: "Gradiente laranja-rosa-violeta com palmeiras silhueta",
    categoria: "natureza",
    bg: "linear-gradient(180deg,#fb923c 0%,#e11d48 50%,#7c3aed 100%)",
    swatch: "linear-gradient(135deg,#fde047,#fb923c,#db2777,#7c3aed)",
    toneTexto: "light",
  },
  {
    id: "deep_bubbles",
    label: "Bolhas Profundas",
    desc: "Azul profundo com bolhas subindo — ideal para subaquático",
    categoria: "aquatico",
    bg: "linear-gradient(180deg,#0c4a6e 0%,#082f49 100%)",
    swatch: "linear-gradient(135deg,#0ea5e9,#0c4a6e,#082f49)",
    toneTexto: "light",
  },
  {
    id: "aurora_aqua",
    label: "Aurora Aqua",
    desc: "Névoa turquesa animada — premium e etéreo",
    categoria: "premium",
    bg: "linear-gradient(135deg,#5eead4 0%,#22d3ee 50%,#3b82f6 100%)",
    swatch: "linear-gradient(135deg,#5eead4,#22d3ee,#3b82f6)",
    toneTexto: "dark",
  },
  {
    id: "palm_breeze",
    label: "Brisa com Palmeiras",
    desc: "Céu azul claro com palmeiras que balançam",
    categoria: "natureza",
    bg: "linear-gradient(180deg,#7dd3fc 0%,#38bdf8 50%,#0ea5e9 100%)",
    swatch: "linear-gradient(135deg,#a7f3d0,#7dd3fc,#0ea5e9)",
    toneTexto: "dark",
  },
  {
    id: "splash_drops",
    label: "Gotas de Splash",
    desc: "Gotas d'água caindo com efeito splash animado",
    categoria: "aquatico",
    bg: "linear-gradient(180deg,#06b6d4 0%,#0891b2 100%)",
    swatch: "linear-gradient(135deg,#67e8f9,#06b6d4,#0e7490)",
    toneTexto: "light",
  },
  {
    id: "vip_gold",
    label: "VIP Dourado",
    desc: "Preto profundo com partículas douradas flutuando",
    categoria: "premium",
    bg: "linear-gradient(135deg,#18181b 0%,#3f3f46 100%)",
    swatch: "linear-gradient(135deg,#fbbf24,#18181b,#3f3f46)",
    toneTexto: "light",
  },
  {
    id: "corp_night",
    label: "Corporativo Noturno",
    desc: "Marinho com linhas luminosas — sério e tecnológico",
    categoria: "corporativo",
    bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#134e4a 100%)",
    swatch: "linear-gradient(135deg,#0f172a,#1e3a8a,#134e4a)",
    toneTexto: "light",
  },
  {
    id: "confetti_party",
    label: "Festa Confete",
    desc: "Confetes coloridos caindo — para eventos e festas",
    categoria: "festa",
    bg: "linear-gradient(180deg,#fef3c7 0%,#fce7f3 100%)",
    swatch: "linear-gradient(135deg,#f43f5e,#fbbf24,#22c55e,#0ea5e9)",
    toneTexto: "dark",
  },
  {
    id: "family_sunshine",
    label: "Sol de Família",
    desc: "Sol radiante em céu azul com raios girando",
    categoria: "natureza",
    bg: "radial-gradient(ellipse at center top,#fef9c3 0%,#fde047 20%,#60a5fa 70%,#3b82f6 100%)",
    swatch: "linear-gradient(135deg,#fef9c3,#fde047,#60a5fa,#3b82f6)",
    toneTexto: "dark",
  },
];

export function getBgAnimation(id?: string): BgAnimation | null {
  if (!id) return null;
  return BG_ANIMATIONS.find((b) => b.id === id) ?? null;
}

/* ─────────────────────────── Button enhancements ─────────────────────────── */

export type BtnVariante = "solid" | "outline" | "ghost" | "gradient" | "glass";
export type BtnRadius = "sharp" | "rounded" | "pill";
export type BtnHoverFx = "lift" | "glow" | "pulse" | "none";
export type BtnIconKey =
  | "none"
  | "arrow_right"
  | "play"
  | "star"
  | "check"
  | "whatsapp"
  | "phone"
  | "mail"
  | "cart"
  | "download"
  | "sparkles"
  | "heart";

export type BtnAcaoTipo = "link" | "scroll" | "whatsapp" | "phone" | "email" | "download";
export interface BtnAcao {
  tipo: BtnAcaoTipo;
  valor: string;
}

export const BTN_ICON_LABEL: Record<BtnIconKey, string> = {
  none: "Sem ícone",
  arrow_right: "Seta →",
  play: "Play ▶",
  star: "Estrela",
  check: "Check",
  whatsapp: "WhatsApp",
  phone: "Telefone",
  mail: "Email",
  cart: "Carrinho",
  download: "Download",
  sparkles: "Sparkles",
  heart: "Coração",
};

/* ─────────────────────────── Tipografia (Google Fonts) ─────────────────────────── */

export interface FontFamily {
  id: string;
  label: string;
  stack: string;
  /** weights disponíveis */
  weights: number[];
  /** URL da @import Google Fonts (já com weights) */
  url: string;
  /** categoria para agrupamento no picker */
  categoria: "sans" | "serif" | "display" | "mono" | "handwriting";
  /** combina bem com (id de outra fonte) — sugestão de pair */
  pairWith?: string;
  /** ideal para — tags descritivas */
  tags: string[];
}

export const FONT_FAMILIES: FontFamily[] = [
  {
    id: "inter",
    label: "Inter",
    stack: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
    categoria: "sans",
    pairWith: "poppins",
    tags: ["moderno", "SaaS", "clean"],
  },
  {
    id: "poppins",
    label: "Poppins",
    stack: `"Poppins", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap",
    categoria: "sans",
    pairWith: "inter",
    tags: ["amigável", "família", "friendly"],
  },
  {
    id: "montserrat",
    label: "Montserrat",
    stack: `"Montserrat", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap",
    categoria: "sans",
    pairWith: "raleway",
    tags: ["institucional", "moderno"],
  },
  {
    id: "raleway",
    label: "Raleway",
    stack: `"Raleway", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800],
    url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&display=swap",
    categoria: "sans",
    pairWith: "montserrat",
    tags: ["elegante", "corpo"],
  },
  {
    id: "dm_sans",
    label: "DM Sans",
    stack: `"DM Sans", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 700, 900],
    url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap",
    categoria: "sans",
    pairWith: "outfit",
    tags: ["SaaS", "tech"],
  },
  {
    id: "outfit",
    label: "Outfit",
    stack: `"Outfit", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap",
    categoria: "sans",
    pairWith: "dm_sans",
    tags: ["premium", "moderno"],
  },
  {
    id: "space_grotesk",
    label: "Space Grotesk",
    stack: `"Space Grotesk", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    categoria: "sans",
    pairWith: "bebas",
    tags: ["jovem", "tech"],
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    stack: `"Bebas Neue", Impact, sans-serif-condensed, sans-serif`,
    weights: [400],
    url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    categoria: "display",
    pairWith: "space_grotesk",
    tags: ["impacto", "esportivo", "radical"],
  },
  {
    id: "anton",
    label: "Anton",
    stack: `"Anton", Impact, sans-serif-condensed, sans-serif`,
    weights: [400],
    url: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
    categoria: "display",
    pairWith: "inter",
    tags: ["black-friday", "impacto", "promo"],
  },
  {
    id: "oswald",
    label: "Oswald",
    stack: `"Oswald", Impact, sans-serif-condensed, sans-serif`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap",
    categoria: "display",
    pairWith: "dm_sans",
    tags: ["promo", "urgência"],
  },
  {
    id: "archivo_black",
    label: "Archivo Black",
    stack: `"Archivo Black", Impact, sans-serif`,
    weights: [400],
    url: "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap",
    categoria: "display",
    pairWith: "inter",
    tags: ["esportivo", "impacto"],
  },
  {
    id: "playfair",
    label: "Playfair Display",
    stack: `"Playfair Display", Georgia, serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap",
    categoria: "serif",
    pairWith: "lora",
    tags: ["premium", "luxo", "corporativo"],
  },
  {
    id: "lora",
    label: "Lora",
    stack: `"Lora", Georgia, serif`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
    categoria: "serif",
    pairWith: "playfair",
    tags: ["editorial", "corpo"],
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    stack: `"Cormorant Garamond", Georgia, serif`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap",
    categoria: "serif",
    pairWith: "outfit",
    tags: ["VIP", "luxo", "sofisticado"],
  },
  {
    id: "fredoka",
    label: "Fredoka",
    stack: `"Fredoka", "Poppins", sans-serif`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap",
    categoria: "display",
    pairWith: "nunito",
    tags: ["kids", "divertido", "festa"],
  },
  {
    id: "nunito",
    label: "Nunito",
    stack: `"Nunito", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800, 900],
    url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap",
    categoria: "sans",
    pairWith: "fredoka",
    tags: ["amigável", "kids", "casual"],
  },
  {
    id: "syne",
    label: "Syne",
    stack: `"Syne", ui-sans-serif, system-ui, sans-serif`,
    weights: [400, 500, 600, 700, 800],
    url: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap",
    categoria: "display",
    pairWith: "space_grotesk",
    tags: ["editorial", "jovem"],
  },
  {
    id: "jetbrains",
    label: "JetBrains Mono",
    stack: `"JetBrains Mono", ui-monospace, monospace`,
    weights: [400, 500, 700],
    url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
    categoria: "mono",
    tags: ["tech", "monospace"],
  },
  {
    id: "caveat",
    label: "Caveat",
    stack: `"Caveat", cursive`,
    weights: [400, 500, 600, 700],
    url: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap",
    categoria: "handwriting",
    pairWith: "inter",
    tags: ["personal", "assinatura"],
  },
  {
    id: "valparas",
    label: "Valparas (brand)",
    stack: `"valparas", "Archivo Black", ui-sans-serif, sans-serif`,
    weights: [400],
    url: "https://www.valparaisoadventurepark.com.br/assets/fonts/valparas-Regular.woff2",
    categoria: "display",
    pairWith: "blogger_sans",
    tags: ["marca", "Valparaíso", "aventura"],
  },
  {
    id: "blogger_sans",
    label: "Blogger Sans (brand)",
    stack: `"BloggerSans", "Inter", ui-sans-serif, system-ui, sans-serif`,
    weights: [300, 400, 500, 600],
    url: "https://www.valparaisoadventurepark.com.br/assets/fonts/BloggerSans-Regular.woff2",
    categoria: "sans",
    pairWith: "valparas",
    tags: ["marca", "Valparaíso", "leitura"],
  },
];

export function getFontFamily(id?: string): FontFamily | null {
  if (!id) return null;
  return FONT_FAMILIES.find((f) => f.id === id) ?? null;
}

export function getFontStack(id?: string): string | undefined {
  const f = getFontFamily(id);
  return f?.stack;
}

/* Carrega dinamicamente uma Google Font no <head> se ainda não estiver carregada */
const _loadedFonts = new Set<string>();
export function ensureFontLoaded(id: string) {
  if (typeof document === "undefined") return;
  if (_loadedFonts.has(id)) return;
  const font = getFontFamily(id);
  if (!font) return;
  const isFontFile = /\.(woff2?|ttf|otf)(\?.*)?$/i.test(font.url);
  if (isFontFile) {
    // Fonte custom (arquivo direto) — injeta @font-face
    const family = font.stack.split(",")[0].trim().replace(/^"|"$/g, "");
    const style = document.createElement("style");
    style.dataset.fontId = id;
    style.textContent = `@font-face{font-family:"${family}";src:url("${font.url}") format("woff2");font-display:swap;font-weight:${font.weights[0] ?? 400};}`;
    document.head.appendChild(style);
  } else {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.url;
    link.dataset.fontId = id;
    document.head.appendChild(link);
  }
  _loadedFonts.add(id);
}

/** Carrega preconnect + todas as fontes usadas em uma landing (chamar ao abrir o builder) */
export function ensureLandingFontsLoaded(fontIds: string[]) {
  if (typeof document === "undefined") return;
  // preconnect once
  if (!document.querySelector('link[data-font-preconnect="1"]')) {
    const p1 = document.createElement("link");
    p1.rel = "preconnect";
    p1.href = "https://fonts.googleapis.com";
    p1.dataset.fontPreconnect = "1";
    document.head.appendChild(p1);
    const p2 = document.createElement("link");
    p2.rel = "preconnect";
    p2.href = "https://fonts.gstatic.com";
    p2.crossOrigin = "";
    p2.dataset.fontPreconnect = "1";
    document.head.appendChild(p2);
  }
  fontIds.forEach(ensureFontLoaded);
}

/* ═══════════════════════════════════════════════════════════════════
   BIBLIOTECA DA MARCA VALPARAÍSO ADVENTURE PARK
   ─────────────────────────────────────────────────────────────────
   Ativos oficiais do parque (logos, mascotes, guarás, divisores,
   backgrounds, fotos curadas). Arquivos em public/brand/valparaiso/lib/
   extraídos do site oficial via scripts/crawl-valparaiso-assets.mjs.
   ═══════════════════════════════════════════════════════════════════ */

export type BrandAssetCategoria =
  | "logo"
  | "mascote"
  | "guaras"
  | "divisor"
  | "fundo"
  | "banner"
  | "foto";

export interface BrandAsset {
  id: string;
  label: string;
  src: string;
  categoria: BrandAssetCategoria;
  /** aspect ratio sugerido (w/h) */
  ratio: number;
  /** cor dominante (para preview quando offline) */
  tint?: string;
  /** tags para busca */
  tags?: string[];
}

const B = "/brand/valparaiso/lib";

export const BRAND_ASSETS: BrandAsset[] = [
  // LOGO
  {
    id: "logo_valparas",
    label: "Logo Valparaíso (vetor)",
    src: `${B}/logo-valparas.svg`,
    categoria: "logo",
    ratio: 180 / 99,
    tint: "#ff0030",
    tags: ["marca", "identidade"],
  },
  {
    id: "logo_png",
    label: "Logo Valparaíso (PNG)",
    src: `${B}/logo.png`,
    categoria: "logo",
    ratio: 2.4,
    tint: "#ffffff",
  },
  // MASCOTES / GUARÁS
  {
    id: "guaras_voo",
    label: "Guarás em voo (bando)",
    src: `${B}/guaras-voo.svg`,
    categoria: "guaras",
    ratio: 1035 / 285,
    tint: "#ff0030",
    tags: ["guará", "ave", "MA", "símbolo"],
  },
  {
    id: "mascote_horarios",
    label: "Mascote · horários",
    src: `${B}/mascote-horarios.jpg`,
    categoria: "mascote",
    ratio: 1,
  },
  // DIVISORES / ORNAMENTOS
  {
    id: "divisor_onda_branca",
    label: "Divisor · onda branca",
    src: `${B}/divisor-onda-branca.svg`,
    categoria: "divisor",
    ratio: 1080 / 9,
    tint: "#ffffff",
  },
  {
    id: "divisor_alerta_amarelo",
    label: "Divisor · alerta amarelo",
    src: `${B}/divisor-alerta-amarelo.svg`,
    categoria: "divisor",
    ratio: 338 / 13,
    tint: "#ffcc01",
  },
  {
    id: "divisor_onda_vertical",
    label: "Divisor · onda vertical",
    src: `${B}/divisor-onda-vertical.svg`,
    categoria: "divisor",
    ratio: 8 / 1080,
    tint: "#006938",
  },
  // FUNDOS
  {
    id: "bg_mapa_saoluis",
    label: "Fundo · mapa São Luís",
    src: `${B}/bg-mapa-saoluis.jpg`,
    categoria: "fundo",
    ratio: 16 / 9,
    tint: "#36ccc7",
    tags: ["mapa", "São Luís", "localização"],
  },
  {
    id: "bg_ingressos",
    label: "Fundo · ingressos/calendário",
    src: `${B}/bg-ingressos.jpg`,
    categoria: "fundo",
    ratio: 16 / 9,
    tint: "#003399",
    tags: ["blobs", "azul"],
  },
  {
    id: "bg_restaurante",
    label: "Fundo · restaurante",
    src: `${B}/bg-restaurante.png`,
    categoria: "fundo",
    ratio: 16 / 9,
    tint: "#006938",
  },
  // BANNERS DAS SEÇÕES
  {
    id: "banner_atracoes",
    label: "Banner · Atrações",
    src: `${B}/banner-atracoes.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  {
    id: "banner_passaportes",
    label: "Banner · Passaportes",
    src: `${B}/banner-passaportes.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  {
    id: "banner_promocoes",
    label: "Banner · Promoções",
    src: `${B}/banner-promocoes.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  {
    id: "banner_eventos",
    label: "Banner · Eventos",
    src: `${B}/banner-eventos.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  {
    id: "banner_restaurante",
    label: "Banner · Restaurante",
    src: `${B}/banner-restaurante.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  {
    id: "banner_sobre",
    label: "Banner · Sobre",
    src: `${B}/banner-sobre.jpg`,
    categoria: "banner",
    ratio: 3,
  },
  // FOTOS DE ATRAÇÕES
  ...Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      id: `foto_${n}`,
      label: `Foto atração #${n}`,
      src: `${B}/foto-${n}.webp`,
      categoria: "foto" as const,
      ratio: 3 / 2,
    };
  }),
];

export function getBrandAssetsByCategoria(
  cat: BrandAssetCategoria
): BrandAsset[] {
  return BRAND_ASSETS.filter((a) => a.categoria === cat);
}

export const BRAND_ASSET_CATEGORIAS: {
  cat: BrandAssetCategoria;
  label: string;
}[] = [
  { cat: "logo", label: "Logos" },
  { cat: "guaras", label: "Guarás" },
  { cat: "mascote", label: "Mascotes" },
  { cat: "divisor", label: "Divisores" },
  { cat: "fundo", label: "Fundos" },
  { cat: "banner", label: "Banners" },
  { cat: "foto", label: "Fotos" },
];

export function resolveAcaoHref(acao?: BtnAcao): string | undefined {
  if (!acao || !acao.valor) return undefined;
  switch (acao.tipo) {
    case "link":
      return acao.valor;
    case "scroll":
      return acao.valor.startsWith("#") ? acao.valor : `#${acao.valor}`;
    case "whatsapp": {
      const num = acao.valor.replace(/\D/g, "");
      return `https://wa.me/${num}`;
    }
    case "phone":
      return `tel:${acao.valor.replace(/\s/g, "")}`;
    case "email":
      return `mailto:${acao.valor}`;
    case "download":
      return acao.valor;
    default:
      return undefined;
  }
}
