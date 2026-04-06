import { createContext, useContext, useState, ReactNode } from 'react';
import { UserType } from '../types';

interface ViewAsState {
  viewAsType: UserType;
  setViewAsType: (type: UserType) => void;
}

const ViewAsContext = createContext<ViewAsState | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsType, setViewAsType] = useState<UserType>(UserType.RETAIL);
  return (
    <ViewAsContext.Provider value={{ viewAsType, setViewAsType }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsState {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error('useViewAs must be used within ViewAsProvider');
  return ctx;
}
