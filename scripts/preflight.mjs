import fs from "node:fs";
import path from "node:path";

const requiredSourceFiles = [
  "prisma/schema.prisma",
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/app/api/system/repair/route.ts",
];

const missingFiles = requiredSourceFiles.filter((file) => !fs.existsSync(path.resolve(file)));
if (missingFiles.length) {
  console.error(`Arquivos obrigatórios ausentes: ${missingFiles.join(", ")}`);
  process.exit(1);
}

const migrationRoot = path.resolve("prisma/migrations");
const migrations = fs.existsSync(migrationRoot)
  ? fs.readdirSync(migrationRoot).filter((name) => fs.existsSync(path.join(migrationRoot, name, "migration.sql")))
  : [];

if (!migrations.length) {
  console.error("Nenhuma migration do Prisma encontrada.");
  process.exit(1);
}

const authSource = fs.readFileSync(path.resolve("src/app/api/auth/[...nextauth]/route.ts"), "utf8");
for (const forbidden of ["14032004", "admin_harmonie", '"admin123"']) {
  if (authSource.includes(forbidden)) {
    console.error("Credencial padrão detectada no código de autenticação.");
    process.exit(1);
  }
}

console.log(`Preflight OK: ${migrations.length} migrations encontradas e autenticação sem credenciais padrão.`);
