import { OperationWorkspace } from "@/components/warehouse/operation-workspace";
export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperationWorkspace kind="receipts" mode="detail" id={id} />;
}
