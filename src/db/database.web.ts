import type { Essential, Outing, OutingItem } from './types';

/**
 * Implementación de almacenamiento para web (PWA).
 * Metro resuelve este archivo automáticamente en lugar de `database.ts`
 * cuando el objetivo es web, así evitamos expo-sqlite (alpha en web y
 * exige cabeceras COOP/COEP en el hosting).
 *
 * Los datos son pequeños (listas personales), así que se guardan como JSON
 * en localStorage. Persisten offline y no necesitan configuración del host.
 */

const KEY = 'recordar:v2';

interface Store {
  essentials: Essential[];
  outings: Omit<Outing, 'items'>[];
  outingItems: OutingItem[];
}

const empty: Store = { essentials: [], outings: [], outingItems: [] };

function read(): Store {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      essentials: parsed.essentials ?? [],
      outings: parsed.outings ?? [],
      outingItems: parsed.outingItems ?? [],
    };
  } catch {
    return { ...empty };
  }
}

function write(store: Store): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(store));
  } catch {
    // Modo privado o almacenamiento lleno: se ignora silenciosamente.
  }
}

async function mutate(fn: (store: Store) => void): Promise<void> {
  const store = read();
  fn(store);
  write(store);
}

// --- Essentials ---

export async function listEssentials(): Promise<Essential[]> {
  return read().essentials.slice().sort((a, b) => a.createdAt - b.createdAt);
}

export async function insertEssential(e: Essential): Promise<void> {
  await mutate((s) => {
    s.essentials.push(e);
  });
}

export async function updateEssential(e: Essential): Promise<void> {
  await mutate((s) => {
    const i = s.essentials.findIndex((x) => x.id === e.id);
    if (i >= 0) s.essentials[i] = { ...s.essentials[i], ...e };
  });
}

export async function deleteEssential(id: string): Promise<void> {
  await mutate((s) => {
    s.essentials = s.essentials.filter((x) => x.id !== id);
  });
}

// --- Outings + items ---

export async function listOutings(): Promise<Outing[]> {
  const s = read();
  const itemsByOuting = new Map<string, OutingItem[]>();
  for (const item of s.outingItems) {
    const bucket = itemsByOuting.get(item.outingId) ?? [];
    bucket.push(item);
    itemsByOuting.set(item.outingId, bucket);
  }
  for (const bucket of itemsByOuting.values()) {
    bucket.sort((a, b) => a.createdAt - b.createdAt);
  }

  return s.outings
    .slice()
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt - a.createdAt;
    })
    .map((o) => ({
      ...o,
      note: o.note ?? '',
      items: itemsByOuting.get(o.id) ?? [],
    }));
}

export async function insertOuting(o: Omit<Outing, 'items'>): Promise<void> {
  await mutate((s) => {
    s.outings.push(o);
  });
}

export async function updateOuting(o: Omit<Outing, 'items'>): Promise<void> {
  await mutate((s) => {
    const i = s.outings.findIndex((x) => x.id === o.id);
    if (i >= 0) s.outings[i] = { ...s.outings[i], ...o };
  });
}

export async function deleteOuting(id: string): Promise<void> {
  await mutate((s) => {
    s.outings = s.outings.filter((x) => x.id !== id);
    s.outingItems = s.outingItems.filter((x) => x.outingId !== id);
  });
}

export async function insertOutingItem(i: OutingItem): Promise<void> {
  await mutate((s) => {
    s.outingItems.push(i);
  });
}

export async function updateOutingItem(i: OutingItem): Promise<void> {
  await mutate((s) => {
    const idx = s.outingItems.findIndex((x) => x.id === i.id);
    if (idx >= 0) s.outingItems[idx] = { ...s.outingItems[idx], ...i };
  });
}

export async function deleteOutingItem(id: string): Promise<void> {
  await mutate((s) => {
    s.outingItems = s.outingItems.filter((x) => x.id !== id);
  });
}
