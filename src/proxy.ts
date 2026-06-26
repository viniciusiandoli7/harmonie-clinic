import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Protege o sistema interno e libera somente login, autenticação,
     * links públicos de assinatura e arquivos estáticos da pasta public.
     */
    "/((?!login|api/auth|api/public|api/contracts/[^/]+/sign|api/evolution-sessions/[^/]+/sign|consent|contracts|assinar|assinar-contrato|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif|avif|css|js|txt|xml|json|woff|woff2|ttf)$).*)",
  ],
};
