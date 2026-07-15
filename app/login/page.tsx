import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <LoginForm callbackUrl={callbackUrl || "/dashboard"} />
    </main>
  );
}
