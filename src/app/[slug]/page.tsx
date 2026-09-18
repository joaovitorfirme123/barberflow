import type { Metadata } from "next";
import { PublicProfile } from "@/components/public-profile";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { getPublicBarbershop } from "@/lib/public-barbershop";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicBarbershop(slug);
  return shop
    ? {
        title: `${shop.name} | Agendamento`,
        description: `Serviços e horários disponíveis na ${shop.name}.`,
      }
    : {};
}

export default async function SlugProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicBarbershop(slug);
  if (!shop) notFound();
  return (
    <>
      <ProductEventTracker slug={slug} event="PUBLIC_PAGE_VIEWED" />
      <PublicProfile shop={shop} />
    </>
  );
}
