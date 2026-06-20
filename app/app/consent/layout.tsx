// Guards /consent without modifying the existing page.tsx.
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
