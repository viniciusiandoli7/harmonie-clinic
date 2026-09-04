import { redirect } from "next/navigation";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/assinar-contrato/${encodeURIComponent(token)}`);
}
