import { describe, expect, it } from "vitest";

import { normalizeSlug } from "./slug";

describe("public slugs", () => {
  it("normalizes names for public URLs", () => {
    expect(normalizeSlug("Barbearia São João")).toBe("barbearia-sao-joao");
  });

  it("rejects application routes", () => {
    expect(() => normalizeSlug("painel")).toThrow("reservado");
    expect(() => normalizeSlug("login")).toThrow("reservado");
  });
});
