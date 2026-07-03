import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { syncService } from '../lib/sync';
import { getToken } from '../lib/auth';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [boutique, setBoutique] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [bloquee, setBloquee] = useState(false);

  const refreshBoutique = useCallback(async () => {
    try {
      const data = await api.getBoutique();
      setBoutique(data);
      setBloquee(false);
    } catch (err) {
      if (err.bloquee) setBloquee(true);
      throw err;
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    refreshBoutique().finally(() => setLoading(false));

    const unsub = syncService.onStatusChange(setSyncStatus);

    const interval = setInterval(() => {
      api.getBoutique().catch((err) => {
        if (err.bloquee) setBloquee(true);
      });
    }, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [refreshBoutique]);

  return (
    <AppContext.Provider value={{ boutique, setBoutique, loading, syncStatus, bloquee, refreshBoutique }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}
