import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">CFA Avaliações</h1>
      <p className="mb-4 text-sm text-neutral-600">Inicia sessão para continuar.</p>
      <LoginForm />
    </div>
  );
}
