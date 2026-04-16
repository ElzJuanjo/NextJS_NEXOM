"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useVerifyEmail } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/Spinner";
import { useFadeIn } from "@/hooks/use-anime";
import { Logo } from "@/components/ui/Logo";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verify = useVerifyEmail();
  const ref = useFadeIn<HTMLDivElement>();

  useEffect(() => {
    if (token) verify.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div ref={ref} className="w-full max-w-sm relative z-10 text-center opacity-0">
      <div className="flex justify-center mb-4">
        <Logo size={64} fit="contain" />
      </div>

      {verify.isPending && (
        <div className="space-y-3">
          <Spinner className="w-8 h-8 mx-auto text-violet-400" />
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        </div>
      )}

      {verify.isSuccess && (
        <div className="space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Email verified</h2>
          <p className="text-sm text-muted-foreground">{verify.data?.message}</p>
          <Link href="/dashboard" className="inline-flex px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity mt-2">
            Go to dashboard
          </Link>
        </div>
      )}

      {verify.isError && (
        <div className="space-y-3">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Verification error</h2>
          <p className="text-sm text-muted-foreground">{verify.error?.message}</p>
          <Link href="/login" className="inline-flex px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity mt-2">
            Back to login
          </Link>
        </div>
      )}
    </div>
  );
}
