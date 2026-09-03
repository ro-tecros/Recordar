import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as db from '../db/database';
import type { Essential, Outing, OutingItem } from '../db/types';

interface AppDataContextValue {
  essentials: Essential[];
  outings: Outing[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  addEssential: (title: string, note?: string) => Promise<void>;
  editEssential: (
    id: string,
    patch: Partial<Pick<Essential, 'title' | 'note' | 'enabled'>>
  ) => Promise<void>;
  toggleEssential: (id: string) => Promise<void>;
  removeEssential: (id: string) => Promise<void>;

  addOuting: (title: string, note?: string) => Promise<string>;
  editOuting: (
    id: string,
    patch: Partial<Pick<Outing, 'title' | 'note' | 'done'>>
  ) => Promise<void>;
  toggleOutingDone: (id: string) => Promise<void>;
  removeOuting: (id: string) => Promise<void>;

  addOutingItem: (
    outingId: string,
    title: string,
    note?: string
  ) => Promise<void>;
  editOutingItem: (
    id: string,
    patch: Partial<Pick<OutingItem, 'title' | 'note'>>
  ) => Promise<void>;
  removeOutingItem: (id: string) => Promise<void>;

  getOuting: (id: string) => Outing | undefined;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [essentials, setEssentials] = useState<Essential[]>([]);
  const [outings, setOutings] = useState<Outing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [e, o] = await Promise.all([
        db.listEssentials(),
        db.listOutings(),
      ]);
      setEssentials(e);
      setOutings(o);
      setError(null);
    } catch (err) {
      console.error('reload failed', err);
      setError('No se pudieron cargar tus datos.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await reload();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  // --- Essentials ---

  const addEssential = useCallback(
    async (title: string, note = '') => {
      const clean = title.trim();
      if (!clean) return;
      const now = Date.now();
      await db.insertEssential({
        id: genId(),
        title: clean,
        note: note.trim(),
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
      await reload();
    },
    [reload]
  );

  const editEssential = useCallback<AppDataContextValue['editEssential']>(
    async (id, patch) => {
      setEssentials((prev) =>
        prev.map((e) => (e.id === id ? applyEssentialPatch(e, patch) : e))
      );
      const current = essentials.find((e) => e.id === id);
      if (!current) return;
      await db.updateEssential(applyEssentialPatch(current, patch));
      await reload();
    },
    [essentials, reload]
  );

  const toggleEssential = useCallback(
    async (id: string) => {
      const current = essentials.find((e) => e.id === id);
      if (!current) return;
      await editEssential(id, { enabled: !current.enabled });
    },
    [essentials, editEssential]
  );

  const removeEssential = useCallback(
    async (id: string) => {
      setEssentials((prev) => prev.filter((e) => e.id !== id));
      await db.deleteEssential(id);
      await reload();
    },
    [reload]
  );

  // --- Outings ---

  const addOuting = useCallback(
    async (title: string, note = '') => {
      const clean = title.trim();
      const now = Date.now();
      const id = genId();
      await db.insertOuting({
        id,
        title: clean || 'Nueva salida',
        note: note.trim(),
        done: false,
        createdAt: now,
        updatedAt: now,
      });
      await reload();
      return id;
    },
    [reload]
  );

  const editOuting = useCallback<AppDataContextValue['editOuting']>(
    async (id, patch) => {
      const current = outings.find((o) => o.id === id);
      if (!current) return;
      const { items, ...rest } = current;
      const updated = {
        ...rest,
        ...('title' in patch && patch.title !== undefined
          ? { title: patch.title.trim() || 'Nueva salida' }
          : {}),
        ...('note' in patch && patch.note !== undefined
          ? { note: patch.note.trim() }
          : {}),
        ...('done' in patch && patch.done !== undefined
          ? { done: patch.done }
          : {}),
        updatedAt: Date.now(),
      };
      await db.updateOuting(updated);
      await reload();
    },
    [outings, reload]
  );

  const toggleOutingDone = useCallback(
    async (id: string) => {
      const current = outings.find((o) => o.id === id);
      if (!current) return;
      await editOuting(id, { done: !current.done });
    },
    [outings, editOuting]
  );

  const removeOuting = useCallback(
    async (id: string) => {
      setOutings((prev) => prev.filter((o) => o.id !== id));
      await db.deleteOuting(id);
      await reload();
    },
    [reload]
  );

  // --- Outing items ---

  const addOutingItem = useCallback(
    async (outingId: string, title: string, note = '') => {
      const clean = title.trim();
      if (!clean) return;
      const now = Date.now();
      await db.insertOutingItem({
        id: genId(),
        outingId,
        title: clean,
        note: note.trim(),
        createdAt: now,
        updatedAt: now,
      });
      await reload();
    },
    [reload]
  );

  const editOutingItem = useCallback<AppDataContextValue['editOutingItem']>(
    async (id, patch) => {
      let target: OutingItem | undefined;
      for (const o of outings) {
        target = o.items.find((i) => i.id === id);
        if (target) break;
      }
      if (!target) return;
      await db.updateOutingItem({
        ...target,
        ...('title' in patch && patch.title !== undefined
          ? { title: patch.title.trim() || target.title }
          : {}),
        ...('note' in patch && patch.note !== undefined
          ? { note: patch.note.trim() }
          : {}),
        updatedAt: Date.now(),
      });
      await reload();
    },
    [outings, reload]
  );

  const removeOutingItem = useCallback(
    async (id: string) => {
      setOutings((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.filter((i) => i.id !== id),
        }))
      );
      await db.deleteOutingItem(id);
      await reload();
    },
    [reload]
  );

  const getOuting = useCallback(
    (id: string) => outings.find((o) => o.id === id),
    [outings]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      essentials,
      outings,
      loading,
      error,
      reload,
      addEssential,
      editEssential,
      toggleEssential,
      removeEssential,
      addOuting,
      editOuting,
      toggleOutingDone,
      removeOuting,
      addOutingItem,
      editOutingItem,
      removeOutingItem,
      getOuting,
    }),
    [
      essentials,
      outings,
      loading,
      error,
      reload,
      addEssential,
      editEssential,
      toggleEssential,
      removeEssential,
      addOuting,
      editOuting,
      toggleOutingDone,
      removeOuting,
      addOutingItem,
      editOutingItem,
      removeOutingItem,
      getOuting,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

function applyEssentialPatch(
  e: Essential,
  patch: Partial<Pick<Essential, 'title' | 'note' | 'enabled'>>
): Essential {
  return {
    ...e,
    ...('title' in patch && patch.title !== undefined
      ? { title: patch.title.trim() || e.title }
      : {}),
    ...('note' in patch && patch.note !== undefined
      ? { note: patch.note.trim() }
      : {}),
    ...('enabled' in patch && patch.enabled !== undefined
      ? { enabled: patch.enabled }
      : {}),
    updatedAt: Date.now(),
  };
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData debe usarse dentro de <AppDataProvider>');
  }
  return ctx;
}
