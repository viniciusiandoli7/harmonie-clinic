import { formatContractNumber, getContractUseByDate } from "@/lib/contractLegalCore";

type SqlClient = {
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

type ContractMetadataLike = {
  token: string;
  createdAt: Date | string;
  contractNumber?: string | null;
  validUntil?: Date | string | null;
};

/**
 * Mantém compatibilidade com bancos que ainda não receberam as colunas
 * contractNumber/validUntil. Os dois valores são determinísticos a partir
 * do token e da data original do contrato, portanto podem ser reconstruídos
 * sem alterar o documento ou gerar um novo número.
 */
export function hydrateContractMetadata<T extends ContractMetadataLike>(contract: T) {
  const createdAt = contract.createdAt instanceof Date ? contract.createdAt : new Date(contract.createdAt);
  return {
    ...contract,
    contractNumber: contract.contractNumber || formatContractNumber(contract.token, createdAt),
    validUntil: contract.validUntil || getContractUseByDate(createdAt),
  };
}

export async function contractMetadataColumnsAvailable(client: Pick<SqlClient, "$queryRawUnsafe">) {
  try {
    const rows = await client.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS "count"
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'PatientContract'
         AND column_name IN ('contractNumber', 'validUntil')`
    );
    const count = Array.isArray(rows) ? Number(rows[0]?.count || 0) : 0;
    return count >= 2;
  } catch (error) {
    console.warn("Não foi possível conferir colunas opcionais do contrato; usando modo compatível.", error);
    return false;
  }
}

/**
 * Persiste os metadados quando as colunas já existem. Se o ambiente ainda
 * estiver aguardando a migration, o contrato continua válido porque esses
 * dados podem ser reconstruídos de forma determinística.
 */
export async function persistContractMetadataIfSupported(
  client: SqlClient,
  id: string,
  contractNumber: string,
  validUntil: Date,
) {
  if (!(await contractMetadataColumnsAvailable(client))) return false;

  try {
    await client.$executeRawUnsafe(
      `UPDATE "PatientContract"
       SET "contractNumber" = $2, "validUntil" = $3, "updatedAt" = NOW()
       WHERE "id" = $1`,
      id,
      contractNumber,
      validUntil,
    );
    return true;
  } catch (error) {
    console.warn("Não foi possível persistir metadados opcionais do contrato; mantendo fallback determinístico.", error);
    return false;
  }
}
