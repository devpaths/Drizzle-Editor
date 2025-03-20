// File: @/components/types.ts
// Add this to your existing types file or create a new one

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

// Add to your existing ColorNode interface or wherever appropriate
export interface CollaborationState {
  roomId: string;
  connectedUsers: User[];
  isConnected: boolean;
}
