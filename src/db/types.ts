export interface Essential {
  id: string;
  title: string;
  note: string;
  /** Si está activo, aparece cada vez que tocas "Salir". */
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OutingItem {
  id: string;
  outingId: string;
  title: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Outing {
  id: string;
  title: string;
  note: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
  items: OutingItem[];
}

// --- Filas crudas de SQLite ---

export interface EssentialRow {
  id: string;
  title: string;
  note: string | null;
  enabled: number;
  created_at: number;
  updated_at: number;
}

export interface OutingRow {
  id: string;
  title: string;
  note: string | null;
  done: number;
  created_at: number;
  updated_at: number;
}

export interface OutingItemRow {
  id: string;
  outing_id: string;
  title: string;
  note: string | null;
  created_at: number;
  updated_at: number;
}
