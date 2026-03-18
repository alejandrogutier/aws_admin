import { getLoginUrl } from "@/lib/auth/cognito";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const loginUrl = getLoginUrl();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold text-lg">
            AWS
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AWS Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Administración y monitoreo multi-cuenta de AWS
          </p>
        </div>
        <a
          href={loginUrl}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Iniciar sesión con AWS Cognito
        </a>
      </div>
    </div>
  );
}
