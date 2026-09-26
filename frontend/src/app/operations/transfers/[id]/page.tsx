import { OperationWorkspace } from "@/components/warehouse/operation-workspace";

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperationWorkspace kind="transfers" mode="detail" id={id} />;
}
