export function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
