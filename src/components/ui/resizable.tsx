// components/ui/resizable.tsx
import React, { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize: number; // Percentage of parent width
  minSize?: number; // Minimum percentage
  maxSize?: number; // Maximum percentage
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !parentRef.current) return;
    
    const parentRect = parentRef.current.getBoundingClientRect();
    const newSize = ((e.clientX - parentRect.left) / parentRect.width) * 100;
    
    // Apply constraints
    const clampedSize = Math.min(Math.max(newSize, minSize), maxSize);
    setSize(clampedSize);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div ref={parentRef} className="flex-1 flex relative">
      <div
        ref={panelRef}
        className="h-full overflow-hidden"
        style={{ width: `${size}%` }}
      >
        {children}
      </div>
      <div
        className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize ${isResizing ? 'bg-blue-500' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

