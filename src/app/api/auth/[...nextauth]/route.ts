import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        const adminUser = process.env.ADMIN_USER;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUser || !adminPassword) return null;

        const isValidUser = credentials?.username === adminUser;
        const isValidPassword = credentials?.password === adminPassword;

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
