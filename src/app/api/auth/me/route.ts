import { currentUser } from "@/lib/auth";
import { errorResponse, HttpError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Não autenticado.");

    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      barbershop: user.barbershop,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
