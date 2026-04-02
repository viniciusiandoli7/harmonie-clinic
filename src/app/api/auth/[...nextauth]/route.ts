import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Definimos as opções de autenticação de forma tipada e robusta
export const authOptions: NextAuthOptions = {
  // 1. Chave de Segurança (O erro [NO_SECRET] morre aqui)
  secret: process.env.NEXTAUTH_SECRET,

  // 2. Estratégia de Sessão
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de sessão para a Dra. Mariana
  },

  // 3. Provedor de Credenciais (Login Privado)
  providers: [
    CredentialsProvider({
      name: "Harmonie Clinic",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        // Log de debug para o seu terminal (ajuda a ver se o .env carregou)
        console.log("--- Tentativa de Acesso Harmonie ---");
        console.log("Usuário digitado:", credentials?.username);
        console.log("Variável ADMIN_USER carregada?", !!process.env.ADMIN_USER);

        const isValidUser = credentials?.username === process.env.ADMIN_USER;
        const isValidPassword = credentials?.password === process.env.ADMIN_PASSWORD;

        if (isValidUser && isValidPassword) {
          return { 
            id: "1", 
            name: "Dra. Mariana", 
            email: "diretoria@harmonieclinic.com" 
          };
        }

        // Se chegar aqui, as credenciais estão erradas
        return null;
      }
    })
  ],

  // 4. Configurações de Páginas
  pages: {
    signIn: "/login",
    error: "/login", // Se der erro, volta pro login de luxo
  },

  // 5. Callbacks para segurança extra
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

// Exportamos os métodos necessários para o App Router do Next.js 16
export { handler as GET, handler as POST };