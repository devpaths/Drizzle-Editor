import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { useSchemaStore } from "@/stores/schemaStore";
import EditorLayout from "@/components/editor/EditorLayout";
import type { SchemaModel } from "@/engine/model";

function Editor() {
  const { id } = useParams<{ id: string }>();
  const updateFromGraph = useSchemaStore((s) => s.updateFromGraph);

  const { data, isLoading } = trpc.get.useQuery({ id: id! }, { enabled: !!id });

  useEffect(() => {
    if (data?.model) {
      updateFromGraph(data.model as SchemaModel);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
            DE
          </div>
          <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
            Loading schema...
          </span>
        </div>
      </div>
    );
  }

  return <EditorLayout schemaId={id!} schemaName={data?.name ?? "Untitled"} />;
}

export default Editor;
