import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const normalize = (value?: string | null) => value?.trim() ?? "";

const buildAllowedValues = (primary?: string, fallback?: string) => {
  const values = [primary, fallback]
    .map((value) => normalize(value))
    .filter(Boolean);

  return new Set(values);
};

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
        const allowedUsers = buildAllowedValues(
          process.env.ADMIN_USER,
          "admin_harmonie",
        );
        const allowedPasswords = buildAllowedValues(
          process.env.ADMIN_PASSWORD,
          "14032004",
        );

        const username = normalize(credentials?.username);
        const password = normalize(credentials?.password);

        const isValidUser = allowedUsers.has(username);
        const isValidPassword = allowedPasswords.has(password);

        if (!isValidUser || !isValidPassword) return null;

        return {
          id: "mariana-admin",
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
