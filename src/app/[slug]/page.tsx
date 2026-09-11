import { PublicProfile } from "@/components/public-profile";
import { getPublicBarbershop } from "@/lib/public-barbershop";
import { notFound } from "next/navigation";

export default async function SlugProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicBarbershop(slug);
  if (!shop) notFound();
  return <PublicProfile shop={shop} />;
}
