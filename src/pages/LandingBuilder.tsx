import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  BarChart3,
  Bold,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Copy,
  Eye,
  ExternalLink,
  Film,
  Flame,
  Globe2,
  Image as ImageIcon,
  Italic,
  Key,
  Layers,
  LayoutGrid,
  LineChart as LineChartIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Monitor,
  MousePointer2,
  MousePointerClick,
  Palette,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Shapes,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Tablet,
  Trash2,
  Type as TypeIcon,
  Underline,
  Undo2,
  Upload,
  Users,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { number, pct, relativeTime } from "@/lib/format";
import { landingPages as landingPagesMock } from "@/lib/mock";
import type { ClarityConfig, ClarityMetrics, LandingPage, LPElemento, LPElementoTipo } from "@/lib/types";
import {
  buildClaritySnippet,
  disconnectClarity,
  getClarityConfig,
  getLandingMetrics,
  heatmapDeepLink,
  invalidateClarityCache,
  recordingsDeepLink,
  saveClarityConfig,
} from "@/lib/clarity";
import {
  BG_ANIMATIONS,
  BRAND_ASSETS,
  BRAND_ASSET_CATEGORIAS,
  BTN_ICON_LABEL,
  FONT_FAMILIES,
  ensureLandingFontsLoaded,
  getBgAnimation,
  getFontStack,
  resolveAcaoHref,
  type BgAnimationId,
  type BrandAsset,
  type BrandAssetCategoria,
  type BtnIconKey,
} from "@/lib/landingAssets";
import {
  ArrowRight,
  Download as DownloadIcon,
  Heart,
  Mail as MailIcon,
  MessageCircle,
  Phone,
  Play,
  ShoppingCart,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   CANVAS
   ═══════════════════════════════════════════════════════════════════ */

const CANVAS_DESKTOP_W = 1040;
const CANVAS_MOBILE_W = 390;
const DEFAULT_CANVAS_H = 2400;

/* ═══════════════════════════════════════════════════════════════════
   TEMPLATES
   ═══════════════════════════════════════════════════════════════════ */

type TemplateId = LandingPage["template"];

const templateLabel: Record<TemplateId, string> = {
  valparaiso_park: "Valparaíso Park · Home oficial",
  passaporte_anual: "Passaporte Anual · Família",
  passaporte_diario: "Day-Use · Ingresso do dia",
  evento_corporativo: "Faça Seu Evento · Corporativo",
  festa_aniversario: "Festa no Parque · Aniversário",
  aventura_radical: "Aventura Radical · Tirolesa & Arvorismo",
  promocoes: "Promoções · Campanha sazonal",
  blank: "Em branco",
};

const templateDesc: Record<TemplateId, string> = {
  valparaiso_park: "Home completa do parque — verde da marca, guarás em voo, tipografia oficial.",
  passaporte_anual: "Venda do passaporte anual família — um ano inteiro de memórias no Valparaíso.",
  passaporte_diario: "Ingresso day-use com escassez de data — ideal pra tráfego pago.",
  evento_corporativo: "Captação B2B para confraternizações, onboarding e eventos empresariais.",
  festa_aniversario: "Aniversário no parque — pacote kids com decoração e monitoria.",
  aventura_radical: "Tirolesa, arvorismo e trilhas — público jovem/adulto adrenalina.",
  promocoes: "Oferta relâmpago com contador — virada de temporada, black friday, campanhas.",
  blank: "Em branco. Crie do zero.",
};

/* Gradientes sempre dentro da paleta da marca: verde #006938, navy #00297a, vermelho #ff0030, amarelo #ffcc01 */
const templateGradient: Record<TemplateId, string> = {
  valparaiso_park: "linear-gradient(135deg,#006938,#00297a,#ff0030)",
  passaporte_anual: "linear-gradient(135deg,#006938,#94c93b,#ffcc01)",
  passaporte_diario: "linear-gradient(135deg,#ff0030,#ff5e26,#ffcc01)",
  evento_corporativo: "linear-gradient(135deg,#00297a,#003399,#006938)",
  festa_aniversario: "linear-gradient(135deg,#ff0030,#ffcc01,#36ccc7)",
  aventura_radical: "linear-gradient(135deg,#006938,#00297a,#000000)",
  promocoes: "linear-gradient(135deg,#000000,#ff0030,#ffcc01)",
  blank: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
};

const templateAccent: Record<TemplateId, { primary: string; text: string }> = {
  valparaiso_park: { primary: "#ff0030", text: "#ffffff" },
  passaporte_anual: { primary: "#ff0030", text: "#ffffff" },
  passaporte_diario: { primary: "#ffcc01", text: "#000000" },
  evento_corporativo: { primary: "#ffcc01", text: "#ffffff" },
  festa_aniversario: { primary: "#ff0030", text: "#ffffff" },
  aventura_radical: { primary: "#ffcc01", text: "#000000" },
  promocoes: { primary: "#ffcc01", text: "#000000" },
  blank: { primary: "#0B6BCB", text: "#ffffff" },
};

/* Todos os templates da marca usam valparas (display) + blogger_sans (body). */
const templateFonts: Record<TemplateId, { heading: string; body: string }> = {
  valparaiso_park: { heading: "valparas", body: "blogger_sans" },
  passaporte_anual: { heading: "valparas", body: "blogger_sans" },
  passaporte_diario: { heading: "valparas", body: "blogger_sans" },
  evento_corporativo: { heading: "valparas", body: "blogger_sans" },
  festa_aniversario: { heading: "valparas", body: "blogger_sans" },
  aventura_radical: { heading: "valparas", body: "blogger_sans" },
  promocoes: { heading: "valparas", body: "blogger_sans" },
  blank: { heading: "inter", body: "inter" },
};

/* ═══════════════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════════════ */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const uid = () => crypto.randomUUID();

/* ═══════════════════════════════════════════════════════════════════
   DEFAULTS + TEMPLATES COMO ELEMENTOS
   ═══════════════════════════════════════════════════════════════════ */

const elementoDefaults = (tipo: LPElementoTipo, x: number, y: number, z: number): LPElemento => {
  const base: LPElemento = { id: uid(), tipo, x, y, w: 200, h: 60, z };
  switch (tipo) {
    case "texto":
      return {
        ...base,
        w: 360,
        h: 48,
        texto: "Texto novo",
        fontSize: 24,
        fontWeight: 700,
        color: "#0f172a",
        align: "left",
      };
    case "imagem":
      return { ...base, w: 320, h: 220, radius: 12, fit: "cover" };
    case "video":
      return { ...base, w: 480, h: 270, radius: 12 };
    case "botao":
      return {
        ...base,
        w: 220,
        h: 50,
        texto: "Clique aqui",
        color: "#0f172a",
        bg: "#fbbf24",
        fontSize: 15,
        fontWeight: 700,
        radius: 999,
        align: "center",
        shadow: true,
      };
    case "forma_retangulo":
      return { ...base, w: 300, h: 200, bg: "#0B6BCB", radius: 16 };
    case "forma_circulo":
      return { ...base, w: 160, h: 160, bg: "#fbbf24", radius: 999 };
    case "icone":
      return { ...base, w: 48, h: 48, iconeNome: "star", color: "#0B6BCB" };
    case "bg_animado":
      return { ...base, w: 560, h: 320, radius: 16, bgAnimId: "ocean_waves" };
  }
};

/* ═══════════════════════════════════════════════════════════════════
   RECIPE-DRIVEN TEMPLATES — cada template tem copy, cenas, fontes e
   paleta próprias. Inspirado em landings campeãs (Beach Park, Stripe,
   Airbnb, Linear, Shopify BFCM) + skill ui-ux-pro-max.
   ═══════════════════════════════════════════════════════════════════ */

type Beneficio = { titulo: string; desc: string; icone: string };
type Plano = { n: string; p: string; s: string };

interface TemplateRecipe {
  heroScene: string | null;
  ctaFinalScene: string | null;
  /** Gradient fallback quando heroScene for null (p.ex. minimal) */
  heroBgOverride?: string;
  /** Gradient principal usado em botões CTAs */
  btnGrad: { de: string; para: string };
  /** Overlay no hero — ajusta contraste sobre cena */
  heroOverlay: string;
  /** Badge do hero (label curto) */
  badge: string;
  /** Título e subtítulo do hero */
  heroTitle: string;
  heroSubtitle: string;
  /** Copy dos CTAs do hero */
  ctaPrimary: { label: string; icon: BtnIconKey; hoverFx: "lift" | "glow" | "pulse" };
  ctaSecondary: { label: string; icon: BtnIconKey };
  /** Seção de benefícios */
  benefitsTitle: string;
  benefits: [Beneficio, Beneficio, Beneficio];
  /** Seção de galeria */
  galleryTitle: string;
  /** Seção de preços */
  pricingTitle: string;
  plans: [Plano, Plano, Plano];
  /** Seção de CTA final */
  ctaFinalTitle: string;
  ctaFinalSubtitle: string;
  ctaFinalLabel: string;
  ctaFinalIcon: BtnIconKey;
  /** Fundo do canvas global */
  canvasBg: string;
  /** Hero text sempre claro? (sobre cena escura) */
  heroLight: boolean;
  /** Uppercase no headline (pra templates promocionais) */
  headlineUpper?: boolean;
  /** Letter spacing do headline (px, default 0) */
  headlineLetter?: number;
}

const TEMPLATE_RECIPES: Record<TemplateId, TemplateRecipe> = {
  passaporte_anual: {
    heroScene: "family_sunshine",
    ctaFinalScene: "ocean_waves",
    btnGrad: { de: "#ff0030", para: "#ff5e26" },
    heroOverlay: "linear-gradient(180deg,rgba(0,105,56,0.45) 0%,rgba(0,41,122,0.75) 100%)",
    badge: "PASSAPORTE ANUAL · TEMPORADA 2026",
    heroTitle: "Um ano inteiro de Valparaíso na sua família",
    heroSubtitle:
      "Acesso ilimitado ao parque aquático, tirolesa, arvorismo e trilhas. 12 meses pra criar memória sem contar quantas vezes vocês vão voltar.",
    ctaPrimary: { label: "Quero meu passaporte", icon: "arrow_right", hoverFx: "lift" },
    ctaSecondary: { label: "Falar no WhatsApp", icon: "whatsapp" },
    benefitsTitle: "Feito pra quem visita o parque mais de uma vez no ano",
    benefits: [
      { titulo: "Acesso ilimitado", desc: "Entre quantas vezes quiser por 12 meses — sem restrição.", icone: "check" },
      { titulo: "Família completa", desc: "Até 4 dependentes no mesmo passaporte anual família.", icone: "heart" },
      { titulo: "Descontos no restaurante", desc: "15% OFF no Restaurante do Parque o ano inteiro.", icone: "star" },
    ],
    galleryTitle: "O parque que você vai conhecer a cada visita",
    pricingTitle: "Escolha seu passaporte",
    plans: [
      { n: "Individual", p: "R$ 349", s: "12x R$ 34,90 · 1 pessoa" },
      { n: "Família 4", p: "R$ 1.099", s: "12x R$ 109,90 · até 4 pessoas" },
      { n: "Família 6", p: "R$ 1.499", s: "12x R$ 149,90 · até 6 pessoas" },
    ],
    ctaFinalTitle: "Ative agora seu passaporte 2026",
    ctaFinalSubtitle: "Começa a valer no mesmo dia da ativação. Parcele em 12x no cartão ou à vista no Pix.",
    ctaFinalLabel: "Quero ativar o passaporte",
    ctaFinalIcon: "whatsapp",
    canvasBg: "#006938",
    heroLight: true,
    headlineLetter: -0.3,
  },
  passaporte_diario: {
    heroScene: "splash_drops",
    ctaFinalScene: "confetti_party",
    btnGrad: { de: "#ffcc01", para: "#ff5e26" },
    heroOverlay: "linear-gradient(180deg,rgba(0,105,56,0.35) 0%,rgba(0,105,56,0.7) 100%)",
    badge: "⚡ DAY-USE · INGRESSO DO DIA",
    heroTitle: "Um dia no Valparaíso, memória pra vida",
    heroSubtitle:
      "Ingresso day-use com acesso a tudo — parque aquático, tirolesa, arvorismo e trilhas. Comprou online, pulou a fila.",
    ctaPrimary: { label: "Comprar ingresso", icon: "cart", hoverFx: "pulse" },
    ctaSecondary: { label: "Ver como chegar", icon: "arrow_right" },
    benefitsTitle: "Um ingresso, o parque inteiro na sua mão",
    benefits: [
      { titulo: "Todas atrações liberadas", desc: "Do abre ao fecha, sem restrição e sem taxa extra.", icone: "check" },
      { titulo: "Pula-fila digital", desc: "QR Code no WhatsApp — entra direto na catraca.", icone: "star" },
      { titulo: "Estacionamento grátis", desc: "Gratuito para quem compra online antecipado.", icone: "heart" },
    ],
    galleryTitle: "O que você vai viver hoje",
    pricingTitle: "Ingressos day-use",
    plans: [
      { n: "Infantil (até 10)", p: "R$ 69", s: "Criança · entrada individual" },
      { n: "Adulto", p: "R$ 129", s: "Inteira · qualquer dia" },
      { n: "Família 4", p: "R$ 449", s: "4 pessoas · economize R$ 67" },
    ],
    ctaFinalTitle: "Reserve sua data antes de esgotar",
    ctaFinalSubtitle: "Fins de semana e feriados saem rápido. Garanta seu lugar e receba o QR Code no WhatsApp.",
    ctaFinalLabel: "Quero meu ingresso",
    ctaFinalIcon: "cart",
    canvasBg: "#006938",
    heroLight: true,
    headlineLetter: -0.5,
  },
  evento_corporativo: {
    heroScene: "corp_night",
    ctaFinalScene: "palm_breeze",
    btnGrad: { de: "#ffcc01", para: "#ff0030" },
    heroOverlay: "linear-gradient(180deg,rgba(0,41,122,0.55) 0%,rgba(0,0,0,0.85) 100%)",
    badge: "FAÇA SEU EVENTO · VALPARAÍSO CORPORATE",
    heroTitle: "O cenário que a sua equipe não esquece",
    heroSubtitle:
      "Confraternizações, convenções e team buildings em 200 mil m² de natureza preservada. Estrutura completa para até 3.000 colaboradores — com produção turnkey.",
    ctaPrimary: { label: "Solicitar proposta", icon: "mail", hoverFx: "lift" },
    ctaSecondary: { label: "Falar no WhatsApp", icon: "whatsapp" },
    benefitsTitle: "O destino preferido das empresas do Maranhão",
    benefits: [
      { titulo: "Estrutura turnkey", desc: "Som, luz, palco, AV, catering e coordenação entregues prontos.", icone: "check" },
      { titulo: "Team building real", desc: "Trilhas, rapel, arvorismo e dinâmicas com facilitador próprio.", icone: "heart" },
      { titulo: "Menu executivo", desc: "Brigada própria, cardápio customizado e restaurante privativo.", icone: "star" },
    ],
    galleryTitle: "Eventos que aconteceram no parque",
    pricingTitle: "Formatos de evento",
    plans: [
      { n: "Day Use Team", p: "R$ 119 / pax", s: "Mínimo 40 pessoas" },
      { n: "Convenção", p: "Sob consulta", s: "Proposta em até 2h úteis" },
      { n: "Festa da Empresa", p: "R$ 189 / pax", s: "Open food + DJ + estrutura" },
    ],
    ctaFinalTitle: "Proposta personalizada em até 2 horas úteis",
    ctaFinalSubtitle: "Conta pra gente o formato, a data e o volume — nosso time de eventos monta o escopo completo no mesmo dia.",
    ctaFinalLabel: "Solicitar proposta",
    ctaFinalIcon: "mail",
    canvasBg: "#00297a",
    heroLight: true,
    headlineLetter: -0.3,
  },
  festa_aniversario: {
    heroScene: "confetti_party",
    ctaFinalScene: "family_sunshine",
    btnGrad: { de: "#ff0030", para: "#ffcc01" },
    heroOverlay: "linear-gradient(180deg,rgba(0,105,56,0.35) 0%,rgba(255,0,48,0.55) 100%)",
    badge: "FESTA NO PARQUE · ANIVERSÁRIO",
    heroTitle: "O aniversário que seu filho vai lembrar pra sempre",
    heroSubtitle:
      "Pacote completo com monitores dedicados, decoração temática, bolo e acesso livre às atrações aquáticas. Pra festas de até 50 convidados.",
    ctaPrimary: { label: "Montar minha festa", icon: "sparkles", hoverFx: "pulse" },
    ctaSecondary: { label: "Falar com a equipe", icon: "whatsapp" },
    benefitsTitle: "Por que o Valparaíso é o melhor lugar pra comemorar",
    benefits: [
      { titulo: "Monitoria exclusiva", desc: "Equipe dedicada só pro seu aniversário o dia inteiro.", icone: "heart" },
      { titulo: "Decoração temática", desc: "Mais de 15 temas prontos ou totalmente personalizados.", icone: "sparkles" },
      { titulo: "Tudo incluso", desc: "Ingresso, alimentação, bolo, decoração e kit lembrança.", icone: "star" },
    ],
    galleryTitle: "Festas que já aconteceram por aqui",
    pricingTitle: "Pacotes de aniversário",
    plans: [
      { n: "Splash 15", p: "R$ 1.890", s: "até 15 convidados · 4h de festa" },
      { n: "Splash 30", p: "R$ 2.990", s: "até 30 convidados · 5h + bolo" },
      { n: "Splash Deluxe", p: "R$ 4.990", s: "até 50 · open food + DJ kids" },
    ],
    ctaFinalTitle: "Agenda de sábados enchendo rápido",
    ctaFinalSubtitle: "Temos poucas datas disponíveis nos próximos 3 meses. Reserve agora e ganhe a decoração cortesia.",
    ctaFinalLabel: "Reservar minha data",
    ctaFinalIcon: "whatsapp",
    canvasBg: "#006938",
    heroLight: true,
  },
  aventura_radical: {
    heroScene: "deep_bubbles",
    ctaFinalScene: "vip_gold",
    btnGrad: { de: "#ffcc01", para: "#ff0030" },
    heroOverlay: "linear-gradient(180deg,rgba(0,105,56,0.55) 0%,rgba(0,0,0,0.85) 100%)",
    badge: "AVENTURA RADICAL · TIROLESA & ARVORISMO",
    heroTitle: "Do chão aos 25 metros de queda livre",
    heroSubtitle:
      "Tirolesa, arvorismo, rapel e escalada. Quatro circuitos radicais no meio da mata nativa, com monitoria certificada e equipamentos importados.",
    ctaPrimary: { label: "Quero encarar", icon: "arrow_right", hoverFx: "glow" },
    ctaSecondary: { label: "Ver atrações", icon: "play" },
    benefitsTitle: "A adrenalina que o Maranhão só tem aqui",
    benefits: [
      { titulo: "Tirolesa 400m", desc: "Maior travessia aérea do estado — sobre a mata nativa.", icone: "star" },
      { titulo: "Arvorismo em 3 níveis", desc: "Do iniciante ao avançado, com monitores certificados.", icone: "heart" },
      { titulo: "Segurança UIAA", desc: "Equipamentos de montanhismo e dupla-ancora em tudo.", icone: "check" },
    ],
    galleryTitle: "Os circuitos radicais do parque",
    pricingTitle: "Ingressos aventura",
    plans: [
      { n: "Circuito Light", p: "R$ 89", s: "Arvorismo iniciante · 1h" },
      { n: "Aventura Total", p: "R$ 249", s: "Tirolesa + arvorismo + rapel" },
      { n: "Radical Pass", p: "R$ 349", s: "Aventura + parque aquático · dia inteiro" },
    ],
    ctaFinalTitle: "Encara ou encara?",
    ctaFinalSubtitle: "Vagas limitadas por turno para garantir segurança. Reserve sua data e horário antes de esgotar.",
    ctaFinalLabel: "Reservar minha aventura",
    ctaFinalIcon: "arrow_right",
    canvasBg: "#0a0a0a",
    heroLight: true,
    headlineLetter: -0.5,
  },
  promocoes: {
    heroScene: "splash_drops",
    ctaFinalScene: "confetti_party",
    btnGrad: { de: "#ffcc01", para: "#ff0030" },
    heroOverlay: "linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(255,0,48,0.75) 100%)",
    badge: "🔥 PROMOÇÃO RELÂMPAGO · TERMINA EM 48H",
    heroTitle: "ATÉ 40% OFF NO SEU DIA NO VALPARAÍSO",
    heroSubtitle:
      "Preços promocionais de temporada, parcelamento em 12x e brindes exclusivos. Campanha válida enquanto duram os ingressos — contador oficial rodando.",
    ctaPrimary: { label: "Comprar com desconto", icon: "cart", hoverFx: "pulse" },
    ctaSecondary: { label: "Ativar lembrete", icon: "mail" },
    benefitsTitle: "A promoção mais esperada da temporada",
    benefits: [
      { titulo: "40% OFF no day-use", desc: "Ingresso individual a R$ 77 (de R$ 129) — só essa semana.", icone: "star" },
      { titulo: "30% OFF no anual", desc: "Passaporte família por R$ 769 (de R$ 1.099).", icone: "heart" },
      { titulo: "Brinde exclusivo", desc: "Camisa oficial + kit praia grátis pra primeiros 500.", icone: "check" },
    ],
    galleryTitle: "Aproveite todo o parque com desconto",
    pricingTitle: "Ofertas relâmpago",
    plans: [
      { n: "Day Use", p: "R$ 77", s: "De R$ 129 · 40% OFF" },
      { n: "Família 4", p: "R$ 269", s: "De R$ 449 · 40% OFF" },
      { n: "Anual Família", p: "R$ 769", s: "De R$ 1.099 · 30% OFF" },
    ],
    ctaFinalTitle: "48 horas. Depois volta ao preço cheio.",
    ctaFinalSubtitle: "O desconto não se repete essa temporada. Garanta agora antes do contador zerar.",
    ctaFinalLabel: "Comprar com 40% OFF",
    ctaFinalIcon: "cart",
    canvasBg: "#000000",
    heroLight: true,
    headlineUpper: true,
    headlineLetter: -1,
  },
  valparaiso_park: {
    heroScene: "palm_breeze",
    ctaFinalScene: "family_sunshine",
    btnGrad: { de: "#ff0030", para: "#ff5e26" },
    heroOverlay: "linear-gradient(180deg,rgba(0,105,56,0.55) 0%,rgba(0,41,122,0.75) 100%)",
    badge: "VALPARAÍSO ADVENTURE PARK · OFICIAL",
    heroTitle: "Aventura que cabe num dia inteiro",
    heroSubtitle:
      "Parque aquático, tirolesa, arvorismo e trilhas no coração do Maranhão. Uma experiência para a família toda em um só lugar.",
    ctaPrimary: { label: "Comprar ingresso", icon: "cart", hoverFx: "lift" },
    ctaSecondary: { label: "Falar no WhatsApp", icon: "whatsapp" },
    benefitsTitle: "Por que o Valparaíso é diferente",
    benefits: [
      { titulo: "Natureza preservada", desc: "200 mil m² de mata nativa com trilhas sinalizadas.", icone: "star" },
      { titulo: "Aventura pra toda família", desc: "Do parque aquático aos esportes radicais — todos juntos.", icone: "heart" },
      { titulo: "Estrutura completa", desc: "Restaurantes, estacionamento coberto, acessibilidade total.", icone: "check" },
    ],
    galleryTitle: "Conheça o parque",
    pricingTitle: "Ingressos e pacotes",
    plans: [
      { n: "Day Use", p: "R$ 129", s: "Inteira · qualquer dia" },
      { n: "Família", p: "R$ 449", s: "4 pessoas · economize R$ 67" },
      { n: "Aventura Total", p: "R$ 249", s: "Inclui tirolesa + arvorismo" },
    ],
    ctaFinalTitle: "Reserve já a sua data",
    ctaFinalSubtitle: "Fins de semana esgotam rápido. Garanta seu ingresso online e pule a fila.",
    ctaFinalLabel: "Comprar ingresso",
    ctaFinalIcon: "cart",
    canvasBg: "#006938",
    heroLight: true,
    headlineLetter: -0.5,
  },
  blank: {
    heroScene: null,
    ctaFinalScene: null,
    btnGrad: { de: "#0B6BCB", para: "#7c3aed" },
    heroOverlay: "",
    badge: "",
    heroTitle: "Clique e comece a criar",
    heroSubtitle: "Arraste elementos da paleta à esquerda",
    ctaPrimary: { label: "", icon: "none", hoverFx: "lift" },
    ctaSecondary: { label: "", icon: "none" },
    benefitsTitle: "",
    benefits: [
      { titulo: "", desc: "", icone: "check" },
      { titulo: "", desc: "", icone: "check" },
      { titulo: "", desc: "", icone: "check" },
    ],
    galleryTitle: "",
    pricingTitle: "",
    plans: [
      { n: "", p: "", s: "" },
      { n: "", p: "", s: "" },
      { n: "", p: "", s: "" },
    ],
    ctaFinalTitle: "",
    ctaFinalSubtitle: "",
    ctaFinalLabel: "",
    ctaFinalIcon: "none",
    canvasBg: "#ffffff",
    heroLight: false,
  },
};

const buildTemplate = (t: TemplateId): { elementos: LPElemento[]; bg: string; h: number } => {
  const recipe = TEMPLATE_RECIPES[t];
  const acc = templateAccent[t];
  const fonts = templateFonts[t];
  const grad = templateGradient[t];
  const heading = fonts.heading;
  const body = fonts.body;

  // ─── BLANK ─────────────────────────────────
  if (t === "blank") {
    return {
      bg: recipe.canvasBg,
      h: DEFAULT_CANVAS_H,
      elementos: [
        {
          id: uid(),
          tipo: "texto",
          x: 120,
          y: 200,
          w: 800,
          h: 80,
          z: 1,
          texto: recipe.heroTitle,
          fontSize: 54,
          fontWeight: 800,
          color: "#0f172a",
          align: "center",
          fontFamily: heading,
        },
        {
          id: uid(),
          tipo: "texto",
          x: 220,
          y: 300,
          w: 600,
          h: 40,
          z: 2,
          texto: recipe.heroSubtitle,
          fontSize: 16,
          fontWeight: 400,
          color: "#64748b",
          align: "center",
          fontFamily: body,
        },
      ],
    };
  }

  const heroLight = recipe.heroLight;
  const heroTextColor = heroLight ? "#ffffff" : "#0f172a";
  const heroSubColor = heroLight ? "rgba(255,255,255,0.94)" : "rgba(15,23,42,0.75)";
  const titleColor = "#0f172a";
  const bodyColor = "#475569";
  const g = recipe.btnGrad;

  let z = 0;
  const elementos: LPElemento[] = [];

  // ─── HERO ─────────────────────────────────
  const HERO_H = 620;
  if (recipe.heroScene) {
    elementos.push({
      id: uid(),
      tipo: "bg_animado",
      x: 0,
      y: 0,
      w: CANVAS_DESKTOP_W,
      h: HERO_H,
      z: z++,
      bgAnimId: recipe.heroScene,
      radius: 0,
    });
  } else {
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x: 0,
      y: 0,
      w: CANVAS_DESKTOP_W,
      h: HERO_H,
      z: z++,
      bg: recipe.heroBgOverride ?? grad,
      radius: 0,
    });
  }
  if (recipe.heroOverlay) {
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x: 0,
      y: 0,
      w: CANVAS_DESKTOP_W,
      h: HERO_H,
      z: z++,
      bg: recipe.heroOverlay,
      radius: 0,
    });
  }

  // Badge
  elementos.push({
    id: uid(),
    tipo: "botao",
    x: CANVAS_DESKTOP_W / 2 - 200,
    y: 120,
    w: 400,
    h: 34,
    z: z++,
    texto: recipe.badge,
    fontSize: 11,
    fontWeight: 700,
    color: heroTextColor,
    btnVariante: "glass",
    btnRadiusPreset: "pill",
    align: "center",
    fontFamily: body,
    letterSpacing: 1.2,
  });

  // Hero title
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 80,
    y: 190,
    w: 880,
    h: 170,
    z: z++,
    texto: recipe.heroTitle,
    fontSize: recipe.headlineUpper ? 58 : 54,
    fontWeight: heading === "bebas" || heading === "anton" || heading === "oswald" ? 400 : 800,
    color: heroTextColor,
    align: "center",
    shadow: heroLight,
    fontFamily: heading,
    lineHeight: 1.08,
    letterSpacing: recipe.headlineLetter,
    textTransform: recipe.headlineUpper ? "uppercase" : "none",
  });

  // Hero subtitle
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 180,
    y: 376,
    w: 680,
    h: 72,
    z: z++,
    texto: recipe.heroSubtitle,
    fontSize: 17,
    fontWeight: 400,
    color: heroSubColor,
    align: "center",
    fontFamily: body,
    lineHeight: 1.55,
  });

  // CTA primary
  elementos.push({
    id: uid(),
    tipo: "botao",
    x: CANVAS_DESKTOP_W / 2 - 140,
    y: 480,
    w: 260,
    h: 58,
    z: z++,
    texto: recipe.ctaPrimary.label,
    fontSize: 15,
    fontWeight: 800,
    color: acc.text,
    btnVariante: "gradient",
    btnGradientDe: g.de,
    btnGradientPara: g.para,
    btnRadiusPreset: "pill",
    btnIcon: recipe.ctaPrimary.icon,
    btnIconPos: "right",
    btnHoverFx: recipe.ctaPrimary.hoverFx,
    btnAcao: { tipo: "scroll", valor: "#precos" },
    align: "center",
    shadow: true,
    fontFamily: body,
    letterSpacing: 0.2,
  });

  // CTA secondary
  elementos.push({
    id: uid(),
    tipo: "botao",
    x: CANVAS_DESKTOP_W / 2 + 140,
    y: 480,
    w: 220,
    h: 58,
    z: z++,
    texto: recipe.ctaSecondary.label,
    fontSize: 14,
    fontWeight: 700,
    color: heroTextColor,
    btnVariante: "outline",
    bg: heroTextColor,
    btnRadiusPreset: "pill",
    btnIcon: recipe.ctaSecondary.icon,
    btnIconPos: "left",
    btnHoverFx: "glow",
    btnAcao: { tipo: "whatsapp", valor: "5598999999999" },
    align: "center",
    fontFamily: body,
  });

  // ─── TRUST BAR (thin strip) ─────────────────────────────────
  const trustY = HERO_H + 30;
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 120,
    y: trustY,
    w: 800,
    h: 24,
    z: z++,
    texto: "CONFIADO POR  ·  BEACH PARK  ·  SEBRAE MA  ·  REDE GLOBO  ·  G1  ·  ESTADÃO",
    fontSize: 10,
    fontWeight: 600,
    color: "#94a3b8",
    align: "center",
    fontFamily: body,
    letterSpacing: 2,
  });

  // ─── BENEFÍCIOS ─────────────────────────────────
  const sec2Y = HERO_H + 100;
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 120,
    y: sec2Y,
    w: 800,
    h: 52,
    z: z++,
    texto: recipe.benefitsTitle,
    fontSize: 36,
    fontWeight: heading === "bebas" || heading === "anton" ? 400 : 800,
    color: titleColor,
    align: "center",
    fontFamily: heading,
    lineHeight: 1.15,
  });
  recipe.benefits.forEach((b, i) => {
    const x = 120 + i * 270;
    // Card
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x,
      y: sec2Y + 100,
      w: 250,
      h: 180,
      z: z++,
      bg: "#ffffff",
      radius: 20,
      borderColor: "#e2e8f0",
      borderWidth: 1,
      shadow: true,
    });
    // Badge circular com ícone
    elementos.push({
      id: uid(),
      tipo: "forma_circulo",
      x: x + 24,
      y: sec2Y + 124,
      w: 48,
      h: 48,
      z: z++,
      bg: acc.primary,
      radius: 999,
    });
    elementos.push({
      id: uid(),
      tipo: "icone",
      x: x + 36,
      y: sec2Y + 136,
      w: 24,
      h: 24,
      z: z++,
      iconeNome: b.icone,
      color: acc.text,
    });
    elementos.push({
      id: uid(),
      tipo: "texto",
      x: x + 24,
      y: sec2Y + 190,
      w: 210,
      h: 30,
      z: z++,
      texto: b.titulo,
      fontSize: 17,
      fontWeight: 700,
      color: titleColor,
      align: "left",
      fontFamily: heading,
    });
    elementos.push({
      id: uid(),
      tipo: "texto",
      x: x + 24,
      y: sec2Y + 222,
      w: 210,
      h: 52,
      z: z++,
      texto: b.desc,
      fontSize: 13,
      fontWeight: 400,
      color: bodyColor,
      align: "left",
      fontFamily: body,
      lineHeight: 1.5,
    });
  });

  // ─── GALERIA (6 thumbs em grid 3x2) ─────────────────────────────────
  const sec3Y = sec2Y + 380;
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 120,
    y: sec3Y,
    w: 800,
    h: 44,
    z: z++,
    texto: recipe.galleryTitle,
    fontSize: 32,
    fontWeight: heading === "bebas" || heading === "anton" ? 400 : 800,
    color: titleColor,
    align: "center",
    fontFamily: heading,
  });
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x: 120 + col * 270,
      y: sec3Y + 90 + row * 190,
      w: 250,
      h: 170,
      z: z++,
      bg: grad,
      radius: 16,
      shadow: true,
    });
  }

  // ─── PRICING ─────────────────────────────────
  const sec4Y = sec3Y + 480;
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 120,
    y: sec4Y,
    w: 800,
    h: 44,
    z: z++,
    texto: recipe.pricingTitle,
    fontSize: 32,
    fontWeight: heading === "bebas" || heading === "anton" ? 400 : 800,
    color: titleColor,
    align: "center",
    fontFamily: heading,
  });
  recipe.plans.forEach((pl, i) => {
    const x = 120 + i * 270;
    const destaque = i === 1;
    // Card
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x,
      y: sec4Y + 90,
      w: 250,
      h: 300,
      z: z++,
      bg: "#ffffff",
      radius: 20,
      borderColor: destaque ? acc.primary : "#e2e8f0",
      borderWidth: destaque ? 2 : 1,
      shadow: true,
    });
    // "MAIS POPULAR" badge quando destaque
    if (destaque) {
      elementos.push({
        id: uid(),
        tipo: "botao",
        x: x + 60,
        y: sec4Y + 74,
        w: 130,
        h: 28,
        z: z++,
        texto: "MAIS POPULAR",
        fontSize: 10,
        fontWeight: 800,
        color: acc.text,
        bg: acc.primary,
        btnRadiusPreset: "pill",
        align: "center",
        fontFamily: body,
        letterSpacing: 1,
      });
    }
    elementos.push({
      id: uid(),
      tipo: "texto",
      x: x + 24,
      y: sec4Y + 120,
      w: 210,
      h: 24,
      z: z++,
      texto: pl.n.toUpperCase(),
      fontSize: 11,
      fontWeight: 800,
      color: bodyColor,
      align: "left",
      fontFamily: body,
      letterSpacing: 1.5,
    });
    elementos.push({
      id: uid(),
      tipo: "texto",
      x: x + 24,
      y: sec4Y + 156,
      w: 210,
      h: 48,
      z: z++,
      texto: pl.p,
      fontSize: 34,
      fontWeight: heading === "bebas" || heading === "anton" ? 400 : 800,
      color: titleColor,
      align: "left",
      fontFamily: heading,
    });
    elementos.push({
      id: uid(),
      tipo: "texto",
      x: x + 24,
      y: sec4Y + 212,
      w: 210,
      h: 20,
      z: z++,
      texto: pl.s,
      fontSize: 12,
      fontWeight: 400,
      color: bodyColor,
      align: "left",
      fontFamily: body,
    });
    elementos.push({
      id: uid(),
      tipo: "botao",
      x: x + 24,
      y: sec4Y + 328,
      w: 210,
      h: 46,
      z: z++,
      texto: destaque ? "Escolher esse" : "Saiba mais",
      fontSize: 14,
      fontWeight: 700,
      color: destaque ? acc.text : "#ffffff",
      bg: destaque ? acc.primary : "#0f172a",
      btnVariante: destaque ? "gradient" : "solid",
      btnGradientDe: destaque ? g.de : undefined,
      btnGradientPara: destaque ? g.para : undefined,
      btnRadiusPreset: "rounded",
      btnIcon: destaque ? "arrow_right" : "none",
      btnIconPos: "right",
      btnHoverFx: "lift",
      btnAcao: { tipo: "whatsapp", valor: "5598999999999" },
      radius: 10,
      align: "center",
      fontFamily: body,
    });
  });

  // ─── CTA FINAL ─────────────────────────────────
  const sec5Y = sec4Y + 460;
  const CTA_H = 360;
  if (recipe.ctaFinalScene) {
    elementos.push({
      id: uid(),
      tipo: "bg_animado",
      x: 0,
      y: sec5Y,
      w: CANVAS_DESKTOP_W,
      h: CTA_H,
      z: z++,
      bgAnimId: recipe.ctaFinalScene,
      radius: 0,
    });
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x: 0,
      y: sec5Y,
      w: CANVAS_DESKTOP_W,
      h: CTA_H,
      z: z++,
      bg: "linear-gradient(180deg,rgba(15,23,42,0.35),rgba(15,23,42,0.65))",
      radius: 0,
    });
  } else {
    elementos.push({
      id: uid(),
      tipo: "forma_retangulo",
      x: 0,
      y: sec5Y,
      w: CANVAS_DESKTOP_W,
      h: CTA_H,
      z: z++,
      bg: grad,
      radius: 0,
    });
  }
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 120,
    y: sec5Y + 80,
    w: 800,
    h: 56,
    z: z++,
    texto: recipe.ctaFinalTitle,
    fontSize: 36,
    fontWeight: heading === "bebas" || heading === "anton" ? 400 : 800,
    color: "#ffffff",
    align: "center",
    shadow: true,
    fontFamily: heading,
    lineHeight: 1.15,
    textTransform: recipe.headlineUpper ? "uppercase" : "none",
    letterSpacing: recipe.headlineLetter,
  });
  elementos.push({
    id: uid(),
    tipo: "texto",
    x: 200,
    y: sec5Y + 156,
    w: 640,
    h: 44,
    z: z++,
    texto: recipe.ctaFinalSubtitle,
    fontSize: 15,
    fontWeight: 400,
    color: "rgba(255,255,255,0.95)",
    align: "center",
    fontFamily: body,
    lineHeight: 1.55,
  });
  elementos.push({
    id: uid(),
    tipo: "botao",
    x: CANVAS_DESKTOP_W / 2 - 150,
    y: sec5Y + 230,
    w: 300,
    h: 60,
    z: z++,
    texto: recipe.ctaFinalLabel,
    fontSize: 16,
    fontWeight: 800,
    color: acc.text,
    btnVariante: "gradient",
    btnGradientDe: g.de,
    btnGradientPara: g.para,
    btnRadiusPreset: "pill",
    btnIcon: recipe.ctaFinalIcon,
    btnIconPos: "left",
    btnHoverFx: "pulse",
    btnAcao: { tipo: "whatsapp", valor: "5598999999999" },
    align: "center",
    shadow: true,
    fontFamily: body,
    letterSpacing: 0.3,
  });

  return { elementos, bg: recipe.canvasBg, h: sec5Y + CTA_H + 40 };
};

const templatesFeatured: TemplateId[] = [
  "valparaiso_park",
  "passaporte_anual",
  "passaporte_diario",
  "evento_corporativo",
  "festa_aniversario",
  "aventura_radical",
  "promocoes",
];

/* ═══════════════════════════════════════════════════════════════════
   PALETTE ITEMS
   ═══════════════════════════════════════════════════════════════════ */

type PaletteGroup = {
  label: string;
  itens: {
    tipo: LPElementoTipo;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    preset?: Partial<LPElemento>;
  }[];
};

const PALETTE: PaletteGroup[] = [
  {
    label: "Texto",
    itens: [
      {
        tipo: "texto",
        label: "Título",
        icon: TypeIcon,
        preset: { texto: "Título grande", fontSize: 48, fontWeight: 800, w: 600, h: 72 },
      },
      {
        tipo: "texto",
        label: "Subtítulo",
        icon: TypeIcon,
        preset: { texto: "Subtítulo", fontSize: 24, fontWeight: 600, w: 500, h: 40 },
      },
      {
        tipo: "texto",
        label: "Parágrafo",
        icon: TypeIcon,
        preset: { texto: "Texto do parágrafo", fontSize: 15, fontWeight: 400, w: 420, h: 60 },
      },
    ],
  },
  {
    label: "Mídia",
    itens: [
      { tipo: "imagem", label: "Imagem", icon: ImageIcon },
      { tipo: "video", label: "Vídeo", icon: Film },
    ],
  },
  {
    label: "Interação",
    itens: [
      { tipo: "botao", label: "Botão", icon: MousePointer2 },
    ],
  },
  {
    label: "Formas",
    itens: [
      { tipo: "forma_retangulo", label: "Retângulo", icon: Square },
      { tipo: "forma_circulo", label: "Círculo", icon: Circle },
      { tipo: "icone", label: "Ícone", icon: Star },
    ],
  },
  {
    label: "Cenas animadas",
    itens: [
      {
        tipo: "bg_animado",
        label: "Oceano",
        icon: Waves,
        preset: { bgAnimId: "ocean_waves", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Pôr-do-sol",
        icon: Sparkles,
        preset: { bgAnimId: "tropical_sunset", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Bolhas",
        icon: Circle,
        preset: { bgAnimId: "deep_bubbles", w: 420, h: 420, radius: 999 },
      },
      {
        tipo: "bg_animado",
        label: "Aurora",
        icon: Sparkles,
        preset: { bgAnimId: "aurora_aqua", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Palmeiras",
        icon: Waves,
        preset: { bgAnimId: "palm_breeze", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Gotas",
        icon: Waves,
        preset: { bgAnimId: "splash_drops", w: 420, h: 420, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "VIP Gold",
        icon: Sparkles,
        preset: { bgAnimId: "vip_gold", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Noturno",
        icon: Sparkles,
        preset: { bgAnimId: "corp_night", w: 560, h: 320, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Confete",
        icon: Sparkles,
        preset: { bgAnimId: "confetti_party", w: 420, h: 420, radius: 16 },
      },
      {
        tipo: "bg_animado",
        label: "Sol família",
        icon: Sparkles,
        preset: { bgAnimId: "family_sunshine", w: 420, h: 420, radius: 999 },
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */

export function LandingBuilder() {
  const [paginas, setPaginas] = useState<LandingPage[]>(() =>
    landingPagesMock.map((p) => {
      if (!p.elementos) {
        const t = buildTemplate(p.template);
        return { ...p, elementos: t.elementos, canvasBg: t.bg, canvasH: t.h };
      }
      return p;
    })
  );
  const [selId, setSelId] = useState<string | null>(null);
  const [nova, setNova] = useState(false);
  const [statsFor, setStatsFor] = useState<LandingPage | null>(null);
  const [clarityCfgOpen, setClarityCfgOpen] = useState(false);
  const [clarityCfg, setClarityCfg] = useState<ClarityConfig>(() => getClarityConfig());
  const sel = useMemo(() => paginas.find((p) => p.id === selId) ?? null, [paginas, selId]);

  const criarNova = (template: TemplateId, titulo: string, slug: string) => {
    const id = uid();
    const tituloFinal = titulo.trim() || `LP ${templateLabel[template]}`;
    const slugFinal = slug.trim() || slugify(tituloFinal);
    const t = buildTemplate(template);
    const pag: LandingPage = {
      id,
      slug: slugFinal,
      titulo: tituloFinal,
      visitas: 0,
      leads_gerados: 0,
      conversao_pct: 0,
      status: "rascunho",
      blocos: [],
      elementos: t.elementos,
      canvasBg: t.bg,
      canvasH: t.h,
      template,
    };
    setPaginas((prev) => [pag, ...prev]);
    setNova(false);
    setSelId(id);
  };

  const salvarPagina = (p: LandingPage) => {
    setPaginas((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  };

  const publicadas = paginas.filter((p) => p.status === "publicada").length;
  const totalVisitas = paginas.reduce((s, p) => s + p.visitas, 0);
  const totalLeads = paginas.reduce((s, p) => s + p.leads_gerados, 0);

  return (
    <>
      <PageHeader
        title="Landing pages"
        subtitle="Builder visual estilo Canva — arraste, redimensione e personalize tudo"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNova(true)}>
            Nova landing
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard icon={Globe2} tone="brand" label="Páginas publicadas" value={String(publicadas)} />
          <StatCard icon={Eye} tone="aqua" label="Visitas 30d" value={number(totalVisitas)} />
          <StatCard icon={Users} tone="emerald" label="Leads gerados" value={number(totalLeads)} />
          <StatCard
            icon={Star}
            tone="violet"
            label="Conversão média"
            value={totalVisitas > 0 ? pct(totalLeads / totalVisitas) : "—"}
          />
        </div>

        <ClarityBanner
          cfg={clarityCfg}
          onConfigure={() => setClarityCfgOpen(true)}
          onDisconnect={() => {
            disconnectClarity();
            setClarityCfg({ projectId: "", conectado: false });
            invalidateClarityCache();
          }}
        />

        <div className="mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">Modelos padrão</h3>
              <p className="text-[12px] text-slate-500">
                3 templates prontos — totalmente editáveis no canvas
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {templatesFeatured.map((t) => (
              <TemplatePreviewCard key={t} template={t} onUse={() => criarNova(t, "", "")} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-3">
            Minhas landings ({paginas.length})
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {paginas.map((p) => (
              <PaginaCard
                key={p.id}
                pagina={p}
                onOpen={() => setSelId(p.id)}
                onStats={() => setStatsFor(p)}
                clarityConectado={clarityCfg.conectado}
              />
            ))}
          </div>
        </div>
      </PageContent>

      {sel && (
        <CanvasEditor
          pagina={sel}
          onSalvar={salvarPagina}
          onFechar={() => setSelId(null)}
        />
      )}

      {nova && <NovaDialog onClose={() => setNova(false)} onCreate={criarNova} />}

      {clarityCfgOpen && (
        <ClarityConfigDialog
          initial={clarityCfg}
          onClose={() => setClarityCfgOpen(false)}
          onSave={(cfg) => {
            saveClarityConfig(cfg);
            setClarityCfg(cfg);
            invalidateClarityCache();
            setClarityCfgOpen(false);
          }}
        />
      )}

      {statsFor && (
        <ClarityStatsDialog
          pagina={statsFor}
          cfg={clarityCfg}
          onClose={() => setStatsFor(null)}
          onConfigure={() => {
            setStatsFor(null);
            setClarityCfgOpen(true);
          }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STAT / TEMPLATE / PÁGINA CARDS
   ═══════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "aqua" | "emerald" | "violet";
  label: string;
  value: string;
}) {
  const toneCls = {
    brand: "bg-brand-50 text-brand-600",
    aqua: "bg-aqua-50 text-aqua-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];
  return (
    <Card>
      <CardBody className="py-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-[10px] inline-flex items-center justify-center", toneCls)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">{label}</div>
          <div className="text-[20px] font-semibold tabular text-slate-900">{value}</div>
        </div>
      </CardBody>
    </Card>
  );
}

function TemplatePreviewCard({ template, onUse }: { template: TemplateId; onUse: () => void }) {
  return (
    <div className="group relative rounded-[16px] border border-slate-200 bg-white overflow-hidden hover:shadow-pop hover:border-brand-300 transition-all">
      <div
        className="h-44 relative overflow-hidden"
        style={{ background: templateGradient[template] }}
      >
        <div className="absolute -top-4 left-6 h-10 w-10 rounded-full bg-white/20" />
        <div className="absolute top-10 right-10 h-6 w-6 rounded-full bg-white/30" />
        <div className="absolute bottom-6 left-16 h-4 w-4 rounded-full bg-white/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <Waves className="h-6 w-6 text-white/80 mb-2" />
          <div className="text-white text-[16px] font-extrabold leading-tight">
            {templateLabel[template]}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="text-[12px] text-slate-600 min-h-[32px]">{templateDesc[template]}</div>
        <Button size="sm" className="w-full mt-3" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onUse}>
          Usar este modelo
        </Button>
      </div>
    </div>
  );
}

function PaginaCard({
  pagina,
  onOpen,
  onStats,
  clarityConectado,
}: {
  pagina: LandingPage;
  onOpen: () => void;
  onStats: () => void;
  clarityConectado: boolean;
}) {
  return (
    <Card className="hover:shadow-pop transition group/card overflow-hidden">
      <div
        className="h-32 rounded-t-[14px] relative overflow-hidden cursor-pointer"
        style={{ background: templateGradient[pagina.template] }}
        onClick={onOpen}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <LayoutGrid className="h-10 w-10 text-white/40" />
        </div>
        <div className="absolute top-2 right-2">
          <Badge
            tone={
              pagina.status === "publicada"
                ? "emerald"
                : pagina.status === "pausada"
                ? "amber"
                : "slate"
            }
          >
            {pagina.status}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] text-white/90 font-medium uppercase tracking-wider">
          {templateLabel[pagina.template]} · {pagina.elementos?.length ?? 0} elementos
        </div>
      </div>
      <CardBody>
        <div className="cursor-pointer" onClick={onOpen}>
          <div className="font-semibold text-[14px] text-slate-900 line-clamp-1">{pagina.titulo}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">/{pagina.slug}</div>
          <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <div>
              <div className="text-slate-400">Visitas</div>
              <div className="font-semibold tabular">{number(pagina.visitas)}</div>
            </div>
            <div>
              <div className="text-slate-400">Leads</div>
              <div className="font-semibold tabular">{number(pagina.leads_gerados)}</div>
            </div>
            <div>
              <div className="text-slate-400">Conv.</div>
              <div className="font-semibold tabular text-emerald-600">
                {pagina.conversao_pct.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {pagina.ultima_publicacao ? `Publicada há ${relativeTime(pagina.ultima_publicacao)}` : "Rascunho"}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStats();
            }}
            className="flex-1 h-8 rounded-[8px] bg-gradient-to-r from-violet-50 to-fuchsia-50 hover:from-violet-100 hover:to-fuchsia-100 text-violet-700 text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition border border-violet-200/70"
            aria-label="Ver heatmap e estatísticas"
          >
            <Flame className="h-3.5 w-3.5" />
            Heatmap & Stats
            {!clarityConectado && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" title="Clarity não conectado — modo demo" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="h-8 px-2.5 rounded-[8px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
            aria-label="Editar landing"
          >
            <Palette className="h-3.5 w-3.5" />
            Editar
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS EDITOR
   ═══════════════════════════════════════════════════════════════════ */

type DragState =
  | { kind: "move"; id: string; startX: number; startY: number; elX: number; elY: number }
  | {
      kind: "resize";
      id: string;
      handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
      startX: number;
      startY: number;
      elX: number;
      elY: number;
      elW: number;
      elH: number;
    }
  | { kind: "palette"; tipo: LPElementoTipo; preset?: Partial<LPElemento> }
  | null;

function CanvasEditor({
  pagina,
  onSalvar,
  onFechar,
}: {
  pagina: LandingPage;
  onSalvar: (p: LandingPage) => void;
  onFechar: () => void;
}) {
  const [rascunho, setRascunho] = useState<LandingPage>(() =>
    JSON.parse(JSON.stringify(pagina))
  );
  const [selId, setSelId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [salvoTs, setSalvoTs] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [history, setHistory] = useState<LandingPage[]>([]);
  const [future, setFuture] = useState<LandingPage[]>([]);
  const [rightTab, setRightTab] = useState<"props" | "layers">("props");
  const [brandCat, setBrandCat] = useState<BrandAssetCategoria>("logo");
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasW = device === "desktop" ? CANVAS_DESKTOP_W : CANVAS_MOBILE_W;

  const elementos = rascunho.elementos ?? [];

  useEffect(() => {
    const ids = new Set<string>();
    elementos.forEach((el) => {
      if (el.fontFamily) ids.add(el.fontFamily);
    });
    if (ids.size) ensureLandingFontsLoaded(Array.from(ids));
  }, [elementos]);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  };

  const commit = (next: LandingPage) => {
    setHistory((h) => [...h.slice(-29), rascunho]);
    setFuture([]);
    setRascunho(next);
  };

  const updateEl = (id: string, patch: Partial<LPElemento>) => {
    setRascunho((r) => ({
      ...r,
      elementos: (r.elementos ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const commitEl = (id: string, patch: Partial<LPElemento>) => {
    commit({
      ...rascunho,
      elementos: (rascunho.elementos ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const addEl = (tipo: LPElementoTipo, preset: Partial<LPElemento> | undefined, x: number, y: number) => {
    const maxZ = elementos.reduce((m, e) => Math.max(m, e.z), 0);
    const base = elementoDefaults(tipo, x, y, maxZ + 1);
    const novo: LPElemento = { ...base, ...preset, id: uid(), x, y, z: maxZ + 1 };
    // clamp within canvas
    novo.x = Math.max(0, Math.min(canvasW - novo.w, novo.x));
    commit({ ...rascunho, elementos: [...elementos, novo] });
    setSelId(novo.id);
    showToast(`${labelTipo(tipo)} adicionado`);
    return novo;
  };

  const removeEl = (id: string) => {
    commit({ ...rascunho, elementos: elementos.filter((e) => e.id !== id) });
    if (selId === id) setSelId(null);
  };

  const duplicarEl = (id: string) => {
    const el = elementos.find((e) => e.id === id);
    if (!el) return;
    const maxZ = elementos.reduce((m, e) => Math.max(m, e.z), 0);
    const clone: LPElemento = { ...el, id: uid(), x: el.x + 20, y: el.y + 20, z: maxZ + 1 };
    commit({ ...rascunho, elementos: [...elementos, clone] });
    setSelId(clone.id);
  };

  const bringForward = (id: string) => {
    const maxZ = elementos.reduce((m, e) => Math.max(m, e.z), 0);
    updateEl(id, { z: maxZ + 1 });
  };
  const sendBackward = (id: string) => {
    const minZ = elementos.reduce((m, e) => Math.min(m, e.z), 999);
    updateEl(id, { z: minZ - 1 });
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [rascunho, ...f.slice(0, 29)]);
    setRascunho(prev);
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h.slice(-29), rascunho]);
    setRascunho(next);
  };

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selId) setSelId(null);
        else onFechar();
      }
      const target = e.target as HTMLElement;
      const editing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (editing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selId) {
        e.preventDefault();
        removeEl(selId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selId) {
        e.preventDefault();
        duplicarEl(selId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (selId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const el = elementos.find((x) => x.id === selId);
        if (el) updateEl(selId, { x: el.x + dx, y: el.y + dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selId, elementos, rascunho, history, future, onFechar]);

  /* ── Pointer move for drag/resize ── */
  useEffect(() => {
    if (!drag || drag.kind === "palette") return;
    const SNAP = 6;
    const canvasH = rascunho.canvasH ?? DEFAULT_CANVAS_H;

    const computeSnap = (
      draggingId: string,
      box: { x: number; y: number; w: number; h: number },
      disableSnap: boolean
    ) => {
      const others = elementos.filter((e) => e.id !== draggingId);
      const vAnchors: { val: number; kind: "canvas" | "el" }[] = [
        { val: 0, kind: "canvas" },
        { val: canvasW / 2, kind: "canvas" },
        { val: canvasW, kind: "canvas" },
      ];
      const hAnchors: { val: number; kind: "canvas" | "el" }[] = [
        { val: 0, kind: "canvas" },
        { val: canvasH / 2, kind: "canvas" },
        { val: canvasH, kind: "canvas" },
      ];
      for (const o of others) {
        vAnchors.push({ val: o.x, kind: "el" });
        vAnchors.push({ val: o.x + o.w / 2, kind: "el" });
        vAnchors.push({ val: o.x + o.w, kind: "el" });
        hAnchors.push({ val: o.y, kind: "el" });
        hAnchors.push({ val: o.y + o.h / 2, kind: "el" });
        hAnchors.push({ val: o.y + o.h, kind: "el" });
      }
      const sides = [
        { edge: box.x, name: "l" as const },
        { edge: box.x + box.w / 2, name: "c" as const },
        { edge: box.x + box.w, name: "r" as const },
      ];
      const vsides = [
        { edge: box.y, name: "t" as const },
        { edge: box.y + box.h / 2, name: "m" as const },
        { edge: box.y + box.h, name: "b" as const },
      ];

      let bestVX: { shift: number; anchor: number } | null = null;
      let bestHY: { shift: number; anchor: number } | null = null;
      const guideV: number[] = [];
      const guideH: number[] = [];

      if (!disableSnap) {
        for (const s of sides) {
          for (const a of vAnchors) {
            const diff = a.val - s.edge;
            if (Math.abs(diff) <= SNAP) {
              if (!bestVX || Math.abs(diff) < Math.abs(bestVX.shift)) {
                bestVX = { shift: diff, anchor: a.val };
              }
            }
          }
        }
        for (const s of vsides) {
          for (const a of hAnchors) {
            const diff = a.val - s.edge;
            if (Math.abs(diff) <= SNAP) {
              if (!bestHY || Math.abs(diff) < Math.abs(bestHY.shift)) {
                bestHY = { shift: diff, anchor: a.val };
              }
            }
          }
        }
      }

      const finalX = box.x + (bestVX?.shift ?? 0);
      const finalY = box.y + (bestHY?.shift ?? 0);

      // collect ALL guides aligned after snap (within 0.5px) for visual feedback
      const finalSides = [
        finalX,
        finalX + box.w / 2,
        finalX + box.w,
      ];
      const finalVSides = [
        finalY,
        finalY + box.h / 2,
        finalY + box.h,
      ];
      for (const a of vAnchors) {
        for (const s of finalSides) {
          if (Math.abs(a.val - s) < 0.5) {
            guideV.push(a.val);
            break;
          }
        }
      }
      for (const a of hAnchors) {
        for (const s of finalVSides) {
          if (Math.abs(a.val - s) < 0.5) {
            guideH.push(a.val);
            break;
          }
        }
      }

      return { x: finalX, y: finalY, guides: { v: [...new Set(guideV)], h: [...new Set(guideH)] } };
    };

    const onMove = (e: PointerEvent) => {
      const disableSnap = e.shiftKey || e.altKey;
      if (drag.kind === "move") {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const el = elementos.find((x) => x.id === drag.id);
        if (!el) return;
        const raw = { x: drag.elX + dx, y: drag.elY + dy, w: el.w, h: el.h };
        const snapped = computeSnap(drag.id, raw, disableSnap);
        updateEl(drag.id, { x: snapped.x, y: snapped.y });
        setGuides(snapped.guides);
      } else if (drag.kind === "resize") {
        let { elX, elY, elW, elH } = drag;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        let nx = elX, ny = elY, nw = elW, nh = elH;
        if (drag.handle.includes("e")) nw = Math.max(20, elW + dx);
        if (drag.handle.includes("s")) nh = Math.max(20, elH + dy);
        if (drag.handle.includes("w")) {
          nw = Math.max(20, elW - dx);
          nx = elX + (elW - nw);
        }
        if (drag.handle.includes("n")) {
          nh = Math.max(20, elH - dy);
          ny = elY + (elH - nh);
        }
        const snapped = computeSnap(drag.id, { x: nx, y: ny, w: nw, h: nh }, disableSnap);
        // apply snap only to edges being dragged
        let fx = nx, fy = ny, fw = nw, fh = nh;
        const shiftX = snapped.x - nx;
        const shiftY = snapped.y - ny;
        if (drag.handle.includes("e")) fw = nw + shiftX + (snapped.guides.v.length ? 0 : 0); // grow east edge
        if (drag.handle.includes("w")) {
          fx = snapped.x;
          fw = nw - shiftX;
        }
        if (drag.handle.includes("s")) fh = nh + shiftY;
        if (drag.handle.includes("n")) {
          fy = snapped.y;
          fh = nh - shiftY;
        }
        // simpler: just snap position while keeping size adjustments applied
        updateEl(drag.id, {
          x: fx,
          y: fy,
          w: Math.max(20, fw),
          h: Math.max(20, fh),
        });
        setGuides(snapped.guides);
      }
    };
    const onUp = () => {
      setDrag(null);
      setGuides({ v: [], h: [] });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  const dirty = useMemo(
    () => JSON.stringify(rascunho) !== JSON.stringify(pagina),
    [rascunho, pagina]
  );

  const salvar = (publicar: boolean) => {
    const final: LandingPage = {
      ...rascunho,
      status: publicar ? "publicada" : rascunho.status,
      ultima_publicacao: publicar ? new Date().toISOString() : rascunho.ultima_publicacao,
    };
    onSalvar(final);
    setSalvoTs(Date.now());
    showToast(publicar ? "Página publicada" : "Alterações salvas");
  };

  const selecionado = elementos.find((e) => e.id === selId) ?? null;

  /* ── Drop from palette onto canvas ── */
  const onCanvasDrop = (e: React.DragEvent) => {
    if (drag?.kind !== "palette") return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const offW = drag.preset?.w ?? 200;
    const offH = drag.preset?.h ?? 60;
    if (drag.tipo === "imagem") {
      pickImageThen((src) => addEl("imagem", { ...drag.preset, src, x: x - offW / 2, y: y - offH / 2 }, x - offW / 2, y - offH / 2));
    } else if (drag.tipo === "video") {
      pickVideoThen((src) => addEl("video", { ...drag.preset, src, x: x - offW / 2, y: y - offH / 2 }, x - offW / 2, y - offH / 2));
    } else {
      addEl(drag.tipo, drag.preset, x - offW / 2, y - offH / 2);
    }
    setDrag(null);
  };

  const pickImageThen = (cb: (src: string) => void) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      cb(await fileToDataUrl(f));
    };
    inp.click();
  };

  const pickVideoThen = (cb: (src: string) => void) => {
    const url = window.prompt("URL do vídeo (MP4) ou cancele para enviar um arquivo:");
    if (url) return cb(url);
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "video/*";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      cb(await fileToDataUrl(f));
    };
    inp.click();
  };

  const addBrandAsset = (asset: BrandAsset) => {
    // largura padrão por categoria; altura derivada pela aspect ratio
    const targetW =
      asset.categoria === "logo"
        ? 260
        : asset.categoria === "guaras"
        ? 520
        : asset.categoria === "divisor"
        ? 600
        : asset.categoria === "banner"
        ? 600
        : asset.categoria === "mascote"
        ? 220
        : 360;
    const w = targetW;
    const h = Math.max(60, Math.round(w / asset.ratio));
    const centerX = Math.max(0, canvasW / 2 - w / 2);
    const centerY = 80;
    addEl("imagem", { src: asset.src, w, h, fit: "contain", radius: 0 }, centerX, centerY);
  };

  const paletteClick = (tipo: LPElementoTipo, preset?: Partial<LPElemento>) => {
    const centerX = canvasW / 2 - (preset?.w ?? 200) / 2;
    const centerY = 100;
    if (tipo === "imagem") {
      pickImageThen((src) => addEl("imagem", { ...preset, src }, centerX, centerY));
    } else if (tipo === "video") {
      pickVideoThen((src) => addEl("video", { ...preset, src }, centerX, centerY));
    } else {
      addEl(tipo, preset, centerX, centerY);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      {/* TOP BAR */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={onFechar}
          className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          aria-label="Fechar editor"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            value={rascunho.titulo}
            onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
            className="bg-transparent outline-none font-semibold text-slate-900 text-[14px] w-[280px] hover:bg-slate-50 focus:bg-slate-50 rounded px-2 h-8 transition"
            placeholder="Título da página"
          />
          <div className="inline-flex items-center gap-1 text-slate-400 font-mono text-[12px]">
            <span>/</span>
            <input
              value={rascunho.slug}
              onChange={(e) => setRascunho({ ...rascunho, slug: slugify(e.target.value) })}
              className="bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 rounded px-1 h-7 transition w-[200px]"
              placeholder="slug"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-0.5">
          <IconBtn
            onClick={undo}
            disabled={history.length === 0}
            label="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            onClick={redo}
            disabled={future.length === 0}
            label="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>

        <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "h-7 px-2.5 text-[11px] font-semibold rounded-[6px] transition",
              device === "desktop" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Desktop
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "h-7 px-2.5 text-[11px] font-semibold rounded-[6px] transition",
              device === "mobile" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Mobile
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 min-w-[120px] justify-end">
          {dirty ? (
            <span className="text-amber-600 font-medium">Não salvo</span>
          ) : salvoTs ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Salvo</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Save className="h-3.5 w-3.5" />}
          onClick={() => salvar(false)}
          disabled={!dirty}
        >
          Salvar
        </Button>
        <Button size="sm" leftIcon={<Globe2 className="h-3.5 w-3.5" />} onClick={() => salvar(true)}>
          Publicar
        </Button>
      </div>

      {/* BODY */}
      <div className="flex-1 min-h-0 flex">
        {/* PALETA */}
        <aside className="w-[216px] shrink-0 border-r border-slate-200 bg-white flex flex-col min-h-0 overflow-y-auto">
          {PALETTE.map((g) => (
            <div key={g.label} className="px-3 py-3 border-b border-slate-100 last:border-b-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 inline-flex items-center gap-1.5">
                {g.label === "Texto" && <TypeIcon className="h-3 w-3" />}
                {g.label === "Mídia" && <ImageIcon className="h-3 w-3" />}
                {g.label === "Interação" && <MousePointer2 className="h-3 w-3" />}
                {g.label === "Formas" && <Shapes className="h-3 w-3" />}
                {g.label}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {g.itens.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={`${it.tipo}-${it.label}`}
                      draggable
                      onDragStart={(e) => {
                        setDrag({ kind: "palette", tipo: it.tipo, preset: it.preset });
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData("text/plain", it.tipo);
                      }}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => paletteClick(it.tipo, it.preset)}
                      className="group flex flex-col items-center justify-center gap-1 p-2.5 rounded-[10px] border border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/40 hover:-translate-y-0.5 hover:shadow-soft transition cursor-grab active:cursor-grabbing text-center"
                      title={it.label}
                      aria-label={`Adicionar ${it.label}`}
                    >
                      <div className="h-8 w-8 rounded-[8px] bg-slate-50 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 inline-flex items-center justify-center transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10.5px] font-semibold text-slate-700">{it.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="px-3 py-3 border-b border-slate-100">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-500" />
              Marca Valparaíso
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {BRAND_ASSET_CATEGORIAS.map((c) => (
                <button
                  key={c.cat}
                  onClick={() => setBrandCat(c.cat)}
                  className={cn(
                    "px-1.5 h-6 rounded-[6px] text-[10px] font-semibold transition",
                    brandCat === c.cat
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "text-slate-500 hover:bg-slate-100 border border-transparent"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {BRAND_ASSETS.filter((a) => a.categoria === brandCat).map((a) => (
                <button
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    setDrag({
                      kind: "palette",
                      tipo: "imagem",
                      preset: {
                        src: a.src,
                        w: 360,
                        h: Math.max(60, Math.round(360 / a.ratio)),
                        fit: "contain",
                        radius: 0,
                      },
                    });
                    e.dataTransfer.effectAllowed = "copy";
                    e.dataTransfer.setData("text/plain", "imagem");
                  }}
                  onDragEnd={() => setDrag(null)}
                  onClick={() => addBrandAsset(a)}
                  className="group relative aspect-square rounded-[8px] border border-slate-200 bg-white overflow-hidden hover:border-rose-400 hover:shadow-soft transition cursor-grab active:cursor-grabbing"
                  title={a.label}
                  aria-label={`Adicionar ${a.label}`}
                  style={{
                    backgroundColor: a.tint ?? "#f8fafc",
                  }}
                >
                  <img
                    src={a.src}
                    alt={a.label}
                    className="absolute inset-0 w-full h-full object-contain p-1 group-hover:scale-105 transition"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-3 mt-auto border-t border-slate-100 bg-slate-50/40">
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-brand-500" />
              Dica: arraste, ou clique para inserir no centro
            </div>
          </div>
        </aside>

        {/* CANVAS */}
        <main
          className="flex-1 min-w-0 overflow-auto bg-slate-200/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelId(null);
          }}
        >
          <div
            className="min-h-full p-8 pb-24"
            style={{ width: "max-content", minWidth: "100%", marginInline: "auto" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelId(null);
            }}
          >
          <div
            className={cn(
              "relative shadow-pop transition-all bg-white mx-auto",
              device === "mobile" && "ring-[10px] ring-slate-800 rounded-[28px] overflow-hidden"
            )}
            style={{
              width: canvasW,
              minHeight: rascunho.canvasH ?? DEFAULT_CANVAS_H,
              background: rascunho.canvasBgImage
                ? `${rascunho.canvasBgImage}, ${rascunho.canvasBg ?? "#ffffff"}`
                : rascunho.canvasBg ?? "#ffffff",
              backgroundSize: rascunho.canvasBgImage ? "cover" : undefined,
              backgroundPosition: rascunho.canvasBgImage ? "center" : undefined,
              backgroundRepeat: rascunho.canvasBgImage ? "no-repeat" : undefined,
            }}
          >
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelId(null);
              }}
              onDragOver={(e) => {
                if (drag?.kind === "palette") e.preventDefault();
              }}
              onDrop={onCanvasDrop}
              className="relative w-full overflow-hidden"
              style={{ height: rascunho.canvasH ?? DEFAULT_CANVAS_H }}
            >
              {[...elementos]
                .sort((a, b) => a.z - b.z)
                .map((el) => (
                  <ElementoRender
                    key={el.id}
                    el={el}
                    selecionado={selId === el.id}
                    onSelect={() => setSelId(el.id)}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelId(el.id);
                      setDrag({
                        kind: "move",
                        id: el.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        elX: el.x,
                        elY: el.y,
                      });
                    }}
                    onResizeStart={(handle, e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelId(el.id);
                      setDrag({
                        kind: "resize",
                        id: el.id,
                        handle,
                        startX: e.clientX,
                        startY: e.clientY,
                        elX: el.x,
                        elY: el.y,
                        elW: el.w,
                        elH: el.h,
                      });
                    }}
                    onTextChange={(t) => commitEl(el.id, { texto: t })}
                    onDuplicar={() => duplicarEl(el.id)}
                    onRemover={() => removeEl(el.id)}
                  />
                ))}

              {elementos.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-slate-400">
                    <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <div className="text-[14px] font-semibold">Canvas vazio</div>
                    <div className="text-[12px] mt-0.5">Arraste elementos da paleta à esquerda</div>
                  </div>
                </div>
              )}

              {/* Smart guides (render during drag) */}
              {drag && (drag.kind === "move" || drag.kind === "resize") && (
                <>
                  {guides.v.map((x, i) => (
                    <div
                      key={`v-${i}-${x}`}
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{
                        left: x,
                        width: 1,
                        background: "#ec4899",
                        boxShadow: "0 0 0 0.5px rgba(236,72,153,0.4)",
                        zIndex: 9998,
                      }}
                    />
                  ))}
                  {guides.h.map((y, i) => (
                    <div
                      key={`h-${i}-${y}`}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{
                        top: y,
                        height: 1,
                        background: "#ec4899",
                        boxShadow: "0 0 0 0.5px rgba(236,72,153,0.4)",
                        zIndex: 9998,
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* alça de altura do canvas */}
            <CanvasResizer
              h={rascunho.canvasH ?? DEFAULT_CANVAS_H}
              onChange={(h) => setRascunho((r) => ({ ...r, canvasH: Math.max(400, h) }))}
            />
          </div>
          </div>
        </main>

        {/* INSPECTOR */}
        <aside className="w-[300px] shrink-0 border-l border-slate-200 bg-white flex flex-col min-h-0">
          <div className="flex border-b border-slate-200">
            <TabBtn active={rightTab === "props"} onClick={() => setRightTab("props")}>
              <Palette className="h-3.5 w-3.5" /> Propriedades
            </TabBtn>
            <TabBtn active={rightTab === "layers"} onClick={() => setRightTab("layers")}>
              <Layers className="h-3.5 w-3.5" /> Camadas
            </TabBtn>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === "props" ? (
              <Inspector
                el={selecionado}
                onUpdate={(patch) => selecionado && updateEl(selecionado.id, patch)}
                onCommit={(patch) => selecionado && commitEl(selecionado.id, patch)}
                onRemover={() => selecionado && removeEl(selecionado.id)}
                onDuplicar={() => selecionado && duplicarEl(selecionado.id)}
                onTrazerFrente={() => selecionado && bringForward(selecionado.id)}
                onMandarFundo={() => selecionado && sendBackward(selecionado.id)}
                onReplaceSrc={(cb) => {
                  if (!selecionado) return;
                  if (selecionado.tipo === "video") pickVideoThen((src) => cb(src));
                  else pickImageThen((src) => cb(src));
                }}
                onPickImage={pickImageThen}
                pagina={rascunho}
                onUpdatePage={(patch) => setRascunho((r) => ({ ...r, ...patch }))}
              />
            ) : (
              <LayersPanel
                elementos={elementos}
                selId={selId}
                onSelect={setSelId}
                onRemover={removeEl}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
              />
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white text-[13px] font-medium px-4 py-2 rounded-[10px] shadow-pop animate-slide-up"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ELEMENT RENDER (com handles)
   ═══════════════════════════════════════════════════════════════════ */

function ElementoRender({
  el,
  selecionado,
  onSelect,
  onDragStart,
  onResizeStart,
  onTextChange,
  onDuplicar,
  onRemover,
}: {
  el: LPElemento;
  selecionado: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w", e: React.PointerEvent) => void;
  onTextChange: (t: string) => void;
  onDuplicar: () => void;
  onRemover: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const style: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    zIndex: el.z,
    opacity: el.opacity ?? 1,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  };

  const handles: ("nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w")[] = [
    "nw", "n", "ne", "w", "e", "sw", "s", "se",
  ];

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        if (editing) return;
        onSelect();
        onDragStart(e);
      }}
      onDoubleClick={() => {
        if (el.tipo === "texto" || el.tipo === "botao") setEditing(true);
      }}
      className={cn(
        "group/el outline-none",
        !editing && "cursor-move",
        selecionado && !editing && "ring-2 ring-brand-500 ring-offset-2 ring-offset-transparent"
      )}
    >
      <InnerElement el={el} editing={editing} textRef={textRef} onTextChange={(t) => { onTextChange(t); setEditing(false); }} />

      {selecionado && !editing && (
        <>
          {handles.map((h) => (
            <ResizeHandle key={h} handle={h} onStart={(e) => onResizeStart(h, e)} />
          ))}
          {/* Quick actions */}
          <div
            className="absolute -top-8 left-0 flex items-center gap-0.5 rounded-[8px] bg-slate-900/90 backdrop-blur text-white px-1 py-0.5 shadow-pop pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider opacity-80">
              {labelTipo(el.tipo)}
            </span>
            <div className="w-px h-4 bg-white/20 mx-0.5" />
            <QuickAct label="Duplicar" onClick={onDuplicar}>
              <Copy className="h-3 w-3" />
            </QuickAct>
            <QuickAct label="Remover" tone="rose" onClick={onRemover}>
              <Trash2 className="h-3 w-3" />
            </QuickAct>
          </div>
        </>
      )}
    </div>
  );
}

function QuickAct({
  children,
  onClick,
  label,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone?: "rose";
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "h-6 w-6 rounded-[6px] inline-flex items-center justify-center transition",
        tone === "rose"
          ? "text-rose-200 hover:bg-rose-500 hover:text-white"
          : "text-white/80 hover:bg-white/15 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function ResizeHandle({
  handle,
  onStart,
}: {
  handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
  onStart: (e: React.PointerEvent) => void;
}) {
  const cursor =
    handle === "nw" || handle === "se"
      ? "nwse-resize"
      : handle === "ne" || handle === "sw"
      ? "nesw-resize"
      : handle === "n" || handle === "s"
      ? "ns-resize"
      : "ew-resize";
  const pos: React.CSSProperties = { position: "absolute", cursor };
  if (handle.includes("n")) pos.top = -5;
  if (handle.includes("s")) pos.bottom = -5;
  if (handle.includes("w")) pos.left = -5;
  if (handle.includes("e")) pos.right = -5;
  if (handle === "n" || handle === "s") {
    pos.left = "50%";
    pos.transform = "translateX(-50%)";
  }
  if (handle === "e" || handle === "w") {
    pos.top = "50%";
    pos.transform = "translateY(-50%)";
  }
  return (
    <div
      onPointerDown={onStart}
      style={pos}
      className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-brand-500 shadow-soft hover:scale-125 transition"
    />
  );
}

function InnerElement({
  el,
  editing,
  textRef,
  onTextChange,
}: {
  el: LPElemento;
  editing: boolean;
  textRef: React.RefObject<HTMLDivElement>;
  onTextChange: (t: string) => void;
}) {
  const box: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: el.radius ?? 0,
    boxShadow: el.shadow ? "0 10px 30px rgba(15,23,42,0.15)" : undefined,
    border: el.borderWidth
      ? `${el.borderWidth}px solid ${el.borderColor ?? "#e2e8f0"}`
      : undefined,
  };

  if (el.tipo === "texto") {
    return (
      <div
        ref={textRef}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={(e) => onTextChange((e.currentTarget.textContent ?? "").trim())}
        onKeyDown={(e) => {
          if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
        }}
        style={{
          ...box,
          fontSize: el.fontSize ?? 16,
          fontWeight: el.fontWeight ?? 400,
          color: el.color ?? "#0f172a",
          textAlign: el.align ?? "left",
          fontStyle: el.italic ? "italic" : undefined,
          textDecoration: el.underline ? "underline" : undefined,
          lineHeight: el.lineHeight ?? 1.2,
          letterSpacing: el.letterSpacing != null ? `${el.letterSpacing}px` : undefined,
          textTransform: el.textTransform ?? "none",
          fontFamily: getFontStack(el.fontFamily),
          outline: editing ? "2px solid rgba(11,107,203,0.5)" : "none",
          padding: 4,
          cursor: editing ? "text" : "inherit",
          userSelect: editing ? "text" : "none",
        }}
      >
        {el.texto ?? ""}
      </div>
    );
  }
  if (el.tipo === "imagem") {
    return el.src ? (
      <img
        src={el.src}
        alt=""
        draggable={false}
        style={{
          ...box,
          objectFit: el.fit ?? "cover",
          display: "block",
        }}
      />
    ) : (
      <div
        style={{ ...box, background: "#f1f5f9" }}
        className="flex flex-col items-center justify-center text-slate-400"
      >
        <ImageIcon className="h-6 w-6" />
        <span className="text-[10px] mt-1">Clique para enviar</span>
      </div>
    );
  }
  if (el.tipo === "video") {
    return el.src ? (
      <video
        src={el.src}
        controls
        style={{ ...box, objectFit: el.fit ?? "cover", display: "block" }}
      />
    ) : (
      <div
        style={{ ...box, background: "#0f172a" }}
        className="flex flex-col items-center justify-center text-white/70"
      >
        <Film className="h-6 w-6" />
        <span className="text-[10px] mt-1">Clique para carregar</span>
      </div>
    );
  }
  if (el.tipo === "botao") {
    const variante = el.btnVariante ?? "solid";
    const radiusPreset = el.btnRadiusPreset;
    const radius =
      radiusPreset === "sharp"
        ? 0
        : radiusPreset === "pill"
        ? 999
        : radiusPreset === "rounded"
        ? 12
        : el.radius ?? 10;
    const hoverFx = el.btnHoverFx ?? "lift";
    const baseColor = el.bg ?? "#0B6BCB";
    const txtColor = el.color ?? "#ffffff";
    const gradFrom = el.btnGradientDe ?? baseColor;
    const gradTo = el.btnGradientPara ?? "#7c3aed";

    let bg: string = baseColor;
    let border = "none";
    let backdrop: string | undefined;
    let colorFinal = txtColor;

    if (variante === "solid") {
      bg = baseColor;
    } else if (variante === "outline") {
      bg = "transparent";
      border = `2px solid ${baseColor}`;
      colorFinal = baseColor;
    } else if (variante === "ghost") {
      bg = "transparent";
      colorFinal = baseColor;
    } else if (variante === "gradient") {
      bg = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`;
    } else if (variante === "glass") {
      bg = "rgba(255,255,255,0.18)";
      backdrop = "saturate(140%) blur(14px)";
      border = "1px solid rgba(255,255,255,0.35)";
    }

    const hoverClass =
      hoverFx === "lift"
        ? "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        : hoverFx === "glow"
        ? "transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(11,107,203,0.55)]"
        : hoverFx === "pulse"
        ? "lp-pulse-ring"
        : "";

    const IconCmp = el.btnIcon && el.btnIcon !== "none" ? iconComponentFor(el.btnIcon as BtnIconKey) : null;
    const iconPos = el.btnIconPos ?? "right";
    const href = !editing ? resolveAcaoHref(el.btnAcao) : undefined;

    const content = (
      <>
        {IconCmp && iconPos === "left" && <IconCmp className="h-4 w-4 shrink-0" />}
        <span
          ref={textRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => onTextChange((e.currentTarget.textContent ?? "").trim())}
          style={{
            outline: editing ? "2px solid rgba(11,107,203,0.5)" : "none",
            cursor: editing ? "text" : "inherit",
            userSelect: editing ? "text" : "none",
            minWidth: 4,
          }}
        >
          {el.texto ?? "Botão"}
        </span>
        {IconCmp && iconPos === "right" && <IconCmp className="h-4 w-4 shrink-0" />}
      </>
    );

    const commonStyle: React.CSSProperties = {
      ...box,
      background: bg,
      color: colorFinal,
      border,
      backdropFilter: backdrop,
      WebkitBackdropFilter: backdrop,
      fontSize: el.fontSize ?? 14,
      fontWeight: el.fontWeight ?? 700,
      textAlign: el.align ?? "center",
      fontFamily: getFontStack(el.fontFamily),
      letterSpacing: el.letterSpacing != null ? `${el.letterSpacing}px` : undefined,
      textTransform: el.textTransform ?? "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent:
        el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
      gap: 8,
      padding: "0 18px",
      borderRadius: radius,
      textDecoration: "none",
      whiteSpace: "nowrap",
    };

    if (href && !editing) {
      return (
        <a
          href={href}
          target={el.btnAcao?.tipo === "link" || el.btnAcao?.tipo === "whatsapp" ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={(e) => {
            // Evita navegar quando clicando para selecionar/editar no builder
            e.preventDefault();
          }}
          className={hoverClass}
          style={commonStyle}
        >
          {content}
        </a>
      );
    }

    return (
      <div className={hoverClass} style={commonStyle}>
        {content}
      </div>
    );
  }
  if (el.tipo === "forma_retangulo" || el.tipo === "forma_circulo") {
    return (
      <div
        style={{
          ...box,
          background: el.bg ?? "#0B6BCB",
          borderRadius: el.tipo === "forma_circulo" ? 9999 : el.radius ?? 0,
        }}
      />
    );
  }
  if (el.tipo === "icone") {
    return (
      <div
        style={{ ...box, color: el.color ?? "#0B6BCB" }}
        className="flex items-center justify-center"
      >
        <Star style={{ width: "70%", height: "70%" }} fill="currentColor" />
      </div>
    );
  }
  if (el.tipo === "bg_animado") {
    return (
      <div
        style={{
          ...box,
          position: "relative",
          overflow: "hidden",
          borderRadius: el.radius ?? 12,
          opacity: el.opacity ?? 1,
        }}
      >
        {el.bgAnimId ? (
          <AnimatedBgLayer animationId={el.bgAnimId} />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <Sparkles className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-semibold">Clique para escolher cena</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS RESIZER (alça inferior para aumentar altura)
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND LAYER
   ═══════════════════════════════════════════════════════════════════ */

/* Reusable SVG defs — realistic bubble with rim-light + specular highlight */
function BubbleSvg({ size }: { size: number }) {
  const id = `lp-bubble-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}-fill`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="35%" stopColor="rgba(186,230,253,0.55)" />
          <stop offset="75%" stopColor="rgba(56,189,248,0.25)" />
          <stop offset="100%" stopColor="rgba(14,116,144,0.05)" />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="rgba(255,255,255,0)" />
          <stop offset="95%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${id}-fill)`} />
      <circle cx="20" cy="20" r="19" fill={`url(#${id}-rim)`} />
      <ellipse cx="13" cy="12" rx="5" ry="3.2" fill="rgba(255,255,255,0.85)" />
      <circle cx="27" cy="27" r="1.6" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

/* Teardrop SVG — tapered head, rounded belly */
function RaindropSvg() {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="lp-drop-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="55%" stopColor="rgba(186,230,253,0.75)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.65)" />
        </linearGradient>
      </defs>
      <path d="M5,0 C5,5 9.5,9 9.5,13 A4.5,4.5 0 0 1 0.5,13 C0.5,9 5,5 5,0 Z" fill="url(#lp-drop-fill)" />
      <ellipse cx="3.3" cy="11" rx="1" ry="2" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

/* Palm SVG — curved trunk + layered fronds */
function PalmSvg({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 400 360" style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={`palm-trunk-${flip ? "b" : "a"}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>
        <linearGradient id={`palm-frond-${flip ? "b" : "a"}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#052e16" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      {/* Tronco curvo */}
      <path
        d="M200,360 C200,290 188,230 182,180 C178,145 184,120 195,100"
        stroke={`url(#palm-trunk-${flip ? "b" : "a"})`}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      {/* Fronds (8 folhas em leque) */}
      {[-90, -55, -30, -8, 15, 38, 62, 95].map((deg, i) => (
        <g key={i} transform={`translate(195,95) rotate(${deg})`}>
          <path
            d="M0,0 Q40,-18 95,-8 Q110,-4 118,8 Q72,4 0,2 Z"
            fill={`url(#palm-frond-${flip ? "b" : "a"})`}
            opacity={0.92}
          />
          <path
            d="M0,0 Q40,-18 95,-8"
            stroke="rgba(6,78,59,0.85)"
            strokeWidth="1.2"
            fill="none"
          />
        </g>
      ))}
      {/* Cocos */}
      <circle cx="188" cy="100" r="5" fill="#451a03" />
      <circle cx="200" cy="98" r="4.5" fill="#451a03" />
      <circle cx="208" cy="103" r="5" fill="#78350f" />
    </svg>
  );
}

function AnimatedBgLayer({ animationId }: { animationId?: string }) {
  const anim = getBgAnimation(animationId);
  if (!anim) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ background: anim.bg, zIndex: 0 }}
      aria-hidden
    >
      {anim.id === "ocean_waves" && <OceanWavesScene />}
      {anim.id === "tropical_sunset" && <TropicalSunsetScene />}
      {anim.id === "deep_bubbles" && <DeepBubblesScene />}
      {anim.id === "aurora_aqua" && <AuroraAquaScene />}
      {anim.id === "palm_breeze" && <PalmBreezeScene />}
      {anim.id === "splash_drops" && <SplashDropsScene />}
      {anim.id === "vip_gold" && <VipGoldScene />}
      {anim.id === "corp_night" && <CorpNightScene />}
      {anim.id === "confetti_party" && <ConfettiPartyScene />}
      {anim.id === "family_sunshine" && <FamilySunshineScene />}
    </div>
  );
}

/* ─── Ocean waves: camadas de ondas com espuma + caustica + shafts de luz ─── */
function OceanWavesScene() {
  return (
    <>
      {/* Shaft de luz descendo da superfície */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 28% 0%, rgba(255,255,255,0.45), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 30% at 72% 5%, rgba(186,230,253,0.35), transparent 60%)",
        }}
      />
      {/* Cáustica de luz — padrão ondulado se movendo */}
      <div
        className="absolute inset-0 lp-bg-caustic opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 12%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.4) 0%, transparent 10%)",
          backgroundSize: "220px 220px, 280px 280px",
        }}
      />
      {/* Onda 1 — profunda, lenta */}
      <svg
        viewBox="0 0 2400 220"
        preserveAspectRatio="none"
        className="absolute left-0 bottom-[48%] w-[200%] h-40 lp-bg-wave"
        style={{ animationDuration: "26s" }}
      >
        <path
          d="M0,120 C200,80 400,160 600,120 C800,80 1000,160 1200,120 C1400,80 1600,160 1800,120 C2000,80 2200,160 2400,120 L2400,220 L0,220 Z"
          fill="rgba(14,165,233,0.35)"
        />
      </svg>
      {/* Onda 2 — média */}
      <svg
        viewBox="0 0 2400 220"
        preserveAspectRatio="none"
        className="absolute left-0 bottom-[28%] w-[200%] h-36 lp-bg-wave"
        style={{ animationDuration: "18s", animationDirection: "reverse" }}
      >
        <path
          d="M0,120 C250,70 500,170 750,120 C1000,70 1250,170 1500,120 C1750,70 2000,170 2250,120 L2400,140 L2400,220 L0,220 Z"
          fill="rgba(56,189,248,0.55)"
        />
      </svg>
      {/* Onda 3 — superfície com espuma */}
      <svg
        viewBox="0 0 2400 240"
        preserveAspectRatio="none"
        className="absolute left-0 bottom-[10%] w-[200%] h-36 lp-bg-wave"
        style={{ animationDuration: "13s" }}
      >
        <defs>
          <linearGradient id="wave3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(186,230,253,0.9)" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 C200,60 400,140 600,100 C800,60 1000,140 1200,100 C1400,60 1600,140 1800,100 C2000,60 2200,140 2400,100 L2400,240 L0,240 Z"
          fill="url(#wave3-grad)"
        />
        {/* Foam crest highlight */}
        <path
          className="lp-bg-foam"
          d="M0,100 C200,60 400,140 600,100 C800,60 1000,140 1200,100 C1400,60 1600,140 1800,100 C2000,60 2200,140 2400,100"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
      {/* Onda 4 — primeiro plano, mais branca */}
      <svg
        viewBox="0 0 2400 220"
        preserveAspectRatio="none"
        className="absolute left-0 bottom-0 w-[200%] h-28 lp-bg-wave"
        style={{ animationDuration: "9s", animationDirection: "reverse" }}
      >
        <path
          d="M0,120 C300,90 600,150 900,120 C1200,90 1500,150 1800,120 C2100,90 2400,150 2400,120 L2400,220 L0,220 Z"
          fill="rgba(255,255,255,0.95)"
        />
      </svg>
    </>
  );
}

/* ─── Tropical sunset: sol pulsante + nuvens rosadas + palmeiras ─── */
function TropicalSunsetScene() {
  return (
    <>
      {/* Horizonte com brilho */}
      <div
        className="absolute left-0 right-0 bottom-[22%] h-1 opacity-60"
        style={{ background: "linear-gradient(90deg,transparent,rgba(253,224,71,0.9),transparent)" }}
      />
      {/* Sol — bola com corona pulsante */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[15%] h-40 w-40 lp-bg-sun-pulse">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fef9c3 0%, #fde047 30%, #f59e0b 55%, transparent 75%)",
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(253,224,71,0.9) 0%, transparent 60%)",
            filter: "blur(22px)",
            transform: "scale(2)",
          }}
        />
      </div>
      {/* Aurora de nuvens quentes */}
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{ background: "radial-gradient(ellipse at 20% 65%,rgba(251,113,133,0.55),transparent 55%)" }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 80% 30%,rgba(192,132,252,0.45),transparent 55%)",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 50% 20%,rgba(249,115,22,0.4),transparent 55%)",
          animationDelay: "8s",
        }}
      />
      {/* Palmeiras silhueta */}
      <div className="absolute left-0 bottom-0 h-3/5 w-[30%] lp-bg-sway" style={{ animationDuration: "5.5s" }}>
        <PalmSvg />
      </div>
      <div
        className="absolute right-0 bottom-0 h-2/3 w-[32%] lp-bg-sway"
        style={{ animationDuration: "6.5s", animationDelay: "1.2s" }}
      >
        <PalmSvg flip />
      </div>
    </>
  );
}

/* ─── Deep bubbles: bolhas realistas em várias profundidades ─── */
function DeepBubblesScene() {
  const bubbles = Array.from({ length: 22 }, (_, i) => {
    const left = (i * 4.55 + (i % 3) * 3) % 98;
    const size = 10 + ((i * 7) % 32);
    const delay = (i * 0.9) % 14;
    const dur = 9 + ((i * 3) % 9);
    const opacity = 0.55 + ((i % 4) * 0.12);
    return { i, left, size, delay, dur, opacity };
  });

  return (
    <>
      {/* Shaft de luz da superfície */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 0%, rgba(125,211,252,0.45), transparent 60%)",
        }}
      />
      {/* Cáustica sutil */}
      <div
        className="absolute inset-0 lp-bg-caustic opacity-25 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(186,230,253,0.6) 0%, transparent 10%), radial-gradient(circle at 75% 55%, rgba(125,211,252,0.5) 0%, transparent 8%)",
          backgroundSize: "260px 260px, 320px 320px",
        }}
      />
      {bubbles.map((b) => (
        <div
          key={b.i}
          className="absolute bottom-0 lp-bg-bubble"
          style={{
            left: `${b.left}%`,
            opacity: b.opacity,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        >
          <BubbleSvg size={b.size} />
        </div>
      ))}
      {/* Vinheta escura no fundo */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(8,47,73,0.7), transparent 65%)" }}
      />
    </>
  );
}

/* ─── Aurora aqua: blobs etéreos + shimmer diagonal ─── */
function AuroraAquaScene() {
  return (
    <>
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{ background: "radial-gradient(ellipse at 18% 35%,rgba(94,234,212,0.75),transparent 55%)" }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 82% 55%,rgba(59,130,246,0.65),transparent 55%)",
          animationDelay: "3.5s",
        }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 50% 85%,rgba(34,211,238,0.55),transparent 55%)",
          animationDelay: "7s",
        }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 30% 90%,rgba(167,243,208,0.4),transparent 55%)",
          animationDelay: "10s",
        }}
      />
      {/* Shimmer diagonal pan */}
      <div
        className="absolute inset-0 lp-bg-anim-pan"
        style={{
          backgroundImage:
            "linear-gradient(125deg,rgba(255,255,255,0.18) 0%,transparent 35%,rgba(255,255,255,0.12) 65%,transparent 100%)",
        }}
      />
      {/* Cáustica */}
      <div
        className="absolute inset-0 lp-bg-caustic opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 40%, rgba(255,255,255,0.55) 0%, transparent 10%), radial-gradient(circle at 68% 70%, rgba(255,255,255,0.45) 0%, transparent 12%)",
          backgroundSize: "300px 300px, 360px 360px",
        }}
      />
    </>
  );
}

/* ─── Palm breeze: sol quente + palmeiras + nuvens ─── */
function PalmBreezeScene() {
  return (
    <>
      {/* Nuvens passando */}
      <div
        className="absolute top-[12%] left-[5%] h-6 w-28 rounded-full bg-white/85 blur-[3px] lp-float-slow"
        style={{ animationDuration: "9s" }}
      />
      <div
        className="absolute top-[20%] left-[42%] h-5 w-20 rounded-full bg-white/70 blur-[2px] lp-float-slow"
        style={{ animationDuration: "11s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-[8%] right-[28%] h-4 w-24 rounded-full bg-white/75 blur-[2px] lp-float-slow"
        style={{ animationDuration: "13s", animationDelay: "4s" }}
      />
      {/* Sol quente top-right */}
      <div className="absolute top-[8%] right-[10%] h-28 w-28 lp-bg-sun-pulse">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle,#fef9c3,#fde047 55%,transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(253,224,71,0.7) 0%, transparent 65%)",
            filter: "blur(18px)",
            transform: "scale(2.2)",
          }}
        />
      </div>
      {/* Reflexo de sol no chão */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(253,224,71,0.25))" }}
      />
      {/* Palmeiras */}
      <div className="absolute left-[-3%] bottom-[-8%] h-[72%] w-[34%] lp-bg-sway" style={{ animationDuration: "5.2s" }}>
        <PalmSvg />
      </div>
      <div
        className="absolute right-[-5%] bottom-[-8%] h-[80%] w-[38%] lp-bg-sway"
        style={{ animationDuration: "6.3s", animationDelay: "1.5s" }}
      >
        <PalmSvg flip />
      </div>
    </>
  );
}

/* ─── Splash drops: teardrops realistas + anéis de splash ao tocar ─── */
function SplashDropsScene() {
  const drops = Array.from({ length: 20 }, (_, i) => {
    const left = (i * 5.13 + (i % 4) * 2) % 98;
    const delay = (i * 0.42) % 5;
    const dur = 2.4 + ((i * 3) % 6) * 0.35;
    return { i, left, delay, dur };
  });
  const splashes = Array.from({ length: 8 }, (_, i) => {
    const left = (i * 12.7 + 4) % 92;
    const delay = (i * 0.6) % 4;
    const dur = 2.8 + (i % 3) * 0.4;
    return { i, left, delay, dur };
  });

  return (
    <>
      {/* Shimmer atmosférico */}
      <div
        className="absolute inset-0 lp-bg-anim-pan opacity-50"
        style={{
          backgroundImage: "linear-gradient(135deg,rgba(255,255,255,0.15),transparent 55%)",
        }}
      />
      {/* Poça / reflexo no fundo */}
      <div
        className="absolute inset-x-0 bottom-0 h-10"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.4))",
        }}
      />
      {/* Gotas caindo */}
      {drops.map((d) => (
        <div
          key={d.i}
          className="absolute top-0 lp-bg-drop"
          style={{
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        >
          <RaindropSvg />
        </div>
      ))}
      {/* Anéis de splash no chão */}
      {splashes.map((s) => (
        <div
          key={`s-${s.i}`}
          className="absolute bottom-2 lp-bg-splash rounded-full border-2"
          style={{
            left: `${s.left}%`,
            width: 40,
            height: 10,
            borderColor: "rgba(255,255,255,0.85)",
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 0,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </>
  );
}

/* ─── VIP gold: partículas douradas com twinkle + subida ─── */
function VipGoldScene() {
  const twinkles = Array.from({ length: 28 }, (_, i) => {
    const left = (i * 3.57 + (i % 5) * 2) % 98;
    const top = (i * 7.13 + (i % 3) * 4) % 92;
    const delay = (i * 0.3) % 6;
    const dur = 2.2 + (i % 4) * 0.6;
    const size = 3 + (i % 5);
    return { i, left, top, delay, dur, size };
  });
  const rising = Array.from({ length: 16 }, (_, i) => {
    const left = (i * 6.2 + 4) % 96;
    const delay = (i * 0.55) % 10;
    const dur = 7 + (i % 5);
    const size = 3 + (i % 4);
    return { i, left, delay, dur, size };
  });

  return (
    <>
      {/* Glow quente no chão */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 115%, rgba(251,191,36,0.4), transparent 55%)" }}
      />
      {/* Shimmer diagonal sutil */}
      <div
        className="absolute inset-0 lp-bg-anim-pan opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(120deg,rgba(251,191,36,0.18) 0%,transparent 30%,rgba(251,191,36,0.12) 65%,transparent 100%)",
        }}
      />
      {/* Twinkles parados */}
      {twinkles.map((t) => (
        <div
          key={`t-${t.i}`}
          className="absolute rounded-full lp-bg-twinkle"
          style={{
            left: `${t.left}%`,
            top: `${t.top}%`,
            width: t.size,
            height: t.size,
            background: "radial-gradient(circle,#fef3c7 0%,#fbbf24 50%,#f59e0b 100%)",
            boxShadow: "0 0 8px rgba(251,191,36,0.9), 0 0 16px rgba(251,191,36,0.5)",
            animationDelay: `${t.delay}s`,
            animationDuration: `${t.dur}s`,
          }}
        />
      ))}
      {/* Partículas subindo */}
      {rising.map((r) => (
        <div
          key={`r-${r.i}`}
          className="absolute bottom-0 rounded-full lp-bg-gold"
          style={{
            left: `${r.left}%`,
            width: r.size,
            height: r.size,
            background: "radial-gradient(circle,#fef3c7,#f59e0b)",
            boxShadow: "0 0 10px rgba(251,191,36,0.9)",
            animationDelay: `${r.delay}s`,
            animationDuration: `${r.dur}s`,
          }}
        />
      ))}
    </>
  );
}

/* ─── Corp night: grid tech + scan lines + aurora fria ─── */
function CorpNightScene() {
  const stars = Array.from({ length: 30 }, (_, i) => {
    const left = (i * 3.31 + (i % 4) * 2) % 98;
    const top = (i * 5.77 + (i % 3) * 3) % 70;
    const delay = (i * 0.2) % 5;
    const dur = 2.5 + (i % 4) * 0.5;
    return { i, left, top, delay, dur };
  });
  return (
    <>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.1) 1px,transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      {/* Estrelas twinkling */}
      {stars.map((s) => (
        <div
          key={s.i}
          className="absolute rounded-full lp-bg-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: 2,
            height: 2,
            background: "#e0f2fe",
            boxShadow: "0 0 6px rgba(186,230,253,0.9)",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
      <div
        className="absolute top-[22%] left-0 right-0 h-[2px] lp-bg-line-scan"
        style={{ background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.95),transparent)" }}
      />
      <div
        className="absolute top-[52%] left-0 right-0 h-[2px] lp-bg-line-scan"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(45,212,191,0.85),transparent)",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute bottom-[20%] left-0 right-0 h-[2px] lp-bg-line-scan"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(147,197,253,0.75),transparent)",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{ background: "radial-gradient(ellipse at 72% 28%,rgba(59,130,246,0.4),transparent 55%)" }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 25% 75%,rgba(19,78,74,0.5),transparent 55%)",
          animationDelay: "5s",
        }}
      />
    </>
  );
}

/* ─── Confetti party: físicas, mistura de formas e rotações ─── */
function ConfettiPartyScene() {
  const colors = ["#f43f5e", "#fbbf24", "#22c55e", "#0ea5e9", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];
  const confetti = Array.from({ length: 40 }, (_, i) => {
    const left = (i * 2.51 + (i % 3) * 3) % 98;
    const delay = (i * 0.22) % 7;
    const dur = 4 + (i % 5) * 0.8;
    const color = colors[i % colors.length];
    const shape = i % 3; // 0 = retângulo, 1 = círculo, 2 = faixa
    const rot = (i * 37) % 360;
    return { i, left, delay, dur, color, shape, rot };
  });

  return (
    <>
      {/* Party glow de fundo */}
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{ background: "radial-gradient(ellipse at 30% 20%,rgba(251,113,133,0.4),transparent 55%)" }}
      />
      <div
        className="absolute inset-0 lp-bg-aurora"
        style={{
          background: "radial-gradient(ellipse at 70% 15%,rgba(168,85,247,0.4),transparent 55%)",
          animationDelay: "3s",
        }}
      />
      {confetti.map((c) => {
        const style: React.CSSProperties = {
          left: `${c.left}%`,
          background: c.color,
          animationDelay: `${c.delay}s`,
          animationDuration: `${c.dur}s`,
          transform: `rotate(${c.rot}deg)`,
        };
        if (c.shape === 0) {
          style.width = 8;
          style.height = 14;
          style.borderRadius = 2;
        } else if (c.shape === 1) {
          style.width = 9;
          style.height = 9;
          style.borderRadius = 999;
        } else {
          style.width = 14;
          style.height = 4;
          style.borderRadius = 2;
        }
        return <div key={c.i} className="absolute top-0 lp-bg-confetti" style={style} />;
      })}
    </>
  );
}

/* ─── Family sunshine: sol radiante com corona pulsante + nuvens ─── */
function FamilySunshineScene() {
  return (
    <>
      {/* Corona externa pulsante */}
      <div
        className="absolute top-[2%] left-1/2 -translate-x-1/2 h-64 w-64 lp-bg-sun-pulse rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(253,224,71,0.5) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />
      {/* Raios girando */}
      <div className="absolute top-[4%] left-1/2 -translate-x-1/2 h-52 w-52">
        <svg viewBox="0 0 200 200" className="lp-bg-sun-rays w-full h-full" aria-hidden>
          <defs>
            <linearGradient id="ray-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            const x1 = 100 + Math.cos(angle) * 52;
            const y1 = 100 + Math.sin(angle) * 52;
            const x2 = 100 + Math.cos(angle) * (i % 2 === 0 ? 98 : 82);
            const y2 = 100 + Math.sin(angle) * (i % 2 === 0 ? 98 : 82);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#ray-grad)"
                strokeWidth={i % 2 === 0 ? 5 : 3}
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          })}
        </svg>
        {/* Disco do sol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-24 w-24 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #fef9c3 0%, #fde047 40%, #f59e0b 95%)",
              boxShadow: "0 0 40px 12px rgba(250,204,21,0.7), 0 0 80px 24px rgba(251,191,36,0.4)",
            }}
          />
        </div>
      </div>
      {/* Nuvens fofas */}
      <div
        className="absolute top-[28%] left-[8%] h-8 w-28 rounded-full bg-white/95 lp-float-slow"
        style={{ animationDuration: "9s", boxShadow: "0 4px 12px rgba(59,130,246,0.15)" }}
      />
      <div
        className="absolute top-[44%] right-[12%] h-7 w-32 rounded-full bg-white/95 lp-float-slow"
        style={{ animationDuration: "11s", animationDelay: "2s", boxShadow: "0 4px 12px rgba(59,130,246,0.15)" }}
      />
      <div
        className="absolute top-[62%] left-[22%] h-6 w-24 rounded-full bg-white/90 lp-float-slow"
        style={{ animationDuration: "13s", animationDelay: "4s", boxShadow: "0 4px 12px rgba(59,130,246,0.15)" }}
      />
      {/* Arco-íris sutil no chão */}
      <div
        className="absolute bottom-0 inset-x-0 h-24"
        style={{
          background:
            "linear-gradient(to top, rgba(239,68,68,0.08), rgba(251,191,36,0.08) 20%, rgba(34,197,94,0.08) 40%, rgba(59,130,246,0.08) 60%, transparent)",
        }}
      />
    </>
  );
}

function CanvasResizer({ h, onChange }: { h: number; onChange: (h: number) => void }) {
  const [drag, setDrag] = useState<{ startY: number; startH: number } | null>(null);
  useEffect(() => {
    if (!drag) return;
    const mv = (e: PointerEvent) => onChange(drag.startH + (e.clientY - drag.startY));
    const up = () => setDrag(null);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, onChange]);
  return (
    <div
      onPointerDown={(e) => setDrag({ startY: e.clientY, startH: h })}
      className="absolute left-1/2 -translate-x-1/2 -bottom-4 h-2 w-24 rounded-full bg-slate-300 hover:bg-brand-400 cursor-ns-resize transition"
      aria-label="Redimensionar altura do canvas"
      title="Arraste para ajustar altura"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INSPECTOR (propriedades)
   ═══════════════════════════════════════════════════════════════════ */

function Inspector({
  el,
  onUpdate,
  onCommit,
  onRemover,
  onDuplicar,
  onTrazerFrente,
  onMandarFundo,
  onReplaceSrc,
  onPickImage,
  pagina,
  onUpdatePage,
}: {
  el: LPElemento | null;
  onUpdate: (patch: Partial<LPElemento>) => void;
  onCommit: (patch: Partial<LPElemento>) => void;
  onRemover: () => void;
  onDuplicar: () => void;
  onTrazerFrente: () => void;
  onMandarFundo: () => void;
  onReplaceSrc: (cb: (src: string) => void) => void;
  onPickImage: (cb: (src: string) => void) => void;
  pagina: LandingPage;
  onUpdatePage: (patch: Partial<LandingPage>) => void;
}) {
  if (!el) {
    return (
      <PageInspector
        pagina={pagina}
        onUpdate={onUpdatePage}
        onPickImage={onPickImage}
      />
    );
  }

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Editando
          </div>
          <div className="text-[13px] font-semibold text-slate-900">{labelTipo(el.tipo)}</div>
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn onClick={onTrazerFrente} label="Trazer para frente">
            <Layers className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onMandarFundo} label="Enviar para trás">
            <Layers className="h-3.5 w-3.5 rotate-180" />
          </IconBtn>
          <IconBtn onClick={onDuplicar} label="Duplicar">
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onRemover} label="Remover" tone="rose">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Posição & tamanho */}
      <Section title="Posição & tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(el.x)} onChange={(v) => onCommit({ x: v })} />
          <NumberField label="Y" value={Math.round(el.y)} onChange={(v) => onCommit({ y: v })} />
          <NumberField label="Largura" value={Math.round(el.w)} onChange={(v) => onCommit({ w: v })} min={20} />
          <NumberField label="Altura" value={Math.round(el.h)} onChange={(v) => onCommit({ h: v })} min={20} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <NumberField
            label="Rotação°"
            value={Math.round(el.rotation ?? 0)}
            onChange={(v) => onCommit({ rotation: v })}
          />
          <SliderField
            label="Opacidade"
            value={(el.opacity ?? 1) * 100}
            onChange={(v) => onUpdate({ opacity: v / 100 })}
            onRelease={(v) => onCommit({ opacity: v / 100 })}
            min={0}
            max={100}
          />
        </div>
      </Section>

      {/* Conteúdo */}
      {(el.tipo === "texto" || el.tipo === "botao") && (
        <Section title="Conteúdo">
          <textarea
            value={el.texto ?? ""}
            onChange={(e) => onUpdate({ texto: e.target.value })}
            onBlur={() => onCommit({ texto: el.texto })}
            rows={el.tipo === "texto" ? 3 : 1}
            className="w-full rounded-[8px] border border-slate-200 px-2 py-1.5 text-[12px] resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField
              label="Tamanho"
              value={el.fontSize ?? 16}
              onChange={(v) => onCommit({ fontSize: v })}
              min={8}
              max={200}
            />
            <SelectField
              label="Peso"
              value={String(el.fontWeight ?? 400)}
              onChange={(v) => onCommit({ fontWeight: Number(v) })}
              options={[
                { v: "300", l: "Light" },
                { v: "400", l: "Regular" },
                { v: "500", l: "Medium" },
                { v: "600", l: "Semibold" },
                { v: "700", l: "Bold" },
                { v: "800", l: "Extrabold" },
              ]}
            />
          </div>
          <div className="mt-2 flex items-center gap-1">
            <ToggleBtn active={el.align === "left"} onClick={() => onCommit({ align: "left" })}>
              <AlignLeft className="h-3.5 w-3.5" />
            </ToggleBtn>
            <ToggleBtn active={(el.align ?? "left") === "center"} onClick={() => onCommit({ align: "center" })}>
              <AlignCenter className="h-3.5 w-3.5" />
            </ToggleBtn>
            <ToggleBtn active={el.align === "right"} onClick={() => onCommit({ align: "right" })}>
              <AlignRight className="h-3.5 w-3.5" />
            </ToggleBtn>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToggleBtn active={!!el.italic} onClick={() => onCommit({ italic: !el.italic })}>
              <Italic className="h-3.5 w-3.5" />
            </ToggleBtn>
            <ToggleBtn active={!!el.underline} onClick={() => onCommit({ underline: !el.underline })}>
              <Underline className="h-3.5 w-3.5" />
            </ToggleBtn>
            <ToggleBtn active={(el.fontWeight ?? 400) >= 700} onClick={() => onCommit({ fontWeight: (el.fontWeight ?? 400) >= 700 ? 400 : 700 })}>
              <Bold className="h-3.5 w-3.5" />
            </ToggleBtn>
          </div>
        </Section>
      )}

      {/* Tipografia */}
      {(el.tipo === "texto" || el.tipo === "botao") && (
        <Section title="Tipografia">
          <FontFamilyPicker
            value={el.fontFamily}
            onChange={(v) => onCommit({ fontFamily: v })}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField
              label="Entrelinha"
              value={Number((el.lineHeight ?? 1.2).toFixed(2))}
              step={0.05}
              min={0.8}
              max={3}
              onChange={(v) => onCommit({ lineHeight: v })}
            />
            <NumberField
              label="Espaço letras"
              value={el.letterSpacing ?? 0}
              step={0.5}
              min={-5}
              max={20}
              onChange={(v) => onCommit({ letterSpacing: v })}
            />
          </div>
          <div className="mt-2">
            <SelectField
              label="Caixa"
              value={el.textTransform ?? "none"}
              onChange={(v) => onCommit({ textTransform: v as LPElemento["textTransform"] })}
              options={[
                { v: "none", l: "Normal" },
                { v: "uppercase", l: "MAIÚSCULAS" },
                { v: "lowercase", l: "minúsculas" },
                { v: "capitalize", l: "Capitalizada" },
              ]}
            />
          </div>
        </Section>
      )}

      {/* Mídia */}
      {(el.tipo === "imagem" || el.tipo === "video") && (
        <Section title="Mídia">
          <button
            onClick={() => onReplaceSrc((src) => onCommit({ src }))}
            className="w-full h-9 rounded-[8px] border border-slate-200 hover:border-brand-400 bg-white text-[12px] font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            {el.src ? "Trocar arquivo" : "Enviar arquivo"}
          </button>
          <div className="mt-2">
            <div className="text-[10px] text-slate-500 font-semibold mb-1">Ajuste</div>
            <div className="inline-flex rounded-[8px] border border-slate-200 p-0.5 w-full">
              <button
                onClick={() => onCommit({ fit: "cover" })}
                className={cn(
                  "flex-1 h-7 text-[11px] font-semibold rounded-[6px] transition",
                  (el.fit ?? "cover") === "cover"
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Cobrir
              </button>
              <button
                onClick={() => onCommit({ fit: "contain" })}
                className={cn(
                  "flex-1 h-7 text-[11px] font-semibold rounded-[6px] transition",
                  el.fit === "contain"
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Conter
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Link — apenas para texto/imagem */}
      {(el.tipo === "imagem" || el.tipo === "texto") && (
        <Section title="Link (destino)">
          <div className="relative">
            <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="url"
              value={el.href ?? ""}
              onChange={(e) => onUpdate({ href: e.target.value })}
              onBlur={() => onCommit({ href: el.href })}
              placeholder="https://..."
              className="w-full h-8 rounded-[8px] border border-slate-200 pl-7 pr-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>
        </Section>
      )}

      {/* Botão — configuração avançada */}
      {el.tipo === "botao" && <BotaoInspectorSection el={el} onUpdate={onUpdate} onCommit={onCommit} />}

      {/* Cena animada — picker */}
      {el.tipo === "bg_animado" && <BgAnimInspectorSection el={el} onCommit={onCommit} />}

      {/* Cores */}
      <Section title="Cores & estilo">
        {(el.tipo === "texto" || el.tipo === "botao" || el.tipo === "icone") && (
          <ColorField label="Cor do texto" value={el.color ?? "#0f172a"} onChange={(v) => onCommit({ color: v })} />
        )}
        {(el.tipo === "botao" || el.tipo === "forma_retangulo" || el.tipo === "forma_circulo") && (
          <ColorField label="Fundo" value={el.bg ?? "#0B6BCB"} onChange={(v) => onCommit({ bg: v })} />
        )}
        {(el.tipo === "imagem" ||
          el.tipo === "video" ||
          el.tipo === "botao" ||
          el.tipo === "forma_retangulo") && (
          <NumberField
            label="Arredondamento"
            value={el.radius ?? 0}
            onChange={(v) => onCommit({ radius: v })}
            min={0}
            max={999}
          />
        )}
        <div className="mt-2 flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={!!el.shadow}
              onChange={(e) => onCommit({ shadow: e.target.checked })}
              className="accent-brand-500"
            />
            Sombra
          </label>
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BOTÃO — INSPECTOR SECTION
   ═══════════════════════════════════════════════════════════════════ */

const BTN_VARIANTES: { id: NonNullable<LPElemento["btnVariante"]>; label: string; preview: string }[] = [
  { id: "solid", label: "Sólido", preview: "bg-brand-500 text-white" },
  { id: "outline", label: "Outline", preview: "border-2 border-brand-500 text-brand-600" },
  { id: "ghost", label: "Ghost", preview: "text-brand-600 bg-brand-50" },
  { id: "gradient", label: "Gradiente", preview: "text-white" },
  { id: "glass", label: "Glass", preview: "text-slate-900 bg-white/60 backdrop-blur border border-white/80" },
];

const BTN_RADIUS_PRESETS: { id: NonNullable<LPElemento["btnRadiusPreset"]>; label: string; radius: number }[] = [
  { id: "sharp", label: "Quadrado", radius: 0 },
  { id: "rounded", label: "Arredondado", radius: 12 },
  { id: "pill", label: "Pill", radius: 999 },
];

const BTN_HOVER_FX: { id: NonNullable<LPElemento["btnHoverFx"]>; label: string }[] = [
  { id: "none", label: "Nenhum" },
  { id: "lift", label: "Flutuar" },
  { id: "glow", label: "Brilhar" },
  { id: "pulse", label: "Pulsar" },
];

const BTN_ACAO_TIPOS: { id: NonNullable<LPElemento["btnAcao"]>["tipo"]; label: string; placeholder: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "link", label: "URL externa", placeholder: "https://...", icon: LinkIcon },
  { id: "scroll", label: "Seção da página", placeholder: "#precos", icon: ArrowRight },
  { id: "whatsapp", label: "WhatsApp", placeholder: "5511999999999", icon: MessageCircle },
  { id: "phone", label: "Telefone", placeholder: "+55 11 99999-9999", icon: Phone },
  { id: "email", label: "Email", placeholder: "contato@valparaiso.com.br", icon: MailIcon },
  { id: "download", label: "Download", placeholder: "https://.../arquivo.pdf", icon: DownloadIcon },
];

function BgAnimInspectorSection({
  el,
  onCommit,
}: {
  el: LPElemento;
  onCommit: (patch: Partial<LPElemento>) => void;
}) {
  const atual = el.bgAnimId;
  return (
    <Section title="Cena animada">
      <div className="text-[10px] text-slate-500 mb-2">
        Escolha a cena que será renderizada dentro do elemento. Redimensione pelas alças para posicionar onde quiser no canvas.
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {BG_ANIMATIONS.map((b) => (
          <button
            key={b.id}
            onClick={() => onCommit({ bgAnimId: b.id })}
            className={cn(
              "h-16 rounded-[10px] border text-[10px] font-semibold transition inline-flex flex-col items-stretch overflow-hidden relative group",
              atual === b.id
                ? "ring-2 ring-brand-500 border-brand-500"
                : "border-slate-200 hover:border-brand-300"
            )}
            title={b.desc}
          >
            <div
              className="absolute inset-0"
              style={{ background: b.swatch }}
            />
            <div className="relative z-[1] mt-auto bg-white/92 text-slate-900 px-1.5 py-0.5 text-[9.5px] font-bold truncate">
              {b.label}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        {atual
          ? BG_ANIMATIONS.find((b) => b.id === atual)?.desc
          : "Nenhuma cena selecionada."}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onCommit({ radius: 0 })}
          className="h-8 rounded-[8px] border border-slate-200 text-[10.5px] font-semibold hover:border-brand-300"
        >
          Cantos retos
        </button>
        <button
          onClick={() => onCommit({ radius: 999 })}
          className="h-8 rounded-[8px] border border-slate-200 text-[10.5px] font-semibold hover:border-brand-300"
        >
          Círculo / pílula
        </button>
      </div>
    </Section>
  );
}

function BotaoInspectorSection({
  el,
  onUpdate,
  onCommit,
}: {
  el: LPElemento;
  onUpdate: (patch: Partial<LPElemento>) => void;
  onCommit: (patch: Partial<LPElemento>) => void;
}) {
  const acao = el.btnAcao ?? { tipo: "link" as const, valor: "" };
  const variante = el.btnVariante ?? "solid";
  const radiusPreset = el.btnRadiusPreset ?? "rounded";
  const hoverFx = el.btnHoverFx ?? "lift";
  const iconKey = (el.btnIcon ?? "none") as BtnIconKey;
  const iconPos = el.btnIconPos ?? "left";

  return (
    <>
      <Section title="Estilo do botão">
        <div className="text-[10px] text-slate-500 font-semibold mb-1.5">Variante</div>
        <div className="grid grid-cols-5 gap-1">
          {BTN_VARIANTES.map((v) => (
            <button
              key={v.id}
              onClick={() => onCommit({ btnVariante: v.id })}
              className={cn(
                "h-9 rounded-[8px] text-[9.5px] font-bold border transition inline-flex items-center justify-center",
                variante === v.id ? "ring-2 ring-brand-500 border-brand-500" : "border-slate-200 hover:border-brand-300",
                v.preview
              )}
              style={
                v.id === "gradient"
                  ? { background: `linear-gradient(135deg,${el.btnGradientDe ?? "#0B6BCB"},${el.btnGradientPara ?? "#06b6d4"})` }
                  : undefined
              }
              title={v.label}
            >
              {v.label}
            </button>
          ))}
        </div>

        {variante === "gradient" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ColorField
              label="Gradiente início"
              value={el.btnGradientDe ?? "#0B6BCB"}
              onChange={(v) => onCommit({ btnGradientDe: v })}
            />
            <ColorField
              label="Gradiente fim"
              value={el.btnGradientPara ?? "#06b6d4"}
              onChange={(v) => onCommit({ btnGradientPara: v })}
            />
          </div>
        )}

        <div className="mt-3 text-[10px] text-slate-500 font-semibold mb-1.5">Forma</div>
        <div className="grid grid-cols-3 gap-1">
          {BTN_RADIUS_PRESETS.map((r) => (
            <button
              key={r.id}
              onClick={() => onCommit({ btnRadiusPreset: r.id, radius: r.radius })}
              className={cn(
                "h-9 text-[10.5px] font-semibold border transition inline-flex items-center justify-center bg-brand-500 text-white",
                radiusPreset === r.id ? "ring-2 ring-brand-500 border-brand-500" : "border-slate-200 hover:border-brand-300"
              )}
              style={{ borderRadius: r.radius }}
              title={r.label}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-3 text-[10px] text-slate-500 font-semibold mb-1.5">Efeito no hover</div>
        <div className="grid grid-cols-4 gap-1">
          {BTN_HOVER_FX.map((h) => (
            <button
              key={h.id}
              onClick={() => onCommit({ btnHoverFx: h.id })}
              className={cn(
                "h-8 text-[10.5px] font-semibold rounded-[8px] border transition",
                hoverFx === h.id
                  ? "ring-2 ring-brand-500 border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Ícone">
        <div className="grid grid-cols-3 gap-1 mb-2">
          {(Object.keys(BTN_ICON_LABEL) as BtnIconKey[]).map((k) => {
            const Icon = iconComponentFor(k);
            const ativo = iconKey === k;
            return (
              <button
                key={k}
                onClick={() => onCommit({ btnIcon: k })}
                className={cn(
                  "h-9 rounded-[8px] border inline-flex items-center justify-center gap-1.5 text-[10.5px] font-semibold transition",
                  ativo
                    ? "ring-2 ring-brand-500 border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                )}
                title={BTN_ICON_LABEL[k]}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="text-[10px]">—</span>}
                <span className="truncate">{BTN_ICON_LABEL[k]}</span>
              </button>
            );
          })}
        </div>
        {iconKey !== "none" && (
          <div className="flex items-center gap-1">
            <div className="text-[10px] text-slate-500 font-semibold mr-1">Posição:</div>
            <button
              onClick={() => onCommit({ btnIconPos: "left" })}
              className={cn(
                "h-7 px-2.5 rounded-[6px] text-[10.5px] font-semibold border transition",
                iconPos === "left" ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-200"
              )}
            >
              ← Esquerda
            </button>
            <button
              onClick={() => onCommit({ btnIconPos: "right" })}
              className={cn(
                "h-7 px-2.5 rounded-[6px] text-[10.5px] font-semibold border transition",
                iconPos === "right" ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-200"
              )}
            >
              Direita →
            </button>
          </div>
        )}
      </Section>

      <Section title="Ação ao clicar">
        <div className="grid grid-cols-3 gap-1 mb-2">
          {BTN_ACAO_TIPOS.map((a) => {
            const Icon = a.icon;
            const ativo = acao.tipo === a.id;
            return (
              <button
                key={a.id}
                onClick={() => onCommit({ btnAcao: { tipo: a.id, valor: acao.valor } })}
                className={cn(
                  "h-8 rounded-[8px] border inline-flex items-center justify-center gap-1 text-[10px] font-semibold transition",
                  ativo
                    ? "ring-2 ring-brand-500 border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <input
            type="text"
            value={acao.valor}
            onChange={(e) => onUpdate({ btnAcao: { tipo: acao.tipo, valor: e.target.value } })}
            onBlur={() => onCommit({ btnAcao: acao })}
            placeholder={BTN_ACAO_TIPOS.find((a) => a.id === acao.tipo)?.placeholder ?? ""}
            className="w-full h-8 rounded-[8px] border border-slate-200 px-2.5 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
          />
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {acao.tipo === "whatsapp" && "Somente números com DDI (ex: 5511999999999)."}
          {acao.tipo === "scroll" && "Use o ID da seção — ex: #precos, #depoimentos"}
          {acao.tipo === "email" && "Abre cliente de email com destinatário preenchido."}
          {acao.tipo === "download" && "URL direta do arquivo para download."}
        </div>
      </Section>
    </>
  );
}

function iconComponentFor(k: BtnIconKey): React.ComponentType<{ className?: string }> | null {
  const map: Record<BtnIconKey, React.ComponentType<{ className?: string }> | null> = {
    none: null,
    arrow_right: ArrowRight,
    play: Play,
    star: Star,
    check: Check,
    whatsapp: MessageCircle,
    phone: Phone,
    mail: MailIcon,
    cart: ShoppingCart,
    download: DownloadIcon,
    sparkles: Sparkles,
    heart: Heart,
  };
  return map[k];
}

function PageInspector({
  pagina,
  onUpdate,
  onPickImage,
}: {
  pagina: LandingPage;
  onUpdate: (patch: Partial<LandingPage>) => void;
  onPickImage: (cb: (src: string) => void) => void;
}) {
  return (
    <div className="p-3 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          Canvas
        </div>
        <div className="text-[13px] font-semibold text-slate-900 mt-0.5">
          Configurações da página
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Selecione um elemento para editá-lo, ou ajuste o canvas aqui.
        </div>
      </div>

      <Section title="Cor/Gradiente base">
        <ColorField
          label="Cor de fundo"
          value={pagina.canvasBg ?? "#ffffff"}
          onChange={(v) => onUpdate({ canvasBg: v })}
        />
        <div className="mt-2">
          <div className="text-[10px] text-slate-500 font-semibold mb-1">Gradientes rápidos</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              templateGradient.valparaiso_park,
              templateGradient.passaporte_anual,
              templateGradient.passaporte_diario,
              templateGradient.evento_corporativo,
              templateGradient.aventura_radical,
              templateGradient.promocoes,
            ].map((g) => (
              <button
                key={g}
                onClick={() => onUpdate({ canvasBg: g })}
                className="h-8 rounded-[8px] border border-slate-200 hover:ring-2 hover:ring-brand-400 transition"
                style={{ background: g }}
                aria-label="Usar este gradiente"
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Imagem de fundo">
        {pagina.canvasBgImage ? (
          <div className="space-y-2">
            <div
              className="h-20 rounded-[10px] border border-slate-200 bg-slate-100"
              style={{
                backgroundImage: pagina.canvasBgImage,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  onPickImage((src) => onUpdate({ canvasBgImage: `url("${src}")` }))
                }
                className="h-8 rounded-[8px] border border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50 text-[11px] font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="h-3 w-3" /> Trocar
              </button>
              <button
                onClick={() => onUpdate({ canvasBgImage: undefined })}
                className="h-8 rounded-[8px] border border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50 text-[11px] font-semibold text-rose-700 inline-flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() =>
              onPickImage((src) => onUpdate({ canvasBgImage: `url("${src}")` }))
            }
            className="w-full h-16 rounded-[10px] border-2 border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-slate-500 hover:text-brand-600 text-[12px] font-semibold inline-flex items-center justify-center gap-2 transition"
          >
            <Upload className="h-4 w-4" /> Fazer upload
          </button>
        )}
      </Section>

      <Section title="Altura">
        <NumberField
          label="Altura (px)"
          value={pagina.canvasH ?? DEFAULT_CANVAS_H}
          onChange={(v) => onUpdate({ canvasH: Math.max(400, v) })}
          min={400}
          max={8000}
        />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYERS PANEL
   ═══════════════════════════════════════════════════════════════════ */

function LayersPanel({
  elementos,
  selId,
  onSelect,
  onRemover,
  onBringForward,
  onSendBackward,
}: {
  elementos: LPElemento[];
  selId: string | null;
  onSelect: (id: string) => void;
  onRemover: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}) {
  const sorted = [...elementos].sort((a, b) => b.z - a.z);
  if (sorted.length === 0) {
    return (
      <div className="p-4 text-center text-[12px] text-slate-400">
        <Layers className="h-6 w-6 mx-auto mb-2 text-slate-300" />
        Canvas vazio
      </div>
    );
  }
  return (
    <div className="p-2 space-y-1">
      {sorted.map((el) => {
        const Icon = iconForTipo(el.tipo);
        const ativo = selId === el.id;
        return (
          <div
            key={el.id}
            className={cn(
              "rounded-[8px] border transition group/layer flex items-center gap-2 p-1.5",
              ativo
                ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                : "border-slate-200 bg-white hover:border-brand-300"
            )}
          >
            <button onClick={() => onSelect(el.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left">
              <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-900 truncate leading-tight">
                  {labelFromEl(el)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {Math.round(el.w)}×{Math.round(el.h)}
                </div>
              </div>
            </button>
            <div className="flex items-center opacity-0 group-hover/layer:opacity-100 transition">
              <IconBtn size="xs" onClick={() => onBringForward(el.id)} label="Trazer para frente">
                <Layers className="h-3 w-3" />
              </IconBtn>
              <IconBtn size="xs" onClick={() => onSendBackward(el.id)} label="Enviar para trás">
                <Layers className="h-3 w-3 rotate-180" />
              </IconBtn>
              <IconBtn size="xs" onClick={() => onRemover(el.id)} label="Remover" tone="rose">
                <Trash2 className="h-3 w-3" />
              </IconBtn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS UI
   ═══════════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] tabular focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  onRelease,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onRelease: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
        <span className="text-[10px] text-slate-400 tabular">{Math.round(value)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={(e) => onRelease(Number((e.target as HTMLInputElement).value))}
        className="w-full accent-brand-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function FontFamilyPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const grupos: Array<{ label: string; cat: (typeof FONT_FAMILIES)[number]["categoria"] }> = [
    { label: "Sans-serif", cat: "sans" },
    { label: "Display", cat: "display" },
    { label: "Serif", cat: "serif" },
    { label: "Handwriting", cat: "handwriting" },
    { label: "Mono", cat: "mono" },
  ];
  const current = FONT_FAMILIES.find((f) => f.id === value);
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 font-semibold">Fonte</span>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? v : undefined);
          if (v) ensureLandingFontsLoaded([v]);
        }}
        className="w-full h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        style={{ fontFamily: current ? current.stack : undefined }}
      >
        <option value="">Padrão (Inter)</option>
        {grupos.map((g) => {
          const fontes = FONT_FAMILIES.filter((f) => f.categoria === g.cat);
          if (!fontes.length) return null;
          return (
            <optgroup key={g.cat} label={g.label}>
              {fontes.map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {current && (
        <div
          className="mt-1.5 px-2 py-1.5 rounded-[8px] border border-slate-200 bg-slate-50 text-[13px] text-slate-700 truncate"
          style={{ fontFamily: current.stack }}
          title={current.tags.join(" · ")}
        >
          Aa — {current.label}
        </div>
      )}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isGradient = value.startsWith("linear-gradient") || value.startsWith("radial-gradient");
  return (
    <label className="block mb-2">
      <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <div
          className="h-8 w-10 rounded-[8px] border border-slate-200 shrink-0"
          style={{ background: value }}
        />
        {!isGradient && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 rounded-[6px] border border-slate-200 cursor-pointer"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 rounded-[8px] border border-slate-200 px-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        />
      </div>
    </label>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-[6px] inline-flex items-center justify-center transition",
        active
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
  tone,
  size = "sm",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  tone?: "rose";
  size?: "xs" | "sm";
}) {
  const sizeCls = size === "xs" ? "h-6 w-6" : "h-7 w-7";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-[6px] inline-flex items-center justify-center transition",
        sizeCls,
        tone === "rose"
          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-10 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition border-b-2",
        active
          ? "text-brand-700 border-brand-500 bg-brand-50/30"
          : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function labelTipo(tipo: LPElementoTipo): string {
  return {
    texto: "Texto",
    imagem: "Imagem",
    video: "Vídeo",
    botao: "Botão",
    forma_retangulo: "Retângulo",
    forma_circulo: "Círculo",
    icone: "Ícone",
    bg_animado: "Cena animada",
  }[tipo];
}

function labelFromEl(el: LPElemento): string {
  if (el.tipo === "texto" || el.tipo === "botao") {
    return (el.texto ?? "").slice(0, 24) || labelTipo(el.tipo);
  }
  return labelTipo(el.tipo);
}

function iconForTipo(tipo: LPElementoTipo): React.ComponentType<{ className?: string }> {
  return {
    texto: TypeIcon,
    imagem: ImageIcon,
    video: Film,
    botao: MousePointer2,
    forma_retangulo: Square,
    forma_circulo: Circle,
    icone: Star,
    bg_animado: Sparkles,
  }[tipo];
}

/* ═══════════════════════════════════════════════════════════════════
   NOVA DIALOG
   ═══════════════════════════════════════════════════════════════════ */

function NovaDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (template: TemplateId, titulo: string, slug: string) => void;
}) {
  const [template, setTemplate] = useState<TemplateId>("valparaiso_park");
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!slugEditado) setSlug(slugify(titulo));
  }, [titulo, slugEditado]);

  const opts: TemplateId[] = ["valparaiso_park", "passaporte_anual", "passaporte_diario", "evento_corporativo", "festa_aniversario", "aventura_radical", "promocoes", "blank"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-[16px] shadow-pop border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Nova landing page</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Escolha um modelo — tudo é editável no canvas estilo Canva
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100 transition"
            aria-label="Fechar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Modelo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {opts.map((t) => {
                const ativo = template === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={cn(
                      "rounded-[14px] border overflow-hidden text-left transition",
                      ativo
                        ? "border-brand-500 ring-2 ring-brand-200 shadow-pop"
                        : "border-slate-200 hover:border-brand-300 hover:shadow-soft"
                    )}
                  >
                    <div className="h-24 relative" style={{ background: templateGradient[t] }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Waves className="h-6 w-6 text-white/80" />
                      </div>
                      {ativo && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-brand-600 inline-flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[13px] font-bold text-slate-900">{templateLabel[t]}</div>
                      <div className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                        {templateDesc[t]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full h-10 rounded-[10px] border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              placeholder="Ex.: Família Verão — promoção outubro"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              URL
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono text-[12px]">aquapark.com/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugEditado(true);
                  setSlug(slugify(e.target.value));
                }}
                className="flex-1 h-10 rounded-[10px] border border-slate-200 px-3 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                placeholder="familia-verao-outubro"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 rounded-b-[16px] flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onCreate(template, titulo, slug)} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
            Criar e abrir editor
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CLARITY — BANNER / CONFIG / STATS
   ═══════════════════════════════════════════════════════════════════ */

function ClarityBanner({
  cfg,
  onConfigure,
  onDisconnect,
}: {
  cfg: ClarityConfig;
  onConfigure: () => void;
  onDisconnect: () => void;
}) {
  if (!cfg.conectado) {
    return (
      <div className="mb-5 rounded-[14px] border border-violet-200 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-[12px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white inline-flex items-center justify-center shadow-soft shrink-0">
          <Flame className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 inline-flex items-center gap-2">
            Microsoft Clarity — heatmaps por landing page
            <Badge tone="amber" className="text-[10px]">Modo demo</Badge>
          </div>
          <div className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">
            Conecte seu projeto Clarity para ativar mapas de calor, gravações de sessão, rage/dead clicks e scroll depth
            em cada landing. Enquanto isso, métricas são simuladas.
          </div>
        </div>
        <Button size="sm" onClick={onConfigure} leftIcon={<Zap className="h-3.5 w-3.5" />}>
          Conectar Clarity
        </Button>
      </div>
    );
  }
  return (
    <div className="mb-5 rounded-[14px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 flex items-center gap-3">
      <div className="h-9 w-9 rounded-[10px] bg-emerald-500 text-white inline-flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-900">
          Clarity conectado{" "}
          <span className="font-mono text-[11px] text-slate-500">· projeto {cfg.projectId}</span>
        </div>
        <div className="text-[11px] text-slate-600">
          Todas as landings publicadas injetam o snippet com <code className="font-mono text-[10.5px] text-violet-700">landing_slug</code> para
          filtragem no dashboard.
        </div>
      </div>
      <button
        onClick={onConfigure}
        className="h-8 px-2.5 rounded-[8px] bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-700 text-slate-600 text-[11px] font-semibold inline-flex items-center gap-1.5 transition"
      >
        <Key className="h-3.5 w-3.5" />
        Credenciais
      </button>
      <button
        onClick={onDisconnect}
        className="h-8 px-2.5 rounded-[8px] bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 text-[11px] font-semibold inline-flex items-center gap-1.5 transition"
      >
        <X className="h-3.5 w-3.5" />
        Desconectar
      </button>
    </div>
  );
}

function ClarityConfigDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: ClarityConfig;
  onClose: () => void;
  onSave: (cfg: ClarityConfig) => void;
}) {
  const [projectId, setProjectId] = useState(initial.projectId);
  const [apiToken, setApiToken] = useState(initial.apiToken ?? "");
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<"ok" | "erro" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const testar = () => {
    setTestando(true);
    setResultado(null);
    window.setTimeout(() => {
      setTestando(false);
      setResultado(projectId.length >= 6 ? "ok" : "erro");
    }, 900);
  };

  const salvar = () => {
    if (!projectId.trim()) return;
    onSave({
      projectId: projectId.trim(),
      apiToken: apiToken.trim() || undefined,
      conectado: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-[18px] shadow-pop w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white inline-flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-slate-900">Conectar Microsoft Clarity</div>
            <div className="text-[11.5px] text-slate-500">Heatmap, gravações, rage/dead clicks por landing</div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-[8px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 inline-flex items-center justify-center transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="rounded-[12px] bg-slate-50 border border-slate-200 p-3.5">
            <div className="text-[11.5px] text-slate-700 leading-relaxed">
              <div className="font-semibold text-slate-900 mb-1.5 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Como obter as credenciais
              </div>
              <ol className="list-decimal ml-4 space-y-1 text-slate-600">
                <li>Acesse <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">clarity.microsoft.com</a> e crie (ou selecione) o projeto.</li>
                <li>Em <b>Settings → Overview</b> copie o <b>Project ID</b>.</li>
                <li>Para métricas no CRM, gere um <b>API token</b> em <b>Settings → Data Export</b> (limite 10 req/dia).</li>
                <li>Sem API token o heatmap ainda funciona — abre no dashboard externo.</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Project ID <span className="text-rose-500">*</span>
            </label>
            <input
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setResultado(null);
              }}
              placeholder="ex: abc123xyz"
              className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-[13px] font-mono outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider inline-flex items-center gap-1.5">
              API token
              <span className="text-slate-400 font-normal normal-case tracking-normal text-[10.5px]">
                (opcional — libera métricas nativas)
              </span>
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value);
                setResultado(null);
              }}
              placeholder="Bearer token da Data Export API"
              className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-[13px] font-mono outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          {resultado === "ok" && (
            <div className="rounded-[10px] bg-emerald-50 border border-emerald-200 p-2.5 text-[11.5px] text-emerald-700 inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Conexão OK — pronto para ativar.
            </div>
          )}
          {resultado === "erro" && (
            <div className="rounded-[10px] bg-rose-50 border border-rose-200 p-2.5 text-[11.5px] text-rose-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Não foi possível validar — revise o Project ID.
            </div>
          )}

          <div className="rounded-[12px] bg-violet-50 border border-violet-200 p-3">
            <div className="text-[11px] font-semibold text-violet-900 mb-1 inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              O que é ativado ao conectar
            </div>
            <ul className="text-[11px] text-violet-800 space-y-0.5 ml-1">
              <li>• Snippet JS injetado em todas as landings publicadas</li>
              <li>• Tag automática <code className="font-mono text-[10.5px] bg-white/60 px-1 rounded">landing_slug</code> em cada sessão</li>
              <li>• Mapa de calor (clique / scroll / área) acessível por deep-link</li>
              <li>• Métricas agregadas puxadas via API a cada 1h (cache local)</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={testar}
            disabled={testando || !projectId.trim()}
            leftIcon={testando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          >
            {testando ? "Testando…" : "Testar conexão"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={!projectId.trim()}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Salvar e conectar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClarityStatsDialog({
  pagina,
  cfg,
  onClose,
  onConfigure,
}: {
  pagina: LandingPage;
  cfg: ClarityConfig;
  onClose: () => void;
  onConfigure: () => void;
}) {
  const [periodo, setPeriodo] = useState<ClarityMetrics["periodo"]>("30d");
  const [metrics, setMetrics] = useState<ClarityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"resumo" | "cliques" | "scroll" | "snippet">("resumo");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const load = (force = false) => {
    setLoading(true);
    getLandingMetrics(pagina.slug, periodo, force).then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina.slug, periodo]);

  const heatmap = cfg.conectado ? heatmapDeepLink(cfg.projectId, pagina.slug, "click") : null;
  const heatmapScroll = cfg.conectado ? heatmapDeepLink(cfg.projectId, pagina.slug, "scroll") : null;
  const heatmapArea = cfg.conectado ? heatmapDeepLink(cfg.projectId, pagina.slug, "area") : null;
  const rec = cfg.conectado ? recordingsDeepLink(cfg.projectId, pagina.slug) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-[18px] shadow-pop w-full max-w-[960px] max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        {/* header */}
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 relative overflow-hidden"
          style={{ background: templateGradient[pagina.template] }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
          <div className="relative h-11 w-11 rounded-[12px] bg-white/90 backdrop-blur text-violet-600 inline-flex items-center justify-center shadow-soft shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-white/90 uppercase tracking-wider drop-shadow">
              Heatmap & Estatísticas — Clarity
            </div>
            <div className="text-[16px] font-bold text-slate-900 line-clamp-1">{pagina.titulo}</div>
            <div className="text-[11px] text-slate-700 font-mono">/{pagina.slug}</div>
          </div>
          <div className="relative inline-flex rounded-[10px] bg-white/80 backdrop-blur p-0.5 border border-white/50">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={cn(
                  "h-7 px-3 text-[11px] font-semibold rounded-[8px] transition",
                  periodo === p ? "bg-slate-900 text-white shadow-soft" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(true)}
            className="relative h-8 w-8 rounded-[8px] bg-white/80 backdrop-blur hover:bg-white text-slate-600 hover:text-slate-900 inline-flex items-center justify-center transition"
            aria-label="Atualizar"
            title="Atualizar dados"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button
            onClick={onClose}
            className="relative h-8 w-8 rounded-[8px] bg-white/80 backdrop-blur hover:bg-white text-slate-600 hover:text-slate-900 inline-flex items-center justify-center transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alerta quando não conectado */}
        {!cfg.conectado && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11.5px] text-amber-800">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">
              Clarity não conectado — exibindo métricas <b>simuladas</b> para demonstração.
            </span>
            <button
              onClick={onConfigure}
              className="h-7 px-2.5 rounded-[8px] bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition"
            >
              <Zap className="h-3 w-3" />
              Conectar agora
            </button>
          </div>
        )}

        {/* tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-1">
          {[
            { id: "resumo", label: "Resumo", icon: BarChart3 },
            { id: "cliques", label: "Cliques & Rage", icon: MousePointerClick },
            { id: "scroll", label: "Scroll depth", icon: LineChartIcon },
            { id: "snippet", label: "Snippet", icon: Key },
          ].map((t) => {
            const Icon = t.icon;
            const ativo = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={cn(
                  "h-9 px-3 text-[12px] font-semibold rounded-t-[10px] inline-flex items-center gap-1.5 transition -mb-px border-b-2",
                  ativo
                    ? "text-brand-700 border-brand-500 bg-brand-50/40"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !metrics ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-[13px]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando métricas…
            </div>
          ) : metrics ? (
            <div className="p-6">
              {tab === "resumo" && <TabResumo m={metrics} />}
              {tab === "cliques" && <TabCliques m={metrics} />}
              {tab === "scroll" && <TabScroll m={metrics} />}
              {tab === "snippet" && (
                <TabSnippet projectId={cfg.projectId || "SEU_PROJECT_ID"} slug={pagina.slug} conectado={cfg.conectado} />
              )}
            </div>
          ) : null}
        </div>

        {/* footer com deep-links */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 flex-wrap">
          <div className="text-[11px] text-slate-500 mr-auto inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {metrics
              ? `Atualizado ${relativeTime(metrics.atualizado_em)}`
              : "Carregando…"}
          </div>
          <DeepLinkBtn href={heatmap} label="Heatmap cliques" icon={Flame} disabled={!cfg.conectado} />
          <DeepLinkBtn href={heatmapScroll} label="Heatmap scroll" icon={LineChartIcon} disabled={!cfg.conectado} />
          <DeepLinkBtn href={heatmapArea} label="Heatmap área" icon={LayoutGrid} disabled={!cfg.conectado} />
          <DeepLinkBtn href={rec} label="Gravações" icon={Eye} disabled={!cfg.conectado} />
        </div>
      </div>
    </div>
  );
}

function DeepLinkBtn({
  href,
  label,
  icon: Icon,
  disabled,
}: {
  href: string | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
}) {
  if (disabled || !href) {
    return (
      <button
        disabled
        title="Conecte a Clarity para ativar"
        className="h-8 px-2.5 rounded-[8px] bg-white border border-slate-200 text-slate-400 text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-not-allowed"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="h-8 px-2.5 rounded-[8px] bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-700 text-[11px] font-semibold inline-flex items-center gap-1.5 transition"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

function TabResumo({ m }: { m: ClarityMetrics }) {
  const total = m.devices.mobile + m.devices.desktop + m.devices.tablet || 100;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricMini icon={Activity} tone="violet" label="Sessões" value={number(m.sessoes)} sub={`${number(m.sessoes_unicas)} únicas`} />
        <MetricMini icon={Clock} tone="aqua" label="Tempo médio" value={formatTime(m.tempo_medio_s)} sub={`Bounce ${m.bounce_pct}%`} />
        <MetricMini icon={Flame} tone="rose" label="Rage clicks" value={number(m.rage_clicks)} sub={`${m.dead_clicks} dead · ${m.quick_backs} quick-back`} />
        <MetricMini
          icon={LineChartIcon}
          tone="emerald"
          label="Scroll p50 / p90"
          value={`${m.scroll_p50}% / ${m.scroll_p90}%`}
          sub={`${m.excessive_scroll} scroll excessivo`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardBody>
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-brand-500" /> Sessões por dia
            </div>
            <Sparkline data={m.serie_sessoes} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-brand-500" /> Dispositivos
            </div>
            <div className="space-y-2">
              <DeviceBar icon={Smartphone} label="Mobile" value={m.devices.mobile} total={total} tone="violet" />
              <DeviceBar icon={Monitor} label="Desktop" value={m.devices.desktop} total={total} tone="aqua" />
              <DeviceBar icon={Tablet} label="Tablet" value={m.devices.tablet} total={total} tone="emerald" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-500" /> Top países
            </div>
            <div className="space-y-1.5">
              {m.top_paises.map((p) => (
                <div key={p.pais} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-700">{p.pais}</span>
                  <span className="font-semibold tabular text-slate-900">{number(p.sessoes)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">Sistemas operacionais</div>
            <div className="space-y-1.5">
              {m.top_os.map((o) => (
                <div key={o.os} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-700">{o.os}</span>
                  <span className="font-semibold tabular text-slate-900">{number(o.sessoes)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="rounded-[14px] border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
        <div className="text-[11px] font-semibold text-violet-900 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Insights da IA
        </div>
        <ul className="space-y-1.5 text-[12px] text-slate-800 leading-relaxed">
          {m.insights_ia.map((ins, i) => (
            <li key={i} className="inline-flex gap-2 items-start">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
              <span>{ins}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TabCliques({ m }: { m: ClarityMetrics }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-slate-500 mb-1">
        Elementos mais clicados e quantos cliques caracterizaram rage (3+ cliques rápidos no mesmo ponto).
      </div>
      <div className="rounded-[12px] border border-slate-200 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-semibold py-2.5 px-3">Seletor</th>
              <th className="text-right font-semibold py-2.5 px-3">Cliques</th>
              <th className="text-right font-semibold py-2.5 px-3">Rage</th>
              <th className="text-right font-semibold py-2.5 px-3">% rage</th>
            </tr>
          </thead>
          <tbody>
            {m.top_clicks.map((c) => {
              const pctRage = c.cliques > 0 ? (c.rage / c.cliques) * 100 : 0;
              const crit = pctRage >= 4;
              return (
                <tr key={c.seletor} className="border-t border-slate-100">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 truncate max-w-[380px]">
                    {c.seletor}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular font-semibold text-slate-900">{number(c.cliques)}</td>
                  <td className={cn("py-2.5 px-3 text-right tabular font-semibold", crit ? "text-rose-600" : "text-slate-700")}>
                    {number(c.rage)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right tabular font-semibold", crit ? "text-rose-600" : "text-emerald-600")}>
                    {pctRage.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <MetricMini icon={Flame} tone="rose" label="Rage clicks" value={number(m.rage_clicks)} />
        <MetricMini icon={MousePointerClick} tone="amber" label="Dead clicks" value={number(m.dead_clicks)} />
        <MetricMini icon={RefreshCw} tone="violet" label="Quick-backs" value={number(m.quick_backs)} />
      </div>
    </div>
  );
}

function TabScroll({ m }: { m: ClarityMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricMini icon={LineChartIcon} tone="emerald" label="Scroll p50" value={`${m.scroll_p50}%`} sub="Mediana de profundidade" />
        <MetricMini icon={LineChartIcon} tone="aqua" label="Scroll p90" value={`${m.scroll_p90}%`} sub="90% dos usuários alcançam" />
      </div>
      <Card>
        <CardBody>
          <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Visibilidade por seção
          </div>
          <div className="space-y-2.5">
            {m.scroll_por_secao.map((s) => (
              <div key={s.secao}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold text-slate-800">{s.secao}</span>
                  <span className="tabular font-semibold text-slate-900">{s.pct_visivel}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      s.pct_visivel >= 80
                        ? "bg-emerald-500"
                        : s.pct_visivel >= 55
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    )}
                    style={{ width: `${s.pct_visivel}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function TabSnippet({ projectId, slug, conectado }: { projectId: string; slug: string; conectado: boolean }) {
  const code = buildClaritySnippet(projectId, slug);
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard?.writeText(code);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  };
  return (
    <div className="space-y-4">
      <div className="text-[11.5px] text-slate-600 leading-relaxed">
        Este snippet é injetado automaticamente em todas as landings publicadas quando a Clarity está conectada. Ele
        carrega a biblioteca oficial e define a tag <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">landing_slug = "{slug}"</code>{" "}
        em cada sessão, permitindo filtrar heatmaps e gravações por landing no dashboard.
      </div>
      {!conectado && (
        <div className="rounded-[10px] bg-amber-50 border border-amber-200 p-2.5 text-[11.5px] text-amber-800">
          ⚠ Project ID não configurado — este é um preview. Conecte a Clarity para ativar a injeção automática.
        </div>
      )}
      <div className="relative">
        <pre className="rounded-[12px] bg-slate-900 text-slate-100 text-[11px] font-mono p-4 overflow-auto leading-relaxed">
          <code>{code}</code>
        </pre>
        <button
          onClick={copiar}
          className="absolute top-2 right-2 h-7 px-2.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition backdrop-blur"
        >
          {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function MetricMini({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "violet" | "aqua" | "emerald" | "rose" | "amber";
  label: string;
  value: string;
  sub?: string;
}) {
  const cls = {
    violet: "bg-violet-50 text-violet-600",
    aqua: "bg-aqua-50 text-aqua-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];
  return (
    <div className="rounded-[12px] border border-slate-200 bg-white p-3 flex items-center gap-2.5">
      <div className={cn("h-9 w-9 rounded-[10px] inline-flex items-center justify-center shrink-0", cls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider truncate">{label}</div>
        <div className="text-[16px] font-bold tabular text-slate-900 leading-tight">{value}</div>
        {sub && <div className="text-[10.5px] text-slate-500 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function DeviceBar({
  icon: Icon,
  label,
  value,
  total,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  tone: "violet" | "aqua" | "emerald";
}) {
  const pctVal = (value / total) * 100;
  const cls = {
    violet: "bg-violet-500",
    aqua: "bg-aqua-500",
    emerald: "bg-emerald-500",
  }[tone];
  return (
    <div>
      <div className="flex items-center gap-2 text-[11.5px] mb-0.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-slate-700 font-medium flex-1">{label}</span>
        <span className="font-semibold tabular text-slate-900">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", cls)} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: { data: string; sessoes: number }[] }) {
  if (data.length === 0) return null;
  const W = 560;
  const H = 120;
  const max = Math.max(...data.map((d) => d.sessoes), 1);
  const min = Math.min(...data.map((d) => d.sessoes));
  const step = W / Math.max(1, data.length - 1);
  const points = data.map((d, i) => [i * step, H - 10 - ((d.sessoes - min) / (max - min || 1)) * (H - 20)] as const);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[120px]">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0B6BCB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0B6BCB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={path} fill="none" stroke="#0B6BCB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="#0B6BCB" />
      ))}
    </svg>
  );
}

function formatTime(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

/* ═══════════════════════════════════════════════════════════════════
   Unused imports safeguard (manter tree-shake amigável)
   ═══════════════════════════════════════════════════════════════════ */

// ChevronDown is used by template preview decorations in some future iterations.
// Referenced here to avoid unused-import warnings on strict builds.
export const __iconRefs = { ChevronDown };
