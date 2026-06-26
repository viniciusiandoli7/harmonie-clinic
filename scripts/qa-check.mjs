import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const app = path.join(src, "app");
const apiRoot = path.join(app, "api");
const publicDir = path.join(root, "public");
const errors = [];
const warnings = [];

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");
const walk = (dir, predicate = () => true) => {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
};

function normalizeImport(fromFile, spec) {
  if (spec.startsWith("@/")) return path.join(src, spec.slice(2));
  if (spec.startsWith(".")) return path.resolve(path.dirname(fromFile), spec);
  return null;
}

function hasModule(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.d.ts`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return candidates.some(exists);
}

function routeMatches(routeParts, refParts) {
  if (routeParts.length !== refParts.length) return false;
  return routeParts.every((part, i) => part === refParts[i] || /^\[\.\.\..+\]$/.test(part) || /^\[[^\]]+\]$/.test(part));
}

function stripTemplateSegments(ref) {
  return ref.replace(/\$\{[^}]+\}/g, "__DYN__").split("?")[0].replace(/^\//, "");
}

function collectRoutes(base, filename) {
  return walk(base, (file) => path.basename(file) === filename).map((file) =>
    path.relative(base, path.dirname(file)).split(path.sep).filter(Boolean)
  );
}

const codeFiles = walk(src, (file) => /\.(ts|tsx|css)$/.test(file));

// 1. Estrutura essencial.
for (const required of [
  "package.json",
  "prisma/schema.prisma",
  "src/app/layout.tsx",
  "src/app/login/page.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/app/api/patients/route.ts",
  "src/app/api/patients/[id]/route.ts",
]) {
  if (!exists(path.join(root, required))) errors.push(`Arquivo essencial ausente: ${required}`);
}

// 2. Imports locais quebrados.
for (const file of codeFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
  const text = read(file);
  const importRegex = /import(?:\s+type)?[\s\S]*?from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = importRegex.exec(text))) {
    const spec = match[1] || match[2];
    const base = normalizeImport(file, spec);
    if (base && !hasModule(base)) errors.push(`Import local quebrado em ${path.relative(root, file)}: ${spec}`);
  }
}

// 3. Rotas API chamadas pelo front que não existem.
const apiRoutes = collectRoutes(apiRoot, "route.ts");
for (const file of codeFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
  const text = read(file);
  const fetchRegex = /fetch\(\s*([`"'])(\/api\/[^`"']+)\1/g;
  let match;
  while ((match = fetchRegex.exec(text))) {
    const parts = stripTemplateSegments(match[2]).split("/").slice(1);
    if (!apiRoutes.some((route) => routeMatches(route, parts))) {
      errors.push(`Fetch aponta para API inexistente em ${path.relative(root, file)}: ${match[2]}`);
    }
  }
}

// 4. Links internos para páginas que não existem.
const pageRoutes = collectRoutes(app, "page.tsx");
for (const file of codeFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
  const text = read(file);
  const hrefRegex = /(?:href=|router\.push\(|router\.replace\()\s*[{]?\s*[`"'](\/(?!api|_next|favicon)[^`"'#?]+)/g;
  let match;
  while ((match = hrefRegex.exec(text))) {
    const normalized = stripTemplateSegments(match[1]);
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length && !pageRoutes.some((route) => routeMatches(route, parts))) {
      errors.push(`Link interno aponta para página inexistente em ${path.relative(root, file)}: ${match[1]}`);
    }
  }
}

// 5. Assets públicos referenciados e inexistentes.
for (const file of codeFiles) {
  const text = read(file);
  const assetRegex = /["'](\/[^"']+\.(?:png|jpg|jpeg|webp|svg|ico|gif|avif))["']/g;
  let match;
  while ((match = assetRegex.exec(text))) {
    const publicAsset = path.join(publicDir, match[1].slice(1));
    const appAsset = path.join(app, match[1].slice(1));
    if (!exists(publicAsset) && !exists(appAsset)) {
      errors.push(`Asset inexistente em ${path.relative(root, file)}: ${match[1]}`);
    }
  }
}

// 6. Prisma: modelos duplicados, campos duplicados e usos de prisma.<model> inexistentes.
const schemaPath = path.join(root, "prisma/schema.prisma");
if (exists(schemaPath)) {
  const schema = read(schemaPath);
  const models = new Map();
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = modelRegex.exec(schema))) {
    const [, modelName, body] = match;
    if (models.has(modelName)) errors.push(`Modelo Prisma duplicado: ${modelName}`);
    const fields = new Set();
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
      const [field] = line.split(/\s+/);
      if (/^[A-Za-z_]\w*$/.test(field)) {
        if (fields.has(field)) errors.push(`Campo duplicado no Prisma ${modelName}.${field}`);
        fields.add(field);
      }
    }
    models.set(modelName, fields);
  }
  const clientModels = new Set([...models.keys()].map((name) => `${name[0].toLowerCase()}${name.slice(1)}`));
  for (const file of codeFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
    const text = read(file);
    const prismaRegex = /prisma\.(\w+)/g;
    let use;
    while ((use = prismaRegex.exec(text))) {
      const model = use[1];
      if (!model.startsWith("$") && !clientModels.has(model)) {
        errors.push(`Uso de prisma.${model} sem modelo correspondente em ${path.relative(root, file)}`);
      }
    }
  }
}

// 7. Middleware precisa liberar páginas públicas de assinatura.
const proxyPath = path.join(src, "proxy.ts");
if (exists(proxyPath)) {
  const proxy = read(proxyPath);
  for (const token of ["api/public", "consent", "contracts", "assinar", "assinar-contrato", "api/evolution-sessions/[^/]+/sign"]) {
    if (!proxy.includes(token)) warnings.push(`Verificar matcher público ausente ou diferente: ${token}`);
  }
}

// 8. package.json não deve rodar Prisma automaticamente no install.
const pkg = JSON.parse(read(path.join(root, "package.json")));
if (pkg.scripts?.postinstall) errors.push("Remova postinstall com prisma generate para evitar erro antes do .env estar pronto.");


// 9. Evita dependência de internet no build por next/font/google.
for (const file of codeFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
  const text = read(file);
  if (text.includes('next/font/google')) {
    errors.push(`Uso de next/font/google em ${path.relative(root, file)} pode quebrar build sem internet. Use CSS/local fallback.`);
  }
}

// 10. Rotas internas de API devem exigir sessão.
for (const routeFile of walk(apiRoot, (file) => path.basename(file) === 'route.ts')) {
  const rel = path.relative(root, routeFile).replace(/\\/g, '/');
  const isPublic =
    rel.includes('/api/auth/') ||
    rel.includes('/api/public/') ||
    rel.includes('/api/contracts/[token]/sign/') ||
    rel.includes('/api/evolution-sessions/[id]/sign/');

  if (!isPublic && !read(routeFile).includes('getServerSession')) {
    errors.push(`Rota interna sem autenticação explícita: ${rel}`);
  }
}

// 11. Evita .env local apontando para banco placeholder antigo.
for (const envFile of ['.env', '.env.local']) {
  const envPath = path.join(root, envFile);
  if (exists(envPath)) {
    const envText = read(envPath);
    if (envText.includes('mariana_clinic')) {
      errors.push(`${envFile} aponta para mariana_clinic. Neste setup local, use o banco harmonie.`);
    }
  }
}

if (errors.length || warnings.length) {
  if (errors.length) {
    console.error("QA encontrou problemas bloqueantes:\n" + errors.map((e) => `- ${e}`).join("\n"));
  }
  if (warnings.length) {
    console.warn("\nAvisos de QA:\n" + warnings.map((w) => `- ${w}`).join("\n"));
  }
  process.exit(errors.length ? 1 : 0);
}

console.log("QA OK: imports, rotas, assets, schema Prisma e estrutura principal verificados.");
