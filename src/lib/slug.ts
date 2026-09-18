import { HttpError } from "@/lib/http";

const RESERVED_SLUGS = new Set([
  "api",
  "barbearia",
  "cadastro",
  "dashboard",
  "login",
  "painel",
  "privacidade",
  "termos",
]);

export function normalizeSlug(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length < 3 || slug.length > 60) {
    throw new HttpError(400, "Slug deve ter entre 3 e 60 caracteres");
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new HttpError(400, "Esse endereço é reservado. Escolha outro link público.");
  }

  return slug;
}
