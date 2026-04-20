import { describe, it, expect } from "vitest";
import { normalizeBrPhone } from "./phone";

describe("normalizeBrPhone", () => {
  it("formata celular com DDD sem código de país", () => {
    expect(normalizeBrPhone("41999887766")).toBe("+5541999887766");
    expect(normalizeBrPhone("(41) 9 9988-7766")).toBe("+5541999887766");
  });

  it("formata fixo com DDD sem código de país (10 dígitos)", () => {
    expect(normalizeBrPhone("4133224455")).toBe("+554133224455");
  });

  it("preserva entrada já em E.164", () => {
    expect(normalizeBrPhone("+5541999887766")).toBe("+5541999887766");
  });

  it("aceita 55 sem + e adiciona", () => {
    expect(normalizeBrPhone("5541999887766")).toBe("+5541999887766");
  });

  it("rejeita vazio", () => {
    expect(() => normalizeBrPhone("")).toThrow();
  });

  it("rejeita lixo", () => {
    expect(() => normalizeBrPhone("123")).toThrow();
    expect(() => normalizeBrPhone("abcdefg")).toThrow();
  });

  it("rejeita E.164 muito curto", () => {
    expect(() => normalizeBrPhone("+12")).toThrow();
  });
});
