import TopBar from "./TopBar";
import MonacoPanel from "./MonacoPanel";
import GraphCanvas from "./GraphCanvas";

interface EditorLayoutProps {
  schemaId: string;
  schemaName: string;
}

function EditorLayout({ schemaId, schemaName }: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white overflow-hidden font-sans">
      <TopBar schemaId={schemaId} schemaName={schemaName} />
      <div className="flex flex-1 overflow-hidden">
        {/* Monaco panel */}
        <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <MonacoPanel />
        </div>
        {/* Graph canvas */}
        <div className="w-1/2 overflow-hidden">
          <GraphCanvas />
        </div>
      </div>
    </div>
  );
}

export default EditorLayout;
