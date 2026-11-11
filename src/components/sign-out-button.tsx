import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="font-mono text-xs tracking-wider text-neutral-400 underline">
        SAIR
      </button>
    </form>
  );
}
