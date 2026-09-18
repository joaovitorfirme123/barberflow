import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";
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
        title: `Agendar | ${shop.name}`,
        description: `Escolha serviço, profissional, data e horário na ${shop.name}.`,
      }
    : {};
}

export default async function SlugBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicBarbershop(slug);
  if (!shop) notFound();
  return (
    <>
      <ProductEventTracker slug={slug} event="BOOKING_STARTED" />
      <BookingFlow shop={shop} />
    </>
  );
}
