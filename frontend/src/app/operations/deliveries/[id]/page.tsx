import { OperationWorkspace } from "@/components/warehouse/operation-workspace";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperationWorkspace kind="deliveries" mode="detail" id={id} />;
}
