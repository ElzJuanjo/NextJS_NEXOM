export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.08),_transparent_70%)]" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      {children}
    </div>
  );
}
