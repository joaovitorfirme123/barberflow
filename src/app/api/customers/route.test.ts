import { describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const requireUser = vi.hoisted(() =>
  vi.fn(async () => ({
    barbershopId: "tenant-a",
  })),
);

vi.mock("@/lib/prisma", () => ({ prisma: { customer: { findMany } } }));
vi.mock("@/lib/tenant", () => ({ requireUser }));

import { GET } from "./route";

describe("GET /api/customers", () => {
  it("scopes the query to the authenticated tenant", async () => {
    findMany.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/customers?q=joao"));

    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          barbershopId: "tenant-a",
          OR: [
            { name: { contains: "joao", mode: "insensitive" } },
            { phone: { contains: "joao" } },
          ],
        }),
      }),
    );
  });
});
