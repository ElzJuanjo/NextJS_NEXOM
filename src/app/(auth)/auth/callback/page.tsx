"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/api-client";
import { storeAccessToken } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/ui/Logo";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const isNewUser = searchParams.get("is_new_user") === "true";

    if (accessToken) {
      setAccessToken(accessToken);
      storeAccessToken(accessToken);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 relative z-10">
      <Logo size={64} fit="contain" />
      <Spinner className="w-6 h-6 text-violet-400" />
      <p className="text-sm text-muted-foreground">Authenticating with Google...</p>
    </div>
  );
}
