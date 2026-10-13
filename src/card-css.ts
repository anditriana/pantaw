export const CARD_CSS = `
:host { all: initial; }
.card {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;
  width: 240px; box-sizing: border-box;
  font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #161823; background: #fff; border: 1px solid rgba(22,24,35,.12);
  border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.12); overflow: hidden;
}
.head { display: flex; align-items: center; background: #161823; }
.head button {
  all: unset; cursor: pointer; color: #fff; padding: 6px 10px; font-weight: 600;
}
.head button:first-child { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.body { padding: 8px 10px; }
.collapsed .body { display: none; }
.row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
.row span { color: rgba(22,24,35,.65); }
.er { background: #fff0f3; border-radius: 6px; padding: 4px 6px; margin-bottom: 6px; }
.er b { color: #fe2c55; font-size: 14px; }
.muted { margin: 6px 0 0; color: rgba(22,24,35,.55); font-size: 11px; }
`;
