import { z } from "zod";

// PostgreSQL accepts all UUID variants, including deterministic seed IDs.
export const idSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID inválido");
