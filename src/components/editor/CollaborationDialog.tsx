// components/MonacoEditorSetup.tsx
import { useEffect, useRef } from "react";
import { Editor, Monaco, OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { nanoid } from "nanoid";
import { User } from "@/components/dashboard/types";

// Define worker URLs - these will be set in next.config.mjs
const MONACO_WORKER_BASE_URL = "/monaco-workers";

// Random colors for different users
const COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
];

// Get consistent color based on user ID
const getColorFromUserId = (userId: string) => {
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

interface CollaborativeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  isDarkMode: boolean;
  isMounted: boolean;
  roomId: string;
  currentUser: User;
}

const CollaborativeMonacoEditor: React.FC<CollaborativeEditorProps> = ({
  code,
  onChange,
  isDarkMode,
  isMounted,
  roomId,
  currentUser,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Setup Monaco environment before editor loads
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
          const workerMap: Record<string, string> = {
            typescript: `${MONACO_WORKER_BASE_URL}/ts.worker.js`,
            javascript: `${MONACO_WORKER_BASE_URL}/ts.worker.js`, // TypeScript worker handles JavaScript too
            editorWorkerService: `${MONACO_WORKER_BASE_URL}/editor.worker.js`,
            css: `${MONACO_WORKER_BASE_URL}/css.worker.js`,
            html: `${MONACO_WORKER_BASE_URL}/html.worker.js`,
            json: `${MONACO_WORKER_BASE_URL}/json.worker.js`,
          };

          return workerMap[label] || workerMap.editorWorkerService;
        },
      };
    }
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Initialize collaboration if not already initialized
    if (!initializedRef.current) {
      initializeCollaboration(editor, monaco);
      initializedRef.current = true;
    }
  };

  const initializeCollaboration = (editor: any, monaco: Monaco) => {
    // Create Y.js document
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;

    // Create Y.js text type for the editor content
    const yText = yDoc.getText("monaco");

    // Connect to the collaboration server (make sure this is running)
    const wsProvider = new WebsocketProvider(
      "ws://localhost:8080", // Replace with your WebSocket server
      roomId,
      yDoc,
      { connect: true },
    );
    providerRef.current = wsProvider;

    // Set user information for awareness
    const awareness = wsProvider.awareness;
    const userId = currentUser.id || nanoid();
    const userColor = getColorFromUserId(userId);

    awareness.setLocalStateField("user", {
      name: currentUser.name,
      id: userId,
      color: userColor,
    });

    // Bind Y.js to Monaco
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      awareness,
    );
    bindingRef.current = binding;

    // Set the initial content if the document is empty
    if (yText.toString() === "") {
      yText.insert(0, code);
    }

    // Listen for changes from Y.js and update parent component
    yText.observe(() => {
      const content = yText.toString();
      if (content !== code) {
        onChange(content);
      }
    });

    // Apply custom styles for cursor and selection highlights
    if (typeof document !== "undefined") {
      const styleId = "monaco-collaboration-styles";
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
        styleElement.innerHTML = `
          .yRemoteSelection {
            background-color: rgba(250, 166, 26, 0.5);
          }
          .yRemoteSelectionHead {
            position: absolute;
            border-left: 2px solid orange;
            border-top: 2px solid orange;
            border-bottom: 2px solid orange;
            height: 100%;
            box-sizing: border-box;
          }
          .yRemoteSelectionHead::after {
            position: absolute;
            content: ' ';
            border: 3px solid orange;
            border-radius: 4px;
            left: -4px;
            top: -5px;
          }
        `;
      }
    }

    // Create a status bar for connected users
    createStatusBar(editor, monaco, awareness);
  };

  const createStatusBar = (
    editor: any,
    monaco: Monaco,
    awareness: Awareness,
  ) => {
    // Add a widget at the bottom of the editor to show who's online
    const statusBarWidget = {
      domNode: document.createElement("div"),
      getId: () => "collaborative-status-bar",
      getDomNode: function () {
        const statusBar = this.domNode;
        statusBar.className = "monaco-status-bar";
        statusBar.style.cssText = `
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          padding: 4px 8px;
          background: ${isDarkMode ? "#1e1e1e" : "#f3f3f3"};
          color: ${isDarkMode ? "#cccccc" : "#333333"};
          font-size: 12px;
          border-top: 1px solid ${isDarkMode ? "#333333" : "#dddddd"};
          z-index: 100;
        `;
        return statusBar;
      },
      getPosition: () => ({ preference: 100 }),
    };

    editor.addOverlayWidget(statusBarWidget);

    // Update the status bar with the list of connected users
    const updateConnectedUsers = () => {
      if (!statusBarWidget.domNode) return;

      statusBarWidget.domNode.innerHTML =
        '<span style="margin-right: 8px;">Connected users:</span>';

      const states = awareness.getStates();
      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          const userBadge = document.createElement("span");
          userBadge.style.cssText = `
            display: inline-block;
            background: ${state.user.color};
            color: #fff;
            padding: 2px 6px;
            border-radius: 12px;
            margin-right: 5px;
            font-weight: 500;
          `;
          userBadge.textContent = state.user.name;
          statusBarWidget.domNode.appendChild(userBadge);
        }
      });
    };

    awareness.on("change", updateConnectedUsers);
    updateConnectedUsers();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
      }
      if (yDocRef.current) {
        yDocRef.current.destroy();
      }
    };
  }, []);

  // Use client-side only rendering for the editor
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-gray-100 dark:bg-gray-800"></div>;
  }

  return (
    <div className="relative h-full w-full">
      <Editor
        height="100%"
        language="typescript"
        theme={isMounted ? (isDarkMode ? "vs-dark" : "vs-light") : "vs-dark"}
        value={code}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CollaborativeMonacoEditor;
