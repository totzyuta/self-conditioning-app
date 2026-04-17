export async function fetchRemoteStateV2(userId, password) {
  const res = await fetch(`/api/v2/state?user_id=${encodeURIComponent(userId)}`, {
    cache: "no-store",
    headers: { "x-sync-password": password },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
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
  const res = await fetch(`/api/v2/state?user_id=${encodeURIComponent(userId)}`, {
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
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function wipeRemoteStateV2(userId, password) {
  const res = await fetch(`/api/v2/state?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE",
    cache: "no-store",
    headers: { "x-sync-password": password },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
