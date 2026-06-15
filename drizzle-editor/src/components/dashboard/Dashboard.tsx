import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { getColumns } from "../ui/schema-columns";
import { DataTable } from "../ui/data-table";
import { Plus, LogOut, Database } from "lucide-react";

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: schemas, isLoading } = trpc.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [showImport, setShowImport] = useState(false);

  const deleteSchema = trpc.delete.useMutation({
    onSuccess: () => utils.list.invalidate(),
  });

  const columns = getColumns(navigate, (id, name) => {
    if (confirm(`Delete "${name}"?`)) deleteSchema.mutate({ id });
  });

  const createSchema = trpc.create.useMutation({
    onSuccess: (s) => navigate(`/editor/${s.id}`),
  });

  if (loading) return <div className="h-screen bg-white dark:bg-neutral-950" />;
  if (!user) return <Navigate to="/login" replace />;

  const schemaCount = schemas?.length ?? 0;

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white overflow-hidden font-sans">
      {/* ── Rail lines ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 bottom-0 left-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
        <div className="absolute top-0 bottom-0 right-[72px] w-px bg-neutral-200 dark:bg-neutral-800" />
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={`tl-${i}`}
            className="absolute left-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
            style={{ top: `${(i + 1) * 100}px` }}
          />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={`tr-${i}`}
            className="absolute right-[66px] w-[13px] h-px bg-neutral-300 dark:bg-neutral-700"
            style={{ top: `${(i + 1) * 100}px` }}
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

      {/* ════════════════════════════════════
          NAV
      ════════════════════════════════════ */}
      <nav className="relative z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-[88px] h-[60px] flex items-center justify-between">
          {/* Logo */}
          {/* Logo — replace the outer button with a clean unstyled one */}
          <button
            onClick={() => navigate("/landing-page")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium tracking-tight">
              DE
            </div>
            <span className="text-[15px] font-medium tracking-tight">
              Drizzle Editor
            </span>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-neutral-500 dark:text-neutral-400 mr-1">
              {user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 text-[13px] px-3.5 py-[6px] rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
            >
              <LogOut size={13} />
              Sign out
            </button>
            <button
              onClick={() => createSchema.mutate({ name: "Untitled Schema" })}
              disabled={createSchema.isPending}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-[6px] rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition"
            >
              <Plus size={13} />
              {createSchema.isPending ? "Creating..." : "New schema"}
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════
          PAGE CONTENT
      ════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-[88px]">
        {/* ── Page header ── */}
        <div className="py-12 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-medium mb-2">
            Workspace
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-[36px] font-medium tracking-[-1.5px] leading-none">
              Your schemas
            </h1>
            {/* Stat pills */}
            <div className="flex items-center gap-3 pb-0.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                <Database size={13} className="text-emerald-500" />
                <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                  <span className="text-neutral-900 dark:text-white font-medium">
                    {schemaCount}
                  </span>{" "}
                  schema{schemaCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table area ── */}
        <div className="py-8">
          {isLoading ? (
            /* Loading skeleton */
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 animate-pulse"
                  style={{ opacity: 1 - i * 0.2 }}
                />
              ))}
            </div>
          ) : schemaCount === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center border border-neutral-200 dark:border-neutral-800 rounded-xl border-dashed">
              <div className="w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-emerald-500 mb-4">
                <Database size={18} />
              </div>
              <p className="text-[15px] font-medium mb-1">No schemas yet</p>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs">
                Create your first schema to start building and visualizing your
                database structure.
              </p>
              <button
                onClick={() => createSchema.mutate({ name: "Untitled Schema" })}
                disabled={createSchema.isPending}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition"
              >
                <Plus size={13} />
                {createSchema.isPending ? "Creating..." : "Create first schema"}
              </button>
            </div>
          ) : (
            /* Data table */
            <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <DataTable
                columns={columns}
                data={schemas ?? []}
                filterColumn="name"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
