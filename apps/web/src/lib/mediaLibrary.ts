/**
 * Biblioteca de mídia do builder — uploads persistem em IndexedDB como Blob,
 * com deduplicação por hash SHA-256. URLs são Blob URLs criadas sob demanda.
 *
 * DB schema:
 *   store "assets":  keyPath "id"
 *     { id, hash, kind, name, mime, size, width, height, duration, addedAt }
 *   store "blobs":   keyPath "id"
 *     { id, blob }   (1:1 com assets)
 *
 * Índice "assets.byHash" permite dedupe: se o hash já existe, retornamos o id existente.
 */

export type MediaKind = "image" | "video";

export interface MediaAsset {
  id: string;
  hash: string;
  kind: MediaKind;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  addedAt: number;
}

const DB_NAME = "valparaiso_media_v1";
const STORE_ASSETS = "assets";
const STORE_BLOBS = "blobs";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        const s = db.createObjectStore(STORE_ASSETS, { keyPath: "id" });
        s.createIndex("byHash", "hash", { unique: false });
        s.createIndex("byAddedAt", "addedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function sha256(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function kindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

function getDimensions(
  file: Blob,
  kind: MediaKind
): Promise<{ width?: number; height?: number; duration?: number }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    if (kind === "image") {
      const img = new Image();
      img.onload = () => {
        const out = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(out);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      img.src = url;
    } else {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const out = {
          width: v.videoWidth,
          height: v.videoHeight,
          duration: v.duration,
        };
        URL.revokeObjectURL(url);
        resolve(out);
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      v.src = url;
    }
  });
}

function tx<T>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (t: IDBTransaction) => Promise<T> | T
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(stores, mode);
        let result: T;
        t.oncomplete = () => resolve(result);
        t.onabort = () => reject(t.error);
        t.onerror = () => reject(t.error);
        Promise.resolve(fn(t)).then((r) => (result = r), reject);
      })
  );
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Adiciona um arquivo à biblioteca. Retorna o asset (novo ou existente via dedupe). */
export async function addMedia(file: File): Promise<MediaAsset> {
  const kind = kindFromMime(file.type);
  if (!kind) throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
  const hash = await sha256(file);

  // Dedupe: se o hash já existe, retorna o asset existente.
  const existing = await tx([STORE_ASSETS], "readonly", async (t) => {
    const idx = t.objectStore(STORE_ASSETS).index("byHash");
    return reqToPromise(idx.get(hash));
  });
  if (existing) return existing as MediaAsset;

  const dims = await getDimensions(file, kind);
  const asset: MediaAsset = {
    id: crypto.randomUUID(),
    hash,
    kind,
    name: file.name,
    mime: file.type,
    size: file.size,
    width: dims.width,
    height: dims.height,
    duration: dims.duration,
    addedAt: Date.now(),
  };

  await tx([STORE_ASSETS, STORE_BLOBS], "readwrite", async (t) => {
    t.objectStore(STORE_ASSETS).put(asset);
    t.objectStore(STORE_BLOBS).put({ id: asset.id, blob: file });
  });

  return asset;
}

export async function listMedia(filter?: MediaKind): Promise<MediaAsset[]> {
  return tx([STORE_ASSETS], "readonly", async (t) => {
    const all = await reqToPromise(t.objectStore(STORE_ASSETS).getAll());
    const list = all as MediaAsset[];
    const out = filter ? list.filter((a) => a.kind === filter) : list;
    return out.sort((a, b) => b.addedAt - a.addedAt);
  });
}

export async function getMedia(id: string): Promise<MediaAsset | undefined> {
  return tx([STORE_ASSETS], "readonly", async (t) =>
    reqToPromise(t.objectStore(STORE_ASSETS).get(id))
  );
}

/** Cache em memória de Blob URLs para não recriar a cada render. */
const urlCache = new Map<string, string>();

export async function getMediaUrl(id: string): Promise<string | undefined> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const record = await tx([STORE_BLOBS], "readonly", async (t) =>
    reqToPromise(t.objectStore(STORE_BLOBS).get(id))
  );
  if (!record) return undefined;
  const url = URL.createObjectURL((record as { id: string; blob: Blob }).blob);
  urlCache.set(id, url);
  return url;
}

export async function deleteMedia(id: string): Promise<void> {
  const cached = urlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    urlCache.delete(id);
  }
  await tx([STORE_ASSETS, STORE_BLOBS], "readwrite", async (t) => {
    t.objectStore(STORE_ASSETS).delete(id);
    t.objectStore(STORE_BLOBS).delete(id);
  });
}

/** Converte uma URL "lib://<id>" em Blob URL resolvível no runtime. */
export const LIB_URL_PREFIX = "lib://";

export function isLibUrl(src: string | undefined): src is string {
  return !!src && src.startsWith(LIB_URL_PREFIX);
}

export function libUrlId(src: string): string {
  return src.slice(LIB_URL_PREFIX.length);
}

export function libUrlFor(id: string): string {
  return `${LIB_URL_PREFIX}${id}`;
}

/**
 * Resolve uma src para exibição: se for lib://, retorna a Blob URL;
 * caso contrário devolve a própria string (URL normal / data URL).
 */
export async function resolveMediaSrc(src: string): Promise<string> {
  if (!isLibUrl(src)) return src;
  const id = libUrlId(src);
  const url = await getMediaUrl(id);
  return url ?? src;
}
