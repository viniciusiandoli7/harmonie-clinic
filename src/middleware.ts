import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Aqui você poderia adicionar lógicas personalizadas, 
    // como verificar se o usuário é "ADMIN" para acessar o financeiro.
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

// BLINDAGEM DE ROTAS
export const config = { 
  matcher: [
    /*
     * Protege todas as rotas, EXCETO:
     * 1. /login (Página de acesso)
     * 2. /api/auth (Necessário para o NextAuth funcionar)
     * 3. /_next (Arquivos internos do Next.js)
     * 4. /favicon.ico, /images, etc. (Arquivos estáticos)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ] 
};