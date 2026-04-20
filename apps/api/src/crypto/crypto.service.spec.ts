import { describe, it, expect, beforeEach } from "vitest";
import { randomBytes, createHmac } from "node:crypto";
import { CryptoService } from "./crypto.service";
import type { Env } from "../config/env";

function makeService(): CryptoService {
  const env = {
    ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  } as Env;
  return new CryptoService(env);
}

describe("CryptoService", () => {
  let svc: CryptoService;

  beforeEach(() => {
    svc = makeService();
  });

  it("encrypts and decrypts roundtrip for the same tenant", () => {
    const tenant = "tenant-A";
    const plain = "Graph API access token 123";
    const ct = svc.encryptForTenant(tenant, plain);
    expect(ct.startsWith("v1:")).toBe(true);
    expect(svc.decryptForTenant(tenant, ct)).toBe(plain);
  });

  it("produces different ciphertexts for the same plaintext (IV random)", () => {
    const tenant = "tenant-A";
    const a = svc.encryptForTenant(tenant, "same");
    const b = svc.encryptForTenant(tenant, "same");
    expect(a).not.toEqual(b);
  });

  it("fails to decrypt across tenants (isolamento)", () => {
    const ct = svc.encryptForTenant("tenant-A", "secret");
    expect(() => svc.decryptForTenant("tenant-B", ct)).toThrow();
  });

  it("rejects tampered auth tag", () => {
    const ct = svc.encryptForTenant("t", "payload");
    const [v, iv, tag, data] = ct.split(":");
    const flipped = Buffer.from(tag, "base64");
    flipped[0] ^= 0xff;
    const bad = `${v}:${iv}:${flipped.toString("base64")}:${data}`;
    expect(() => svc.decryptForTenant("t", bad)).toThrow();
  });

  it("rejects unsupported ciphertext version", () => {
    expect(() => svc.decryptForTenant("t", "v2:aaa:bbb:ccc")).toThrow(/versão/);
  });

  it("rejects malformed ciphertext", () => {
    expect(() => svc.decryptForTenant("t", "v1:only-one-part")).toThrow();
  });

  it("verifies Meta webhook HMAC signature correctly", () => {
    const appSecret = "meta-app-secret-xyz";
    const body = Buffer.from(JSON.stringify({ entry: [{ id: "1" }] }));
    const sig =
      "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");
    expect(svc.verifyMetaSignature(sig, body, appSecret)).toBe(true);
  });

  it("rejects wrong signature", () => {
    const body = Buffer.from("abc");
    const sig = "sha256=" + createHmac("sha256", "wrong").update(body).digest("hex");
    expect(svc.verifyMetaSignature(sig, body, "right")).toBe(false);
  });

  it("rejects missing or malformed signature header", () => {
    const body = Buffer.from("abc");
    expect(svc.verifyMetaSignature(undefined, body, "s")).toBe(false);
    expect(svc.verifyMetaSignature("md5=abc", body, "s")).toBe(false);
  });

  it("hashToken is deterministic for same input/master", () => {
    const a = svc.hashToken("abc");
    const b = svc.hashToken("abc");
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(30);
  });

  it("randomToken returns distinct high-entropy values", () => {
    const a = svc.randomToken();
    const b = svc.randomToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it("fails hard with invalid master key length", () => {
    expect(
      () =>
        new CryptoService({
          ENCRYPTION_KEY: Buffer.from("short").toString("base64"),
        } as Env)
    ).toThrow(/ENCRYPTION_KEY/);
  });
});
