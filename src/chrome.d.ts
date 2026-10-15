// Tipe minimal untuk API chrome.* yang dipakai (hanya chrome.storage.local) — menghindari dependensi @types/chrome.
declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
    onChanged: {
      addListener(cb: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
    };
  };
};
