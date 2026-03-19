"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { CreateOrgModal } from "@/components/layout/CreateOrgModal";
import { useMyOrg } from "@/hooks/use-org";
import { useMe } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: userLoading } = useMe();
  const { data: org, isLoading: orgLoading, isError: orgError } = useMyOrg();

  // User has no org → show create modal
  const noOrg = !orgLoading && !org && orgError;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin pt-14 md:pt-0">
        {children}
      </main>
      <CreateOrgModal open={!!noOrg && !orgLoading} />
    </div>
  );
}
