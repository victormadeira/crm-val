import { Inject, Injectable } from "@nestjs/common";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";

/**
 * CryptoService — AES-256-GCM com derivação de chave por tenant.
 *
 *  - Chave mestra vem de ENCRYPTION_KEY (32 bytes base64, validada no boot).
 *  - Para cada tenant, a chave efetiva é HMAC-SHA256(master, tenantId).
 *    Isso garante que comprometer um tenant não expõe os outros, e que
 *    rotação da chave mestra re-deriva todos os tenants atomicamente.
 *  - Ciphertext serializado como "v1:<iv_b64>:<authTag_b64>:<ct_b64>".
 *    O prefixo "v1:" existe pra permitir rotação de algoritmo depois
 *    sem precisar migrar dados legados destrutivamente.
 */
@Injectable()
export class CryptoService {
  private readonly master: Buffer;

  constructor(@Inject(ENV_TOKEN) env: Env) {
    this.master = Buffer.from(env.ENCRYPTION_KEY, "base64");
    if (this.master.length !== 32) {
      throw new Error("ENCRYPTION_KEY inválida: esperado 32 bytes");
    }
  }

  /** Deriva a chave efetiva de um tenant (HKDF-like via HMAC-SHA256). */
  private tenantKey(tenantId: string): Buffer {
    return createHmac("sha256", this.master).update(tenantId).digest();
  }

  /** Criptografa uma string UTF-8. Retorna a forma serializada. */
  encryptForTenant(tenantId: string, plaintext: string): string {
    const key = this.tenantKey(tenantId);
    const iv = randomBytes(12); // 96-bit — padrão GCM
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
  }

  /** Decifra uma string retornada por encryptForTenant. */
  decryptForTenant(tenantId: string, serialized: string): string {
    const [version, ivB64, tagB64, ctB64] = serialized.split(":");
    if (version !== "v1") {
      throw new Error(`ciphertext versão não suportada: ${version}`);
    }
    if (!ivB64 || !tagB64 || !ctB64) {
      throw new Error("ciphertext malformado");
    }
    const key = this.tenantKey(tenantId);
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  }

  /**
   * Valida X-Hub-Signature-256 do webhook Meta.
   *   signatureHeader: "sha256=<hex>"
   *   rawBody: Buffer exato recebido (NÃO reserializar JSON)
   *   appSecret: appSecret do WaAccount, já decifrado
   */
  verifyMetaSignature(
    signatureHeader: string | undefined,
    rawBody: Buffer,
    appSecret: string
  ): boolean {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
    const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
    const expected = createHmac("sha256", appSecret).update(rawBody).digest();
    if (received.length !== expected.length) return false;
    return timingSafeEqual(received, expected);
  }

  /** Hash determinístico pra refresh tokens (não precisa ser reversível). */
  hashToken(raw: string): string {
    return createHmac("sha256", this.master).update(raw).digest("base64url");
  }

  /** Geração de token aleatório de alta entropia (256 bits, base64url). */
  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString("base64url");
  }
}
