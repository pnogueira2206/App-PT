import { auth } from "@/lib/auth";
import { MudarPasswordForm } from "@/components/mudar-password-form";

export default async function PerfilPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">O meu perfil</h1>
      <p className="mb-4 text-sm text-neutral-600">{session?.user.name}</p>
      <MudarPasswordForm />
    </div>
  );
}
