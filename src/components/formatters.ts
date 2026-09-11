export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function money(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
