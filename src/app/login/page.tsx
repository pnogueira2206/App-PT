import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 md:max-w-md md:py-24">
      <h1 className="mb-1 text-lg font-semibold text-neutral-100">CFA Avaliações</h1>
      <p className="mb-4 text-sm text-muted">Inicia sessão para continuar.</p>
      <LoginForm />
      <Link href="/privacidade" className="mt-6 block text-center text-xs text-dim underline">
        Política de Privacidade
      </Link>
    </div>
  );
}
