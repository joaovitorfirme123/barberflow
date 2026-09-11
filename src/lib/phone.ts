export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Telefone inválido");
  }

  return digits;
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
