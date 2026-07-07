import { AuthStage } from "@/components/auth/auth-stage";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthStage
      initialMode="login"
      callbackUrl={params.callbackUrl || "/"}
      registered={params.registered === "true"}
    />
  );
}
