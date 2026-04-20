import { describe, it, expect } from "vitest";
import { applyTenantScope } from "./tenant-scope";

const T_A = "11111111-1111-1111-1111-111111111111";
const T_B = "22222222-2222-2222-2222-222222222222";

describe("applyTenantScope — bypass", () => {
  it("bypassa models fora da whitelist", () => {
    const d = applyTenantScope(
      "Tenant",
      "findMany",
      { where: {} },
      { tenantId: T_A }
    );
    expect(d.kind).toBe("bypass");
  });

  it("bypassa quando crossTenant=true (job sistêmico)", () => {
    const d = applyTenantScope(
      "Lead",
      "findMany",
      { where: {} },
      { tenantId: "__system__", crossTenant: true }
    );
    expect(d.kind).toBe("bypass");
  });

  it("bypassa quando model ausente (raw query)", () => {
    const d = applyTenantScope(undefined, "findMany", {}, { tenantId: T_A });
    expect(d.kind).toBe("bypass");
  });
});

describe("applyTenantScope — fail-closed", () => {
  it("lança erro se tenant-scoped sem TenantContext", () => {
    expect(() =>
      applyTenantScope("Lead", "findMany", { where: {} }, undefined)
    ).toThrow(/TenantContext/);
  });
});

describe("applyTenantScope — writes com data", () => {
  it("injeta tenantId em create.data", () => {
    const d = applyTenantScope(
      "Lead",
      "create",
      { data: { name: "João" } },
      { tenantId: T_A }
    );
    expect(d.kind).toBe("apply");
    if (d.kind !== "apply") return;
    expect((d.args.data as Record<string, unknown>).tenantId).toBe(T_A);
  });

  it("injeta tenantId em cada item de createMany.data", () => {
    const d = applyTenantScope(
      "Lead",
      "createMany",
      { data: [{ name: "A" }, { name: "B" }] },
      { tenantId: T_A }
    );
    expect(d.kind).toBe("apply");
    if (d.kind !== "apply") return;
    const rows = d.args.data as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.tenantId === T_A)).toBe(true);
  });

  it("rejeita create.data.tenantId divergente (cross-tenant write)", () => {
    expect(() =>
      applyTenantScope(
        "Lead",
        "create",
        { data: { name: "X", tenantId: T_B } },
        { tenantId: T_A }
      )
    ).toThrow(/tenantId/);
  });

  it("aceita create.data.tenantId se bater com contexto", () => {
    const d = applyTenantScope(
      "Lead",
      "create",
      { data: { name: "X", tenantId: T_A } },
      { tenantId: T_A }
    );
    expect(d.kind).toBe("apply");
  });

  it("rejeita item divergente em createMany array", () => {
    expect(() =>
      applyTenantScope(
        "Lead",
        "createMany",
        { data: [{ name: "A" }, { name: "B", tenantId: T_B }] },
        { tenantId: T_A }
      )
    ).toThrow(/tenantId/);
  });
});

describe("applyTenantScope — reads/writes com where", () => {
  it("injeta tenantId em findMany.where vazio", () => {
    const d = applyTenantScope(
      "Lead",
      "findMany",
      {},
      { tenantId: T_A }
    );
    expect(d.kind).toBe("apply");
    if (d.kind !== "apply") return;
    expect((d.args.where as Record<string, unknown>).tenantId).toBe(T_A);
  });

  it("preserva outros filtros do where", () => {
    const d = applyTenantScope(
      "Lead",
      "findMany",
      { where: { stageId: "s1", name: { contains: "João" } } },
      { tenantId: T_A }
    );
    if (d.kind !== "apply") throw new Error("expected apply");
    const w = d.args.where as Record<string, unknown>;
    expect(w.tenantId).toBe(T_A);
    expect(w.stageId).toBe("s1");
  });

  it("rejeita where.tenantId divergente (cross-tenant read)", () => {
    expect(() =>
      applyTenantScope(
        "Lead",
        "findMany",
        { where: { tenantId: T_B } },
        { tenantId: T_A }
      )
    ).toThrow(/where.tenantId/);
  });

  it("injeta tenantId em updateMany.where e em delete.where", () => {
    const up = applyTenantScope(
      "Lead",
      "updateMany",
      { where: { stageId: "s1" }, data: { stageId: "s2" } },
      { tenantId: T_A }
    );
    if (up.kind !== "apply") throw new Error();
    expect((up.args.where as Record<string, unknown>).tenantId).toBe(T_A);

    const del = applyTenantScope(
      "Lead",
      "delete",
      { where: { id: "lead-1" } },
      { tenantId: T_A }
    );
    if (del.kind !== "apply") throw new Error();
    expect((del.args.where as Record<string, unknown>).tenantId).toBe(T_A);
  });
});

describe("applyTenantScope — upsert", () => {
  it("aplica escopo em where, update e create", () => {
    const d = applyTenantScope(
      "Lead",
      "upsert",
      {
        where: { id: "lead-1" },
        create: { name: "J" },
        update: { name: "J2" },
      },
      { tenantId: T_A }
    );
    if (d.kind !== "apply") throw new Error();
    expect((d.args.where as Record<string, unknown>).tenantId).toBe(T_A);
    expect((d.args.create as Record<string, unknown>).tenantId).toBe(T_A);
  });

  it("rejeita upsert.create.tenantId divergente", () => {
    expect(() =>
      applyTenantScope(
        "Lead",
        "upsert",
        {
          where: { id: "lead-1" },
          create: { name: "J", tenantId: T_B },
          update: {},
        },
        { tenantId: T_A }
      )
    ).toThrow(/create.tenantId/);
  });
});

describe("applyTenantScope — coverage dos models", () => {
  const scopedModels = [
    "User",
    "Lead",
    "WaAccount",
    "WaConversation",
    "WaMessage",
    "AutomationFlow",
    "LandingPage",
    "PolicyVersion",
    "AuditLog",
  ];

  it("aplica escopo em todos os models tenant-scoped da lista", () => {
    for (const m of scopedModels) {
      const d = applyTenantScope(m, "findMany", {}, { tenantId: T_A });
      expect(d.kind, `model ${m} deveria ser scoped`).toBe("apply");
    }
  });
});
