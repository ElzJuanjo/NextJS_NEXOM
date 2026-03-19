import { redirect } from "next/navigation";

export default function Home({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = searchParams.ref;
  if (ref) {
    redirect(`/register?ref=${ref}`);
  }
  redirect("/dashboard");
}