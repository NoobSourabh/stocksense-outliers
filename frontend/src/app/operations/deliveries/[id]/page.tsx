import { DeliveryDetailClient } from "./delivery-detail-client";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeliveryDetailClient deliveryId={id} />;
}
