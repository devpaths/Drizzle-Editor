import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUp() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white flex items-center justify-center overflow-hidden font-sans">
      {/* ── Rail lines ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 bottom-0 left-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
        <div className="absolute top-0 bottom-0 right-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`tl-${i}`}
            className="absolute left-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
            style={{ top: `${(i + 1) * 80}px` }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`tr-${i}`}
            className="absolute right-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
            style={{ top: `${(i + 1) * 80}px` }}
          />
        ))}
      </div>

      {/* ── Diagonal pattern ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(315deg, transparent, transparent 12px, rgba(128,128,128,0.04) 12px, rgba(128,128,128,0.04) 13px)",
        }}
      />

      {/* ── Nav ── */}
      <a
        href="/"
        className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-[88px] h-[60px] flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium tracking-tight">
              DE
            </div>
            <span className="text-[15px] font-medium tracking-tight">
              Drizzle Editor
            </span>
          </div>
        </div>
      </a>

      {/* ── Form ── */}
      <SignUpForm />
    </div>
  );
}
