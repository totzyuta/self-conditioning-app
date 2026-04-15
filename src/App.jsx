import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DashboardTab from "./pages/DashboardTab.jsx";
import ConditionTabPage from "./pages/ConditionTab.jsx";
import TrainingTabPage from "./pages/TrainingTab.jsx";
import { V2_SEED_DAYS } from "./seed/v2Seed.js";
import { APP_VERSION } from "./lib/constants.js";
import { SESSION_KEY, readSession } from "./lib/session.js";
import { storageSk2, loadLocalV2, saveLocalV2 } from "./lib/storageV2.js";
import { fetchRemoteStateV2, putRemoteDayV2, wipeRemoteStateV2 } from "./lib/apiV2.js";
import {
  emptyV2State,
  buildV2StateFromRemote,
  daySummariesFromV2,
  formRowsToV2Items,
} from "./lib/v2State.js";
import {
  asNullableScore,
  condColor,
  condLabel,
  fmtDate,
  todayISO,
} from "./lib/format.js";
import PasswordGate from "./components/auth/PasswordGate.jsx";
import DateHeader from "./components/condition/DateHeader.jsx";
import ConditionChartCard from "./components/condition/ConditionChartCard.jsx";
import CondOrb from "./components/condition/CondOrb.jsx";
import OSBar from "./components/condition/OSBar.jsx";
import SessionMiniCard from "./components/condition/SessionMiniCard.jsx";
import TrainingRecordScreen from "./components/training/TrainingRecordScreen.jsx";
import AppHeaderTabs from "./components/layout/AppHeaderTabs.jsx";
import SettingsSheet from "./components/layout/SettingsSheet.jsx";
import UpdateAvailableBar from "./components/layout/UpdateAvailableBar.jsx";
import AppFooterMark from "./components/layout/AppFooterMark.jsx";

export default function App() {
  const sessionInit = readSession();
  const [authed, setAuthed] = useState(() => !!sessionInit);
  const [syncUserId, setSyncUserId] = useState(() => sessionInit?.userId ?? null);
  const [syncPassword, setSyncPassword] = useState(() => sessionInit?.password ?? null);
  const [hiding, setHiding] = useState(false);
  const [v2, setV2] = useState(() => {
    const s = readSession();
    if (!s?.userId) return emptyV2State("");
    try {
      const { state } = loadLocalV2(s.userId);
      if (state) return state;
    } catch {}
    return emptyV2State(s.userId);
  });
  const daySummaries = useMemo(() => daySummariesFromV2(v2), [v2]);
  const [syncErr, setSyncErr] = useState(null);
  /** 全画面ブロックは「シードデータにリセット」実行中のみ */
  const [seedResetBlocking, setSeedResetBlocking] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const swRef = useRef(null);
  const [backupTick, setBackupTick] = useState(0);
  /** 本番ホストではシード／全削除などの危険な操作を UI から隠す */
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    try {
      const h = String(window.location?.hostname || "").toLowerCase();
      setIsLocalhost(
        h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]",
      );
    } catch {
      setIsLocalhost(false);
    }
  }, []);

  const sk2 = syncUserId ? storageSk2(syncUserId) : "";
  const latestLocalBackup = useMemo(() => {
    if (!sk2) return null;
    let latestKey = null;
    let latestTs = -1;
    const prefix = `${sk2}_backup_`
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    return latestKey ? { key: latestKey, ts: latestTs } : null;
  }, [sk2, v2, backupTick]);

  const latestRemoteBackup = useMemo(() => {
    if (!sk2) return null;
    let latestKey = null;
    let latestTs = -1;
    const prefix = `${sk2}_remote_backup_`
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    return latestKey ? { key: latestKey, ts: latestTs } : null;
  }, [sk2, v2, backupTick]);

  const handleGateAuth = ({ userId, password }) => {
    setSyncUserId(userId);
    setSyncPassword(password);
    const { state } = loadLocalV2(userId);
    setV2(state || emptyV2State(userId));
    setHiding(true);
    setTimeout(() => setAuthed(true), 350);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setShowSettings(false);
    setSyncErr(null);
    setAuthed(false);
    setHiding(false);
    setSyncUserId(null);
    setSyncPassword(null);
    setV2(emptyV2State(""));
    setTab("dashboard");
  };

  const handleForceUpdate = () => {
    console.log("[App] Force update triggered");
    if (swRef.current) {
      swRef.current.waiting?.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    }
  };

  useEffect(() => {
    if (!syncUserId) return;
    saveLocalV2(syncUserId, v2, Date.now());
  }, [v2, syncUserId]);

  const refetchRemoteV2 = useCallback(async () => {
    if (!syncUserId || !syncPassword) return;
    const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
    setV2(buildV2StateFromRemote(remote));
  }, [syncUserId, syncPassword]);

  useEffect(() => {
    if (!authed || !syncUserId || !syncPassword) return;
    let cancelled = false;
    (async () => {
      setSyncErr(null);
      try {
        const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
        if (cancelled) return;
        setV2(buildV2StateFromRemote(remote));
      } catch (e) {
        if (!cancelled) setSyncErr(e?.message || "sync failed");
      }
    })();
    return () => { cancelled = true; };
  }, [authed, syncUserId, syncPassword]);

  // v2 writes are done per-day by update handlers (no bulk push-on-change here).

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      swRef.current = reg;

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_AVAILABLE") {
          setUpdateAvailable(true);
        }
      });

      const interval = setInterval(() => {
        if (reg.installing) return;
        reg.update().catch(() => {});
      }, 3600000);

      return () => clearInterval(interval);
    });
  }, []);

  const addLog = useCallback(async (log) => {
    if (!log?.date) return;
    const date = log.date;

    // Delete training for day (keep condition if any)
    if (log.__delete) {
      try {
        await putRemoteDayV2({
          userId: syncUserId,
          password: syncPassword,
          date,
          conditionScore: v2.conditionsByDate?.[date]?.score ?? null,
          note: "",
          items: [],
          clientLast: {
            conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
            trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
            trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
          },
        });
        setSyncErr(null);
        setV2(prev => {
          const next = { ...prev };
          next.trainingByDate = { ...(prev.trainingByDate || {}) };
          next.trainingByDate[date] = {
            note: "",
            updatedAt: new Date().toISOString(),
            items: { main: [], sub: [] },
            itemsUpdatedAtMax: new Date().toISOString(),
          };
          return next;
        });
      } catch (e) {
        const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
        setSyncErr(msg);
        if (e?.code === 409) {
          try { await refetchRemoteV2(); } catch (_) {}
        }
      }
      setTab("training");
      return;
    }

    if (!log.__v2form) return;

    const conditionScore = log.conditionScore === undefined || log.conditionScore === null
      ? (v2.conditionsByDate?.[date]?.score ?? null)
      : Number(log.conditionScore);
    const note = typeof log.note === "string" ? log.note : "";
    const items = formRowsToV2Items(log.mainRows, log.subRows);

    try {
      await putRemoteDayV2({
        userId: syncUserId,
        password: syncPassword,
        date,
        conditionScore,
        note,
        items,
        clientLast: {
          conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
          trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
          trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
        },
      });
      setSyncErr(null);
      setV2(prev => {
        const next = { ...prev };
        next.conditionsByDate = { ...(prev.conditionsByDate || {}) };
        next.trainingByDate = { ...(prev.trainingByDate || {}) };
        next.conditionsByDate[date] = { score: conditionScore, updatedAt: new Date().toISOString() };

        const mainItems = items.filter(it => it.category === "main").map(it => ({ ...it, id: `local_${date}_m_${it.sortOrder}` }));
        const subItems = items.filter(it => it.category === "sub").map(it => ({ ...it, id: `local_${date}_s_${it.sortOrder}` }));
        next.trainingByDate[date] = {
          note,
          updatedAt: new Date().toISOString(),
          items: { main: mainItems, sub: subItems },
          itemsUpdatedAtMax: new Date().toISOString(),
        };
        return next;
      });
    } catch (e) {
      const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
      setSyncErr(msg);
      if (e?.code === 409) {
        try { await refetchRemoteV2(); } catch (_) {}
      }
    }

    setTab("training");
  }, [v2, refetchRemoteV2, syncUserId, syncPassword]);

  const updateCondition = useCallback(async (date, value) => {
    const conditionScore = asNullableScore(value);
    const note = v2.trainingByDate?.[date]?.note || "";
    const items = [
      ...(v2.trainingByDate?.[date]?.items?.main || []).map(it => ({ ...it, category: "main" })),
      ...(v2.trainingByDate?.[date]?.items?.sub || []).map(it => ({ ...it, category: "sub" })),
    ];
    try {
      await putRemoteDayV2({
        userId: syncUserId,
        password: syncPassword,
        date,
        conditionScore,
        note,
        items,
        clientLast: {
          conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
          trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
          trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
        },
      });
      setSyncErr(null);
      setV2(prev => {
        const next = { ...prev };
        next.conditionsByDate = { ...(prev.conditionsByDate || {}) };
        next.conditionsByDate[date] = { score: conditionScore, updatedAt: new Date().toISOString() };
        return next;
      });
    } catch (e) {
      const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
      setSyncErr(msg);
      if (e?.code === 409) {
        try { await refetchRemoteV2(); } catch (_) {}
      }
    }
  }, [v2, refetchRemoteV2, syncUserId, syncPassword]);

  const saveLocalBackupNow = useCallback(() => {
    if (!syncUserId) return;
    try {
      const sk = storageSk2(syncUserId);
      const raw = localStorage.getItem(sk);
      if (!raw) {
        window.alert("ローカルデータが見つかりませんでした。");
        return;
      }
      const ts = Date.now();
      localStorage.setItem(`${sk}_backup_${ts}`, raw);
      setBackupTick(t => t + 1);
      window.alert(`バックアップを保存しました: ${new Date(ts).toLocaleString()}`);
    } catch {
      window.alert("バックアップ保存に失敗しました。");
    }
  }, [syncUserId]);

  const setSeedData = useCallback(() => {
    if (!isLocalhost) {
      window.alert("この操作はlocalhost環境でのみ利用できます。");
      return;
    }
    const ok = window.confirm(
      "シードデータにリセットします。リモート（V2/DB）の該当ユーザーデータを全削除してから、正規化シードを投入します。ローカルはバックアップを保存してから置き換えます。実行しますか？",
    );
    if (!ok) return;
    setShowSettings(false);
    try {
      const rawV2 = localStorage.getItem(storageSk2(syncUserId));
      if (rawV2) localStorage.setItem(`${storageSk2(syncUserId)}_backup_${Date.now()}`, rawV2);
    } catch {}
    (async () => {
      try {
        setSeedResetBlocking(true);
        setSyncErr(null);

        await wipeRemoteStateV2(syncUserId, syncPassword);

        const days = [...V2_SEED_DAYS].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        for (const day of days) {
          const items = (day.items || []).map((it, idx) => ({
            category: it.category === "sub" ? "sub" : "main",
            exerciseName: String(it.exerciseName || "").trim(),
            weight: String(it.weight || "").trim(),
            reps: String(it.reps || "").trim(),
            sets: it.sets ?? null,
            sortOrder: typeof it.sortOrder === "number" ? it.sortOrder : idx,
          }));

          await putRemoteDayV2({
            userId: syncUserId,
            password: syncPassword,
            date: day.date,
            conditionScore: day.conditionScore === undefined ? null : day.conditionScore,
            note: typeof day.note === "string" ? day.note : "",
            items,
            clientLast: null,
          });
        }

        const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
        setV2(buildV2StateFromRemote(remote));
        setBackupTick(t => t + 1);
        window.alert("シードデータにリセットしました（V2/DB反映）。");
      } catch (e) {
        window.alert(`シードデータのリセットに失敗しました: ${e?.message || "unknown error"}`);
      } finally {
        setSeedResetBlocking(false);
      }
    })();
  }, [isLocalhost, syncUserId, syncPassword]);

  const deleteAllData = useCallback(() => {
    if (!isLocalhost) {
      window.alert("この操作はlocalhost環境でのみ利用できます。");
      return;
    }
    const ok = window.confirm("データを全て削除します（ローカルの全ログが空になります）。現在のローカルデータはバックアップを保存してから削除します。実行しますか？");
    if (!ok) return;
    try {
      const rawV2 = localStorage.getItem(storageSk2(syncUserId));
      if (rawV2) localStorage.setItem(`${storageSk2(syncUserId)}_backup_${Date.now()}`, rawV2);
    } catch {}
    setV2(emptyV2State(syncUserId));
    saveLocalV2(syncUserId, emptyV2State(syncUserId), Date.now());
    setBackupTick(t => t + 1);
    window.alert("データを全て削除しました（ローカルのみ / V2）。");
  }, [isLocalhost, syncUserId]);

  const restoreLatestLocalBackup = useCallback(() => {
    if (!syncUserId) return;
    const sk = storageSk2(syncUserId);
    const prefix = `${sk}_backup_`;
    let latestKey = null;
    let latestTs = -1;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    if (!latestKey) {
      window.alert("バックアップが見つかりませんでした。");
      return;
    }
    const ok = window.confirm(`最新バックアップ（${new Date(latestTs).toLocaleString()}）からローカルデータを復元しますか？`);
    if (!ok) return;
    try {
      const raw = localStorage.getItem(latestKey);
      if (!raw) throw new Error("empty");
      localStorage.setItem(sk, raw);
      setBackupTick(t => t + 1);
      window.alert("復元しました（ローカルのみ）。画面を再読み込みします。");
      window.setTimeout(() => window.location.reload(), 300);
    } catch {
      window.alert("復元に失敗しました。");
    }
  }, [syncUserId]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", minHeight: "100vh" }}>
      {seedResetBlocking && authed && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(28, 28, 26, 0.42)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 320,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,.12)",
            }}
          >
            <div className="sync-overlay-spinner" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: ".02em", lineHeight: 1.5 }}>
              シードデータにリセット中…
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, letterSpacing: ".04em" }}>
              しばらくお待ちください
            </div>
          </div>
        </div>
      )}

      {!authed && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          opacity: hiding ? 0 : 1,
          transition: "opacity .35s ease",
          pointerEvents: hiding ? "none" : "auto",
        }}>
          <PasswordGate onAuth={handleGateAuth} />
        </div>
      )}

      <AppHeaderTabs
        syncUserId={syncUserId}
        tab={tab}
        setTab={setTab}
        onToggleSettings={() => setShowSettings(s => !s)}
      />

      <main>
        {tab === "dashboard" && (
          <DashboardTab
            key="db"
            v2={v2}
            daySummaries={daySummaries}
            todayISO={todayISO}
            condColor={condColor}
            condLabel={condLabel}
            DateHeader={DateHeader}
            OSBar={OSBar}
            ConditionChartCard={ConditionChartCard}
            SessionMiniCard={SessionMiniCard}
          />
        )}
        {tab === "condition" && (
          <ConditionTabPage
            key="cond"
            v2={v2}
            onUpdateCondition={updateCondition}
            ConditionChartCard={ConditionChartCard}
          />
        )}
        {tab === "training" && (
          <TrainingTabPage
            key="train"
            v2={v2}
            daySummaries={daySummaries}
            onUpsert={addLog}
            todayISO={todayISO}
            fmtDate={fmtDate}
            CondOrb={CondOrb}
            TrainingRecordScreen={TrainingRecordScreen}
          />
        )}
      </main>

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          updateAvailable={updateAvailable}
          onConfirmUpdate={() => {
            setShowSettings(false);
            handleForceUpdate();
          }}
          onBackup={saveLocalBackupNow}
          onRestore={restoreLatestLocalBackup}
          latestLocalBackup={latestLocalBackup}
          latestRemoteBackup={latestRemoteBackup}
          isLocalhost={isLocalhost}
          onSeed={setSeedData}
          onDeleteAll={deleteAllData}
          onLogout={handleLogout}
          appVersion={APP_VERSION}
        />
      )}

      <UpdateAvailableBar
        visible={updateAvailable && !showSettings}
        onOpenSettings={() => setShowSettings(true)}
      />

      <AppFooterMark version={APP_VERSION} />
    </div>
  );
}
