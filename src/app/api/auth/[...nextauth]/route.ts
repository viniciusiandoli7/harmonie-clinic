import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const normalize = (value?: string | null) => value?.trim() ?? "";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Mariana Thomaz Carmona",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const configuredUser = normalize(process.env.ADMIN_USER);
        const configuredPassword = normalize(process.env.ADMIN_PASSWORD);

        // Nunca usa credenciais padrão em produção. Se o ambiente não estiver
        // configurado, o login é negado até ADMIN_USER e ADMIN_PASSWORD existirem.
        if (!configuredUser || !configuredPassword) {
          console.error("Login administrativo não configurado: defina ADMIN_USER e ADMIN_PASSWORD.");
          return null;
        }

        const username = normalize(credentials?.username);
        const password = normalize(credentials?.password);

        if (username !== configuredUser || password !== configuredPassword) return null;

        return {
          id: "clinic-admin",
          name: "Dra. Mariana",
          email: "diretoria@marianathomazcarmona.com",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
