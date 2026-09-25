import Link from "next/link";
import { auth } from "@/lib/auth";
import { MudarPasswordForm } from "@/components/mudar-password-form";
import { ExportarMeusDadosButton } from "@/components/exportar-meus-dados-button";

export default async function PerfilPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-sm px-4 py-8 md:max-w-md md:py-12">
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">O meu perfil</h1>
      <p className="mb-6 text-sm text-neutral-600">{session?.user.name}</p>

      <MudarPasswordForm />

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <p className="mb-1 text-sm font-semibold text-neutral-900">Os meus dados</p>
        <p className="mb-3 text-xs text-neutral-500">
          Descarrega tudo o que guardamos sobre ti: dados da conta, avaliações e registo de atividade.
        </p>
        <ExportarMeusDadosButton />
      </div>

      <Link href="/privacidade" className="mt-6 block text-xs text-neutral-400 underline">
        Política de Privacidade
      </Link>
    </div>
  );
}
