import React from "react";

export default function ConditionTab({ v2, onUpdateCondition, ConditionChartCard }) {
  return (
    <div className="fade-up" style={{ padding: "28px 24px 56px" }}>
      <ConditionChartCard
        v2={v2}
        defaultPeriod="1m"
        height={140}
        showRecord={true}
        onUpdateCondition={onUpdateCondition}
      />
    </div>
  );
}
