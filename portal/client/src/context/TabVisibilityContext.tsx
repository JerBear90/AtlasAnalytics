import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/client';

type TabVisibility = Record<string, boolean>;

interface TabVisibilityState {
  visibility: TabVisibility;
  loading: boolean;
  isTabVisible: (tabId: string) => boolean;
  setVisibility: (v: TabVisibility) => void;
  refresh: () => Promise<void>;
}

const TabVisibilityContext = createContext<TabVisibilityState | undefined>(undefined);

export function TabVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState<TabVisibility>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/tab-visibility');
      setVisibility(data);
    } catch { /* default all visible */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isTabVisible = (tabId: string) => visibility[tabId] !== false;

  return (
    <TabVisibilityContext.Provider value={{ visibility, loading, isTabVisible, setVisibility, refresh }}>
      {children}
    </TabVisibilityContext.Provider>
  );
}

export function useTabVisibility(): TabVisibilityState {
  const ctx = useContext(TabVisibilityContext);
  if (!ctx) throw new Error('useTabVisibility must be used within TabVisibilityProvider');
  return ctx;
}
