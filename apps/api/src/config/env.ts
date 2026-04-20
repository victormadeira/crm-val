import { z } from "zod";

/**
 * Validação de ambiente no boot. Qualquer variável obrigatória ausente
 * aborta o processo antes de qualquer request chegar.
 *
 * NUNCA referencie `process.env` direto em código de aplicação — sempre
 * injete via ConfigService que devolve este objeto tipado.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  /** Connection string Postgres com pgvector habilitado. */
  DATABASE_URL: z.string().url(),

  /** Redis (BullMQ + cache de sessão). */
  REDIS_URL: z.string().url(),

  /** JWT de acesso — curto (ex: 15m). */
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),

  /** JWT de refresh — longo (ex: 30d), armazenado em Session (hash). */
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.string().default("30d"),

  /** Chave mestra AES-GCM 256-bit em base64 (32 bytes). Usada para
   *  criptografar tokens/segredos externos (Meta Graph token, appSecret). */
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, {
      message: "ENCRYPTION_KEY deve ser 32 bytes em base64 (openssl rand -base64 32)",
    }),

  /** CORS — lista separada por vírgulas. */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),

  /** Meta Graph API — base URL e versão (sem BSP intermediário). */
  META_GRAPH_API_BASE: z.string().url().default("https://graph.facebook.com"),
  META_GRAPH_API_VERSION: z.string().default("v19.0"),

  /** Logs Pino. */
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  /** Diretório local p/ armazenar arquivos de import CSV antes do processamento. */
  IMPORT_STORAGE_DIR: z.string().default("./var/imports"),

  /** Chave Anthropic Claude — usado por nodes `ai_prompt`. Opcional: sem
   *  chave, o node levanta em runtime. */
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().default("https://api.anthropic.com"),

  /** Revenue Intelligence — localização do parque p/ previsão climática. */
  PARK_LATITUDE: z.coerce.number().default(-2.5364),
  PARK_LONGITUDE: z.coerce.number().default(-44.2056),
  PARK_TIMEZONE: z.string().default("America/Fortaleza"),
  OPEN_METEO_BASE_URL: z
    .string()
    .url()
    .default("https://api.open-meteo.com/v1/forecast"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Falha hard no boot — nunca rode com env inválido.
    // eslint-disable-next-line no-console
    console.error("[env] configuração inválida:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}
