import { describe, expect, it } from "vitest";

import { normalizePhone, whatsappLink } from "./phone";

describe("Brazilian phone rules", () => {
  it("adds the country code to local mobile numbers", () => {
    expect(normalizePhone("(11) 99999-9999")).toBe("5511999999999");
  });

  it("keeps a normalized Brazilian number", () => {
    expect(normalizePhone("5511999999999")).toBe("5511999999999");
  });

  it("builds a WhatsApp URL with the normalized recipient", () => {
    expect(whatsappLink("(11) 99999-9999", "Olá")).toContain("wa.me/5511999999999");
  });
});
