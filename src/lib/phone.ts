import { HttpError } from "@/lib/http";

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  if (!normalized.startsWith("55") || normalized.length < 12 || normalized.length > 13) {
    throw new HttpError(400, "Telefone inválido");
  }

  return normalized;
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
