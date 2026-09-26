import { OperationWorkspace } from "@/components/warehouse/operation-workspace";
export default async function AdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperationWorkspace kind="adjustments" mode="detail" id={id} />;
}
