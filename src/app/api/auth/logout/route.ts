import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  const response = ok({ success: true });
  await clearSessionCookie(response);
  return response;
}
