import { ProfessionalsPanel } from "@/components/professionals-panel";
import { requirePanelUser } from "@/lib/tenant";

export default async function ProfessionalsPage() {
  const user = await requirePanelUser();
  return (
    <ProfessionalsPanel
      tenant={{
        id: user.barbershop.id,
        name: user.barbershop.name,
        slug: user.barbershop.slug,
        timezone: user.barbershop.timezone,
        role: user.role,
        canManage: user.role === "OWNER" || user.role === "ADMIN",
      }}
    />
  );
}
