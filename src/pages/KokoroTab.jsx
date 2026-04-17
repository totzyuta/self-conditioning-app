import React from "react";
import { condLabelColor } from "../lib/format.js";

export default function KokoroTab({
  v2,
  daySummaries,
  todayISO,
  condLabel,
  DateHeader,
  OSBar,
  ConditionChartCard,
  ConditionTabPage,
  onSaveConditionDay,
  fmtDate,
  ConditionRecordScreen,
}) {
  const today = todayISO();
  const todayCond = v2.conditionsByDate?.[today]?.score;
  const bandLabelColor = todayCond != null ? condLabelColor(Number(todayCond)) : "#9B9890";

  return (
    <div className="fade-up">
      <div style={{ padding: "32px 24px 0" }}>
        <div style={{ marginBottom: 20 }}>
          <DateHeader dateStr={today} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: ".28em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Condition
          </div>
          <div style={{
            fontSize: 104, fontWeight: 100, color: "var(--green)",
            lineHeight: 1, letterSpacing: "-7px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {todayCond != null ? Number(todayCond).toFixed(1) : "—"}
          </div>
          <div style={{ marginTop: 10 }}>
            {todayCond != null ? (
              <span style={{ fontSize: 12, color: bandLabelColor }}>{condLabel(Number(todayCond))}</span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>本日の記録なし</span>
            )}
          </div>
        </div>

        {todayCond != null && (
          <div style={{ marginBottom: 28 }}>
            <OSBar value={Number(todayCond)} />
          </div>
        )}

        <div>
          <ConditionChartCard v2={v2} defaultPeriod="1m" height={110} />
        </div>
      </div>

      <div style={{ paddingTop: 8 }}>
        <ConditionTabPage
          v2={v2}
          onSaveConditionDay={onSaveConditionDay}
          todayISO={todayISO}
          fmtDate={fmtDate}
          ConditionChartCard={ConditionChartCard}
          ConditionRecordScreen={ConditionRecordScreen}
          hideTopChart
          embedded
        />
      </div>
    </div>
  );
}

