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

/* ------------------------------------------------------------------ */
/* FORMAS ORGÂNICAS — catálogo de shapes SVG estilo Canva              */
/* ------------------------------------------------------------------ */

export type OrganicShapeCategoria =
  | "blob"
  | "onda"
  | "folha"
  | "estrela"
  | "explosao"
  | "fita"
  | "balao"
  | "seta";

export interface OrganicShape {
  id: string;
  label: string;
  categoria: OrganicShapeCategoria;
  /** viewBox do SVG — formas são normalizadas para caber num retângulo */
  viewBox: string;
  /** path data (d=) da forma */
  path: string;
  /** aspect ratio sugerido (w/h) — usado para definir tamanho inicial */
  ratio: number;
  /** tags para busca */
  tags?: string[];
}

export const ORGANIC_SHAPES: OrganicShape[] = [
  // BLOBS orgânicos (manchas assimétricas) — viewBox centrado em 0,0
  {
    id: "blob_1",
    label: "Blob suave",
    categoria: "blob",
    viewBox: "-90 -90 180 180",
    path: "M43,-61C56,-53,67,-41,73,-27C78,-13,77,3,71,16C65,29,53,38,41,47C29,56,15,66,-1,68C-17,70,-34,64,-47,54C-60,43,-69,27,-71,10C-72,-7,-67,-26,-57,-40C-46,-54,-30,-63,-13,-67C4,-70,23,-69,43,-61Z",
    ratio: 1,
    tags: ["blob", "organico", "mancha"],
  },
  {
    id: "blob_2",
    label: "Blob angular",
    categoria: "blob",
    viewBox: "-80 -80 160 160",
    path: "M50,-53C64,-42,74,-25,75,-7C76,10,68,28,55,42C42,56,24,66,4,63C-16,61,-37,46,-51,28C-64,10,-70,-11,-63,-28C-56,-44,-37,-56,-18,-62C1,-69,19,-69,36,-66Z",
    ratio: 1,
    tags: ["blob", "organico"],
  },
  {
    id: "blob_3",
    label: "Blob alongado",
    categoria: "blob",
    viewBox: "-90 -90 180 180",
    path: "M62,-52C75,-35,75,-8,67,11C58,30,42,42,22,52C3,61,-20,68,-38,60C-56,52,-70,28,-71,4C-72,-20,-60,-44,-43,-60C-26,-77,-3,-87,16,-81C36,-74,49,-69,62,-52Z",
    ratio: 1,
    tags: ["blob"],
  },
  // ONDAS
  {
    id: "onda_1",
    label: "Onda suave",
    categoria: "onda",
    viewBox: "0 0 400 80",
    path: "M0,40 C50,10 100,70 150,40 C200,10 250,70 300,40 C350,10 400,70 400,40 L400,80 L0,80 Z",
    ratio: 5,
    tags: ["onda", "divisor", "agua"],
  },
  {
    id: "onda_2",
    label: "Onda dupla",
    categoria: "onda",
    viewBox: "0 0 400 100",
    path: "M0,50 C80,0 160,100 240,50 C320,0 400,100 400,50 L400,100 L0,100 Z",
    ratio: 4,
    tags: ["onda", "divisor"],
  },
  {
    id: "onda_3",
    label: "Onda picos",
    categoria: "onda",
    viewBox: "0 0 400 80",
    path: "M0,80 Q50,0 100,40 T200,40 T300,40 T400,40 L400,80 Z",
    ratio: 5,
    tags: ["onda", "picos"],
  },
  // FOLHAS
  {
    id: "folha_1",
    label: "Folha simples",
    categoria: "folha",
    viewBox: "0 0 100 160",
    path: "M50,10 C80,40 90,90 50,150 C10,90 20,40 50,10 Z",
    ratio: 100 / 160,
    tags: ["folha", "natureza"],
  },
  {
    id: "folha_2",
    label: "Folha tropical",
    categoria: "folha",
    viewBox: "0 0 120 200",
    path: "M60,5 C95,35 110,100 90,180 Q60,195 30,180 C10,100 25,35 60,5 Z M60,20 L60,180",
    ratio: 120 / 200,
    tags: ["folha", "tropical"],
  },
  {
    id: "gota",
    label: "Gota d'água",
    categoria: "folha",
    viewBox: "0 0 100 140",
    path: "M50,5 C50,5 15,60 15,90 A35,35 0 0,0 85,90 C85,60 50,5 50,5 Z",
    ratio: 100 / 140,
    tags: ["gota", "agua"],
  },
  // ESTRELAS
  {
    id: "estrela_5",
    label: "Estrela 5 pontas",
    categoria: "estrela",
    viewBox: "0 0 100 100",
    path: "M50,5 L61,38 L96,38 L68,58 L79,92 L50,72 L21,92 L32,58 L4,38 L39,38 Z",
    ratio: 1,
    tags: ["estrela", "star"],
  },
  {
    id: "estrela_6",
    label: "Estrela 6 pontas",
    categoria: "estrela",
    viewBox: "0 0 100 100",
    path: "M50,5 L60,30 L90,30 L68,48 L78,78 L50,62 L22,78 L32,48 L10,30 L40,30 Z",
    ratio: 1,
    tags: ["estrela"],
  },
  {
    id: "estrela_suave",
    label: "Estrela arredondada",
    categoria: "estrela",
    viewBox: "0 0 100 100",
    path: "M50,10 Q56,38 85,42 Q62,58 68,88 Q50,72 32,88 Q38,58 15,42 Q44,38 50,10 Z",
    ratio: 1,
    tags: ["estrela", "suave"],
  },
  // EXPLOSÕES / BURSTS
  {
    id: "explosao_12",
    label: "Burst 12 pontas",
    categoria: "explosao",
    viewBox: "0 0 100 100",
    path: "M50,2 L55,22 L70,8 L65,28 L85,18 L75,36 L96,40 L78,48 L96,60 L75,64 L85,82 L65,72 L70,92 L55,78 L50,98 L45,78 L30,92 L35,72 L15,82 L25,64 L4,60 L22,48 L4,40 L25,36 L15,18 L35,28 L30,8 L45,22 Z",
    ratio: 1,
    tags: ["burst", "explosao", "destaque"],
  },
  {
    id: "explosao_sol",
    label: "Sol radiante",
    categoria: "explosao",
    viewBox: "0 0 100 100",
    path: "M50,20 A30,30 0 1,1 49.99,20 Z M50,0 L52,12 L48,12 Z M50,100 L48,88 L52,88 Z M0,50 L12,48 L12,52 Z M100,50 L88,52 L88,48 Z M15,15 L25,22 L22,25 Z M85,85 L75,78 L78,75 Z M85,15 L78,22 L75,25 Z M15,85 L22,78 L25,75 Z",
    ratio: 1,
    tags: ["sol", "raios"],
  },
  // FITAS / BANNERS
  {
    id: "fita_1",
    label: "Fita reta",
    categoria: "fita",
    viewBox: "0 0 300 80",
    path: "M20,20 L280,20 L300,40 L280,60 L20,60 L0,40 Z",
    ratio: 300 / 80,
    tags: ["fita", "banner", "destaque"],
  },
  {
    id: "fita_2",
    label: "Fita ondulada",
    categoria: "fita",
    viewBox: "0 0 300 100",
    path: "M0,30 Q75,10 150,30 T300,30 L300,70 Q225,90 150,70 T0,70 Z",
    ratio: 3,
    tags: ["fita", "ondulada"],
  },
  // BALÕES DE FALA
  {
    id: "balao_fala",
    label: "Balão de fala",
    categoria: "balao",
    viewBox: "0 0 200 160",
    path: "M20,10 L180,10 Q195,10 195,25 L195,115 Q195,130 180,130 L70,130 L40,155 L50,130 L20,130 Q5,130 5,115 L5,25 Q5,10 20,10 Z",
    ratio: 200 / 160,
    tags: ["balao", "fala", "chat"],
  },
  {
    id: "balao_pensamento",
    label: "Balão pensamento",
    categoria: "balao",
    viewBox: "0 0 200 160",
    path: "M100,15 C160,15 185,45 185,75 C185,105 160,130 100,130 C70,130 45,120 30,100 C20,110 10,110 5,100 C15,95 15,85 10,75 C10,45 40,15 100,15 Z",
    ratio: 200 / 160,
    tags: ["balao", "pensamento"],
  },
  // SETAS
  {
    id: "seta_reta",
    label: "Seta reta",
    categoria: "seta",
    viewBox: "0 0 200 80",
    path: "M0,30 L130,30 L130,10 L200,40 L130,70 L130,50 L0,50 Z",
    ratio: 200 / 80,
    tags: ["seta", "arrow"],
  },
  {
    id: "seta_curva",
    label: "Seta curva",
    categoria: "seta",
    viewBox: "0 0 200 140",
    path: "M20,120 Q20,30 120,30 L120,10 L190,45 L120,80 L120,60 Q60,60 60,120 Z",
    ratio: 200 / 140,
    tags: ["seta", "curva"],
  },
  {
    id: "raio",
    label: "Raio",
    categoria: "explosao",
    viewBox: "0 0 100 160",
    path: "M60,5 L20,85 L50,85 L35,155 L80,65 L50,65 Z",
    ratio: 100 / 160,
    tags: ["raio", "energia"],
  },
  {
    id: "coracao",
    label: "Coração",
    categoria: "folha",
    viewBox: "0 0 100 90",
    path: "M50,85 C50,85 10,55 10,30 C10,15 22,5 35,5 C42,5 48,10 50,18 C52,10 58,5 65,5 C78,5 90,15 90,30 C90,55 50,85 50,85 Z",
    ratio: 100 / 90,
    tags: ["coracao", "amor"],
  },
];

export const ORGANIC_SHAPE_CATEGORIAS: {
  cat: OrganicShapeCategoria;
  label: string;
}[] = [
  { cat: "blob", label: "Blobs" },
  { cat: "onda", label: "Ondas" },
  { cat: "folha", label: "Folhas" },
  { cat: "estrela", label: "Estrelas" },
  { cat: "explosao", label: "Bursts" },
  { cat: "fita", label: "Fitas" },
  { cat: "balao", label: "Balões" },
  { cat: "seta", label: "Setas" },
];

export function getOrganicShapeById(id: string): OrganicShape | undefined {
  return ORGANIC_SHAPES.find((s) => s.id === id);
}

export function getOrganicShapesByCategoria(
  cat: OrganicShapeCategoria
): OrganicShape[] {
  return ORGANIC_SHAPES.filter((s) => s.categoria === cat);
}

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
