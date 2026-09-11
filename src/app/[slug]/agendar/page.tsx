import { BookingFlow } from "@/components/booking-flow";
import { getPublicBarbershop } from "@/lib/public-barbershop";
import { notFound } from "next/navigation";

export default async function SlugBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicBarbershop(slug);
  if (!shop) notFound();
  return <BookingFlow shop={shop} />;
}
