import { apiUrl } from "./apiBase.js";

function parseJsonBody(text) {
  let t = String(text ?? "").trim();
  if (t.startsWith("\uFEFF")) t = t.slice(1).trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function isSyncOkEnvelope(data) {
  if (data == null || typeof data !== "object" || Array.isArray(data)) return false;
  const ok = data.ok;
  return ok === true || ok === 1;
}

/** When status is OK but body is not `{ ok: true, ... }`, explain instead of "HTTP 200". */
function throwUnlessOkJson(res, data, contentType) {
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  if (isSyncOkEnvelope(data)) return;
  if (data == null) {
    const looksJson = /json/i.test(contentType || "");
    throw new Error(
      looksJson
        ? "サーバー応答を JSON として解釈できませんでした。"
        : "同期 API が JSON を返していません（HTML などの可能性）。ネイティブではビルド時に VITE_API_BASE_URL を、/api/v2/state が動く HTTPS のオリジン（例: Vercel のデプロイ URL、末尾スラッシュなし）に設定してください。",
    );
  }
  throw new Error(
    data.error ||
      "同期 API の応答に ok: true がありません。ネイティブでは VITE_API_BASE_URL を API の HTTPS オリジンに設定して再ビルドしてください。",
  );
}

export async function fetchRemoteStateV2(userId, password) {
  const res = await fetch(apiUrl(`/api/v2/state?user_id=${encodeURIComponent(userId)}`), {
    cache: "no-store",
    headers: { "x-sync-password": password },
  });
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();
  const data = parseJsonBody(raw);
  throwUnlessOkJson(res, data, contentType);
  return data;
}

export async function putRemoteDayV2({
  userId,
  password,
  date,
  conditionScore,
  conditionNote,
  steps,
  stepsNote,
  weight,
  weightNote,
  note,
  items,
  clientLast,
}) {
  const res = await fetch(apiUrl(`/api/v2/state?user_id=${encodeURIComponent(userId)}`), {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-sync-password": password,
    },
    body: JSON.stringify({
      date,
      conditionScore,
      conditionNote,
      steps,
      stepsNote,
      weight,
      weightNote,
      note,
      items,
      clientLast,
    }),
  });
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();
  const data = parseJsonBody(raw);
  try {
    throwUnlessOkJson(res, data, contentType);
  } catch (e) {
    e.code = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

export async function wipeRemoteStateV2(userId, password) {
  const res = await fetch(apiUrl(`/api/v2/state?user_id=${encodeURIComponent(userId)}`), {
    method: "DELETE",
    cache: "no-store",
    headers: { "x-sync-password": password },
  });
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();
  const data = parseJsonBody(raw);
  try {
    throwUnlessOkJson(res, data, contentType);
  } catch (e) {
    e.code = res.status;
    e.data = data;
    throw e;
  }
  return data;
}
