import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TrainerNav } from "@/components/trainer-nav";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "TRAINER") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <TrainerNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
