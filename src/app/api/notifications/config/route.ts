import { errorResponse, ok } from "@/lib/http";
import { pushConfigured, pushPublicKey } from "@/lib/push";
import { requireUser } from "@/lib/tenant";

export async function GET() {
  try {
    await requireUser();
    return ok({ configured: pushConfigured(), publicKey: pushPublicKey() });
  } catch (error) {
    return errorResponse(error);
  }
}
