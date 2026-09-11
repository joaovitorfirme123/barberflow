export function normalizeSlug(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length < 3 || slug.length > 60) {
    throw new Error("Slug deve ter entre 3 e 60 caracteres");
  }

  return slug;
}
