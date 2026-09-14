import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentTopBar, StudentBottomNav } from "@/components/student-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <StudentTopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
}
