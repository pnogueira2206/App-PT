import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="font-mono text-xs text-dim underline">
        SAIR
      </button>
    </form>
  );
}
