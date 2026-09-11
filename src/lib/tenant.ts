import { currentUser } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { redirect } from "next/navigation";

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Não autenticado.");
  return user;
}

export async function requireManager() {
  const user = await requireUser();
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    throw new HttpError(403, "Você não tem permissão para essa ação.");
  }

  return user;
}

export async function requirePanelUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
