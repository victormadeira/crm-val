#!/usr/bin/env node
/**
 * Crawler de ativos de marca — www.valparaisoadventurepark.com.br
 * Extrai: <img>, srcset, inline SVG, <link rel=icon>, CSS url(...) em <style>
 * e em stylesheets externos. Baixa tudo para public/brand/valparaiso/raw/
 * e emite um manifest.json com categorização heurística.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const BASE = "https://www.valparaisoadventurepark.com.br";
const PAGES = [
  "/",
  "/sobre",
  "/atracoes",
  "/restaurante",
  "/horario",
  "/comochegar",
  "/noticias",
  "/contato",
  "/duvidas",
  "/associacao",
  "/faca-seu-evento",
  "/promocoes",
];
const OUT_DIR = path.resolve("public/brand/valparaiso/raw");
const MANIFEST = path.resolve("public/brand/valparaiso/manifest.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

const urls = new Set();
const cssUrls = new Set();

function abs(u, pageUrl = BASE) {
  try {
    return new URL(u, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractFromHtml(html, pageUrl) {
  // <img src>
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const u = abs(m[1], pageUrl);
    if (u) urls.add(u);
  }
  // srcset (pega todas URLs)
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    m[1].split(",").forEach((p) => {
      const u = abs(p.trim().split(/\s+/)[0], pageUrl);
      if (u) urls.add(u);
    });
  }
  // <source src>
  for (const m of html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi)) {
    const u = abs(m[1], pageUrl);
    if (u) urls.add(u);
  }
  // icons
  for (const m of html.matchAll(
    /<link[^>]+rel=["'](?:icon|apple-touch-icon|mask-icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/gi
  )) {
    const u = abs(m[1], pageUrl);
    if (u) urls.add(u);
  }
  // external CSS
  for (const m of html.matchAll(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi
  )) {
    const u = abs(m[1], pageUrl);
    if (u) cssUrls.add(u);
  }
  // CSS inline em <style>...</style>
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    extractFromCss(m[1], pageUrl);
  }
  // style="" attrs com url(...)
  for (const m of html.matchAll(/style=["']([^"']+)["']/gi)) {
    extractFromCss(m[1], pageUrl);
  }
  // inline <svg>...</svg> — salva como arquivo
  const svgRe = /<svg[\s\S]*?<\/svg>/gi;
  let idx = 0;
  for (const m of html.matchAll(svgRe)) {
    const svg = m[0];
    const hash = createHash("md5").update(svg).digest("hex").slice(0, 8);
    const file = `inline-svg-${hash}.svg`;
    inlineSvgs.push({ file, content: svg });
    idx++;
  }
  return idx;
}

function extractFromCss(css, baseUrl) {
  for (const m of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
    const raw = m[1];
    if (raw.startsWith("data:")) continue;
    const u = abs(raw, baseUrl);
    if (u) urls.add(u);
  }
}

const inlineSvgs = [];

async function fetchText(u) {
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return await r.text();
}

async function downloadBinary(u) {
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { buf, contentType: r.headers.get("content-type") ?? "" };
}

function fileNameFromUrl(u) {
  const url = new URL(u);
  const base = path.basename(url.pathname) || "index";
  // evita colisão entre subpastas: prefixo com hash curto
  const hash = createHash("md5").update(u).digest("hex").slice(0, 6);
  // mantém extensão real
  const ext = path.extname(base);
  const stem = path.basename(base, ext);
  return `${stem}__${hash}${ext || ""}`.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function categorize(url, filename) {
  const s = (url + "|" + filename).toLowerCase();
  if (/favicon|apple-touch/.test(s)) return "icon";
  if (/logo/.test(s)) return "logo";
  if (/mascote|mascot|guara|guaraz|ave|bird/.test(s)) return "mascote";
  if (/\.svg(\?|$)/.test(s)) return "svg";
  if (/bg|background|pattern|blob|shape|curve|wave|onda/.test(s)) return "fundo";
  if (/hero|banner|capa/.test(s)) return "hero";
  if (/atraca|atraco|atracao|parque|piscin|tobog|tirole|arvor|aquatico/.test(s))
    return "atracao";
  if (/evento|festa|aniversar|corporat/.test(s)) return "evento";
  if (/\.(png|jpe?g|webp|avif|gif)(\?|$)/.test(s)) return "foto";
  if (/\.(woff2?|ttf|otf)(\?|$)/.test(s)) return "font";
  if (/\.(mp4|webm|mov)(\?|$)/.test(s)) return "video";
  return "outros";
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`[crawl] Varrendo ${PAGES.length} páginas...`);
  for (const p of PAGES) {
    const url = BASE + p;
    try {
      const html = await fetchText(url);
      const svgCount = extractFromHtml(html, url);
      console.log(`  ✓ ${p}  (+${svgCount} SVG inline)`);
    } catch (e) {
      console.log(`  ✗ ${p}  ${e.message}`);
    }
  }

  // Processa CSSs externos
  console.log(`[crawl] ${cssUrls.size} CSS externos...`);
  for (const cssUrl of cssUrls) {
    try {
      const css = await fetchText(cssUrl);
      extractFromCss(css, cssUrl);
    } catch (e) {
      console.log(`  ✗ css ${cssUrl}  ${e.message}`);
    }
  }

  // Salva SVGs inline
  for (const { file, content } of inlineSvgs) {
    await writeFile(path.join(OUT_DIR, file), content);
  }

  // Filtra URLs relevantes (ignora analytics, pixels)
  const IGNORE = [
    /google-analytics\.com/,
    /googletagmanager\.com/,
    /facebook\.com\/tr/,
    /doubleclick\.net/,
    /hotjar\.com/,
    /\.gif\?/,
    /tiktok\.com/,
  ];
  const targets = [...urls].filter(
    (u) => !IGNORE.some((re) => re.test(u))
  );

  console.log(`[crawl] Baixando ${targets.length} assets...`);
  const manifest = [];
  let ok = 0;
  let fail = 0;
  for (const u of targets) {
    const filename = fileNameFromUrl(u);
    try {
      const { buf, contentType } = await downloadBinary(u);
      await writeFile(path.join(OUT_DIR, filename), buf);
      manifest.push({
        url: u,
        file: `brand/valparaiso/raw/${filename}`,
        bytes: buf.length,
        contentType,
        categoria: categorize(u, filename),
      });
      ok++;
    } catch (e) {
      fail++;
    }
  }
  // Adiciona SVGs inline ao manifest
  for (const { file } of inlineSvgs) {
    manifest.push({
      url: "inline",
      file: `brand/valparaiso/raw/${file}`,
      categoria: "svg",
      inline: true,
    });
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(
    `[crawl] Done. ${ok} baixados · ${fail} falhas · ${inlineSvgs.length} SVG inline · manifest em ${path.relative(
      process.cwd(),
      MANIFEST
    )}`
  );

  // Breakdown por categoria
  const byCat = {};
  for (const m of manifest) byCat[m.categoria] = (byCat[m.categoria] || 0) + 1;
  console.log("[crawl] Categorias:", byCat);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
