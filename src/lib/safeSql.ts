type ExecuteLike = {
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

type QueryLike = ExecuteLike & {
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
};

export async function safeExecute(client: ExecuteLike, query: string, ...values: any[]) {
  try {
    return await client.$executeRawUnsafe(query, ...values);
  } catch (error) {
    console.warn("SQL de ajuste ignorado:", query.replace(/\s+/g, " ").slice(0, 180), error);
    return null;
  }
}

export async function safeQuery<T = any>(client: QueryLike, query: string, ...values: any[]): Promise<T[]> {
  try {
    const rows = await client.$queryRawUnsafe(query, ...values);
    return Array.isArray(rows) ? rows as T[] : [];
  } catch (error) {
    console.warn("SQL de consulta ignorado:", query.replace(/\s+/g, " ").slice(0, 180), error);
    return [];
  }
}
