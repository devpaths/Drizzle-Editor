import React from "react";
import {
  ArrowRight,
  Heart,
  GitBranch,
  Code2,
  Workflow,
  Settings2,
  DatabaseZap,
  LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/utils/themeContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="relative bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white min-h-screen overflow-hidden font-sans">
        {/* Rail lines */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-0 bottom-0 left-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="absolute top-0 bottom-0 right-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`tl-${i}`}
              className="absolute left-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
              style={{ top: `${(i + 1) * 120}px` }}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`tr-${i}`}
              className="absolute right-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
              style={{ top: `${(i + 1) * 120}px` }}
            />
          ))}
        </div>

        {/* Diagonal pattern */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(315deg, transparent, transparent 12px, rgba(128,128,128,0.04) 12px, rgba(128,128,128,0.04) 13px)",
          }}
        />

        {/* NAV */}
        <nav className="relative z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-[88px] h-[60px] flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium tracking-tight">
                DE
              </div>
              <span className="text-[15px] font-medium tracking-tight">
                Drizzle Editor
              </span>
            </div>

            {/* Center links */}
            <div className="hidden md:flex items-center gap-7">
              {["Features", "GitHub"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition text-sm"
                aria-label="Toggle dark mode"
              >
                {isDark ? "☀" : "🌙"}
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-[13px] px-3.5 py-[6px] rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-[13px] font-medium px-3.5 py-[6px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-[13px] px-3.5 py-[6px] rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-[13px] font-medium px-3.5 py-[6px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                  >
                    Get started free
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative z-10 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-[88px] py-20 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 text-[12px] text-neutral-500 dark:text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Free &amp; open source
              </div>

              <h1 className="text-[42px] font-medium tracking-[-1.5px] leading-[1.1] text-neutral-900 dark:text-white">
                Visual schema editor
                <br />
                for <span className="text-emerald-500">Drizzle</span>
              </h1>

              <p className="text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[380px]">
                Design your database schema on a canvas or in code — and watch
                both stay perfectly in sync. Drag tables, connect foreign keys,
                and get production-ready Drizzle ORM code instantly.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/signup")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-medium transition group"
                >
                  {user ? "Go to dashboard" : "Start building free"}
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-neutral-300 dark:border-neutral-700 text-[14px] hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">
                  View on GitHub
                </button>
              </div>
            </div>

            {/* Right — mini editor mockup */}
            <div className="hidden lg:block">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
                <div className="h-9 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex gap-3 p-3">
                  {/* Tables panel */}
                  <div className="w-28 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-2.5 shrink-0">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-2">
                      Tables
                    </p>
                    {["users", "posts", "comments", "tags"].map((t) => (
                      <div
                        key={t}
                        className={`text-[11px] px-2 py-1.5 rounded-md mb-1 border ${
                          t === "users"
                            ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                  {/* Canvas */}
                  <div className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 relative min-h-[200px] p-2 overflow-hidden">
                    <div className="absolute top-2 left-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] min-w-[90px]">
                      <div className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-[11px] font-medium">
                        users
                      </div>
                      {[
                        ["id", "serial"],
                        ["name", "text"],
                        ["email", "text"],
                      ].map(([f, t]) => (
                        <div
                          key={f}
                          className="px-2 py-0.5 flex justify-between gap-3 text-neutral-500"
                        >
                          <span>{f}</span>
                          <span className="text-[9px] text-neutral-400">
                            {t}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-2 right-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] min-w-[90px]">
                      <div className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-[11px] font-medium">
                        posts
                      </div>
                      {[
                        ["id", "serial"],
                        ["userId", "int"],
                        ["title", "text"],
                      ].map(([f, t]) => (
                        <div
                          key={f}
                          className="px-2 py-0.5 flex justify-between gap-3 text-neutral-500"
                        >
                          <span>{f}</span>
                          <span className="text-[9px] text-neutral-400">
                            {t}
                          </span>
                        </div>
                      ))}
                    </div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1="103"
                        y1="32"
                        x2="140"
                        y2="32"
                        stroke="#10b981"
                        strokeWidth="0.5"
                        strokeDasharray="3,2"
                      />
                      <circle cx="103" cy="32" r="2" fill="#10b981" />
                      <circle cx="140" cy="32" r="2" fill="#10b981" />
                    </svg>
                    <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-400">
                        Generated code
                      </div>
                      <pre className="p-2 font-mono text-[9px] text-emerald-500 leading-relaxed bg-white dark:bg-neutral-950">{`export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
});`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="relative z-10 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-2 md:grid-cols-4">
          {[
            { num: "100%", label: "Free & open source" },
            { num: "AST", label: "Based parsing engine" },
            { num: "2-way", label: "Code ↔ canvas sync" },
            { num: ".ts / .png", label: "Export formats" },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              className={`px-8 py-9 flex flex-col items-center justify-center text-center ${i < arr.length - 1 ? "border-r border-neutral-200 dark:border-neutral-800" : ""}`}
            >
              <div className="text-[28px] font-medium tracking-[-1px]">
                {s.num}
              </div>
              <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section className="relative z-10 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-[88px] py-[72px]">
            <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-medium mb-2.5">
              Features
            </p>
            <h2 className="text-[30px] font-medium tracking-[-1px] mb-12">
              Everything your schema needs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 border border-neutral-200 dark:border-neutral-800">
              {[
                {
                  icon: <GitBranch size={18} />,
                  title: "Visual canvas",
                  desc: "Drag tables onto an infinite canvas, drag between columns to create foreign keys, and click any table to edit it in detail.",
                },
                {
                  icon: <Code2 size={18} />,
                  title: "Bidirectional sync",
                  desc: "A real AST parser and code generator keep your visual diagram and Drizzle TypeScript code in sync — edit either one, the other updates instantly.",
                },
                {
                  icon: <Settings2 size={18} />,
                  title: "Full constraint support",
                  desc: "Primary keys, unique, notNull, defaults, varchar lengths, and foreign key references — all editable visually or in code.",
                },
                {
                  icon: <Workflow size={18} />,
                  title: "Auto layout",
                  desc: "Automatically arrange your tables based on their relationships with one click, and the canvas zooms to fit everything.",
                },
                {
                  icon: <DatabaseZap size={18} />,
                  title: "Import & export",
                  desc: "Paste or upload an existing Drizzle schema to start editing visually, or export your generated code as a .ts file and your diagram as a PNG.",
                },
                {
                  icon: <LogIn size={18} />,
                  title: "Saved schemas",
                  desc: "Sign in with Google or email, and manage all your schemas from a personal dashboard — every change is saved automatically.",
                },
              ].map((f, i) => (
                <div
                  key={f.title}
                  className={`p-7 ${i % 3 !== 2 ? "border-r border-neutral-200 dark:border-neutral-800" : ""} ${i < 3 ? "border-b border-neutral-200 dark:border-neutral-800" : ""}`}
                >
                  <div className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-emerald-500 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-[14px] font-medium mb-2">{f.title}</h3>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="relative z-10 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-[88px] py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <h2 className="text-[30px] font-medium tracking-[-1px] max-w-[460px]">
              Free, open source, and{" "}
              <span className="text-emerald-500">yours to keep.</span>
            </h2>
            <div className="flex gap-2.5 shrink-0">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/signup")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-medium transition group"
              >
                {user ? "Go to dashboard" : "Get started free"}
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-neutral-300 dark:border-neutral-700 text-[14px] hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">
                View on GitHub
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10">
          <div className="max-w-7xl mx-auto px-[88px] py-12 grid grid-cols-2 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                  DE
                </div>
                <span className="text-[15px] font-medium tracking-tight">
                  Drizzle Editor
                </span>
              </div>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[200px]">
                A visual + code hybrid schema editor for Drizzle ORM. Free and
                open source.
              </p>
            </div>

            {[
              {
                heading: "Product",
                links: ["Features"],
              },
              {
                heading: "Developer",
                links: ["GitHub"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 font-medium">
                  {col.heading}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-[88px] py-4 flex items-center justify-between text-[12px] text-neutral-400 dark:text-neutral-500">
              <span>© 2026 Drizzle Editor. All rights reserved.</span>
              <span className="flex items-center gap-1">
                Made with{" "}
                <Heart size={11} className="text-emerald-500 mx-0.5" /> for the
                Drizzle community
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
