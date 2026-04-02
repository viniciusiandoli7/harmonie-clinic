import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // Aqui forçamos a leitura e garantimos que o NextAuth veja o segredo
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Harmonie",
      credentials: {
        username: { type: "text" },
        password: { type: "password" }
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USER &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Dra. Mariana" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
};