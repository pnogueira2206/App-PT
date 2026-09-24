import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="text-xs text-neutral-400 underline">
        Sair
      </button>
    </form>
  );
}
