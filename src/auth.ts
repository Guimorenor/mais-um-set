// Fechadura do painel: login com GitHub, e só a conta do Moreno entra.
// As chaves (AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET) ficam no cofre da Vercel.
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Número da conta Guimorenor no GitHub. Usamos o número (e não o nome),
// porque o nome de usuário pode ser trocado e o número nunca muda.
export const DONO_GITHUB_ID = "345960580";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  pages: { signIn: "/admin/entrar", error: "/admin/entrar" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 }, // login vale 12 h
  callbacks: {
    // Na porta: qualquer conta que não seja a do dono é recusada
    signIn: ({ profile }) => String(profile?.id ?? "") === DONO_GITHUB_ID,
    jwt: ({ token, profile }) => {
      if (profile) {
        token.githubId = String(profile.id);
        token.login = String(profile.login ?? "");
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.githubId = token.githubId as string | undefined;
      session.user.login = token.login as string | undefined;
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    githubId?: string;
    login?: string;
  }
}
