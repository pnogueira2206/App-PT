import { AdminGate } from "@/components/admin/admin-gate";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminGate>{children}</AdminGate>;
}
