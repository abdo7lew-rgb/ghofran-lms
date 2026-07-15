import { requireSession } from "@/lib/auth/guards";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell user={{ name: session.user.name ?? "", role: session.user.role }}>
      {children}
    </AppShell>
  );
}
