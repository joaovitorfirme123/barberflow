import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/tenant";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const result = await prisma.scheduleBlock.deleteMany({
      where: { id, barbershopId: user.barbershopId },
    });
    if (!result.count) throw new HttpError(404, "Bloqueio não encontrado.");
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
