import { useEffect, useState, useCallback } from "react";

const KEY = "faydarent:favorites";
const EVT = "faydarent:favorites";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
