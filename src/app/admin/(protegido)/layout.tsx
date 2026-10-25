// Tudo dentro de /admin (menos /admin/entrar) passa por aqui: sem login do dono, não entra.
import { exigirDono } from "@/lib/painel";
import { signOut } from "@/auth";

export default async function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const sessao = await exigirDono();
  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-border-default px-4 py-2 text-200 text-text-subtle">
        <span>Painel · {sessao.user?.login}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/entrar" });
          }}
        >
          <button className="rounded-full border border-border-default px-3 py-1 font-semibold">Sair</button>
        </form>
      </div>
      {children}
    </>
  );
}
