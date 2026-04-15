/**
 * V2 シード（正規化済み）。シード実行時は API で該当 user の行を全削除してから、
 * 日付順に PUT する。
 */
export const V2_SEED_DAYS = [
  // Weight seed (2026-01..04)
  { date: "2026-01-12", weight: 60.6 },
  { date: "2026-01-14", weight: 60.1 },
  { date: "2026-01-15", weight: 59.8 },
  { date: "2026-01-16", weight: 59.9 },
  { date: "2026-01-18", weight: 60.1 },
  { date: "2026-01-19", weight: 59.5 },
  { date: "2026-01-21", weight: 59.4 },
  { date: "2026-01-24", weight: 59.3 },
  { date: "2026-01-25", weight: 59.9 },
  { date: "2026-01-27", weight: 60.7 },
  { date: "2026-01-28", weight: 60.6 },
  { date: "2026-01-29", weight: 59.5 },
  { date: "2026-01-30", weight: 59.0 },
  { date: "2026-01-31", weight: 60.3 },
  { date: "2026-02-01", weight: 60.0 },
  { date: "2026-02-02", weight: 60.1 },
  { date: "2026-02-04", weight: 60.2 },
  { date: "2026-02-09", weight: 60.3 },
  { date: "2026-02-13", weight: 60.2 },
  { date: "2026-02-20", weight: 60.2 },
  { date: "2026-02-24", weight: 60.0 },
  { date: "2026-02-27", weight: 60.3 },
  {
    date: "2026-02-14",
    conditionScore: null,
    note:
      "トレーニングノートの出力ルールを「2週間分の表形式 / コンディション・重量・回数・セット項目」に固定することを決定。Body Beauty Project本格始動。",
    items: [{ category: "main", exerciseName: "プロジェクト設定", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-02-23",
    conditionScore: null,
    note:
      "スクワットで自己ベストを更新。2月中旬から下旬にかけて45kgから52.5kgまで重量を伸ばすことに成功。\nPB更新\nコンパウンド種目中心",
    items: [{ category: "main", exerciseName: "SQ (スクワット)", weight: "52.5kg", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-02-26",
    conditionScore: null,
    note:
      "中枢神経系の疲労を感じたため、強度を落としたディロード期間へ移行。技術練習と回復を優先。\nダンベル種目中心",
    items: [{ category: "main", exerciseName: "ディロード開始", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-02-27",
    conditionScore: null,
    note: "低負荷のダンベル種目で胸の収縮を確認。肩や手首の違和感に対応。\n技術練習",
    weight: 60.3,
    items: [
      { category: "main", exerciseName: "DBP", weight: "8kg", reps: "10*3", sortOrder: 0 },
      { category: "main", exerciseName: "DF", weight: "8kg", reps: "10*3", sortOrder: 1 },
    ],
  },
  {
    date: "2026-02-28",
    conditionScore: null,
    note: "神経系回復のためのウォーキング。グリップ調整などの技術的な確認のみ実施。\n8,000-10,000 steps\nWalking",
    items: [{ category: "main", exerciseName: "Active Recovery", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-03",
    conditionScore: null,
    note: "ジム復帰初日。「握らない」意識でリハビリ。左腕に顕著な疲労の左右差（デバッグが必要）。",
    items: [
      { category: "main", exerciseName: "IDC", weight: "8kg", reps: "10*3", sortOrder: 0 },
      { category: "main", exerciseName: "SR", weight: "7kg", reps: "10*3", sortOrder: 1 },
    ],
  },
  {
    date: "2026-03-07",
    conditionScore: null,
    note: "休み切りフェーズ。身体の信号を優先し、リカバリーに専念。",
    items: [{ category: "main", exerciseName: "完全休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-11",
    conditionScore: 4.5,
    conditionNote: "睡眠は6h前後。起床時の重さはまだ残る。",
    note: "ニュートラル（5.0）まであと一息。翌日3/12からの本格再開に向けてOSを安定させる。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-12",
    conditionScore: 4.8,
    conditionNote: "ジム復帰初日。メンタルは上向き。",
    note: "かなり久しぶりのトレーニング。やっとやっと、回復して来た気がする。ベンチプレスで、かなり回復。\nテンポ 3s",
    weight: 60.6,
    items: [
      { category: "main", exerciseName: "BP (ベンチプレス)", weight: "40kg", reps: "(10,10,9)", sortOrder: 0 },
      { category: "sub", exerciseName: "BB-Curl", weight: "20kg", reps: "(7,7,6)", sortOrder: 0 },
    ],
  },
  {
    date: "2026-03-13",
    conditionScore: 5.2,
    note: "5の大台を突破。OS安定。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-14",
    conditionScore: 5.6,
    note: "アブローラー（膝コロ）。2セット目の粘り増。上昇気流。\nテンポ 3s",
    items: [{ category: "main", exerciseName: "Home (アブローラー)", weight: "自重", reps: "(10,7,6)", sortOrder: 0 }],
  },
  {
    date: "2026-03-15",
    conditionScore: 5.2,
    note: "メインをSQからRDLへ変更。大臀筋下部重視。\nテンポ 3s",
    items: [
      { category: "main", exerciseName: "RDL (ルーマニアンデッドリフト)", weight: "26.5kg", reps: "(10,10,8)", sortOrder: 0 },
      { category: "sub", exerciseName: "バックエクステンション", weight: "—", reps: "(7/7/7)", sortOrder: 0 },
    ],
  },
  {
    date: "2026-03-17",
    conditionScore: null,
    note: "アブローラー（膝コロ）。\nテンポ 3s",
    items: [{ category: "main", exerciseName: "Home (アブローラー)", weight: "自重", reps: "(6,6,6)", sortOrder: 0 }],
  },
  {
    date: "2026-03-18",
    conditionScore: null,
    note: "背中の感覚はまだ。二頭筋に熱感がある。\nテンポ 3s",
    weight: 59.7,
    items: [
      { category: "main", exerciseName: "PU (懸垂)", weight: "🟣バンド", reps: "(10,7,6)", sortOrder: 0 },
      { category: "sub", exerciseName: "LPD", weight: "30kg", reps: "10*3", sortOrder: 0 },
      { category: "sub", exerciseName: "DL", weight: "9kg", reps: "10/15", sortOrder: 1 },
    ],
  },
  {
    date: "2026-03-20",
    conditionScore: 5.3,
    note: "背中にしっかり筋肉痛！嬉しい。胸の肩側の付け根や三頭筋にも心地よい張り。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-21",
    conditionScore: 6.0,
    note: "BP 45kg初挑戦完遂。腕のボリュームも狙った構成。コンディション6.0到達！\nテンポ 3s",
    weight: 59.3,
    items: [
      { category: "main", exerciseName: "BP (ベンチプレス)", weight: "45kg", reps: "(5,5,5)", sortOrder: 0 },
      { category: "sub", exerciseName: "SC", weight: "15kg", reps: "10*3", sortOrder: 0 },
      { category: "sub", exerciseName: "IC", weight: "9kg", reps: "(10,7,7)", sortOrder: 1 },
    ],
  },

  { date: "2026-03-02", weight: 60.2 },
  { date: "2026-03-04", weight: 60.4 },
  { date: "2026-03-06", weight: 60.1 },
  { date: "2026-04-03", weight: 59.3 },
  {
    date: "2026-03-22",
    conditionScore: null,
    note: "アブローラー（膝コロ）。\nテンポ 3s",
    items: [{ category: "main", exerciseName: "Home (アブローラー)", weight: "自重", reps: "(7,7,6)", sortOrder: 0 }],
  },
  {
    date: "2026-03-23",
    conditionScore: null,
    note: "アブローラー（膝コロ）。7回3セットで安定。\nテンポ 3s",
    items: [{ category: "main", exerciseName: "Home (アブローラー)", weight: "自重", reps: "(7,7,7)", sortOrder: 0 }],
  },
  {
    date: "2026-03-24",
    conditionScore: null,
    note: "RDL 25kgで完遂。バックエクステンションも10回3セット。\nテンポ 3s",
    items: [
      { category: "main", exerciseName: "RDL (ルーマニアンデッドリフト)", weight: "25kg", reps: "(10,10,10)", sortOrder: 0 },
      { category: "sub", exerciseName: "バックエクステンション", weight: "—", reps: "(10, 10, 10)", sortOrder: 0 },
    ],
  },
  {
    date: "2026-03-25",
    conditionScore: 5.5,
    note: "4日連続稼働後のOS確認。5.0以上をキープしており良好。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-03-26",
    conditionScore: null,
    note: "懸垂10回3セット完遂。BP強化のため、サブ日に軽重量で組み込むテスト。\nテンポ 3s",
    items: [
      { category: "main", exerciseName: "PU (懸垂)", weight: "🟣バンド", reps: "(10,10,10)", sortOrder: 0 },
      { category: "sub", exerciseName: "LPD", weight: "—", reps: "10*3", sortOrder: 0 },
      { category: "sub", exerciseName: "BP", weight: "40kg", reps: "(9,10,6)", sortOrder: 1 },
      { category: "sub", exerciseName: "DL", weight: "10kg", reps: "10*3", sortOrder: 2 },
    ],
  },
  {
    date: "2026-03-30",
    conditionScore: 5.6,
    note: "アブローラー（膝コロ）。高コンディションを維持しつつ再始動。\nテンポ 3s",
    items: [{ category: "main", exerciseName: "Home (アブローラー)", weight: "自重", reps: "(7,6,6)", sortOrder: 0 }],
  },
  {
    date: "2026-04-02",
    conditionScore: 4.8,
    note: "コンディション 4.8。少し落ち着いた数値。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-04-06",
    conditionScore: 5.3,
    note: "コンディション5.3まで上昇。エネルギーが戻ってきた感覚。",
    items: [{ category: "main", exerciseName: "休息", weight: "—", reps: "—", sortOrder: 0 }],
  },
  {
    date: "2026-04-09",
    conditionScore: null,
    note: "RDLを30kgに増量。背面全体の出力を強化。",
    items: [
      { category: "main", exerciseName: "PU (懸垂)", weight: "自重", reps: "(8,7,6)", sortOrder: 0 },
      { category: "main", exerciseName: "RDL (ルーマニアンデッドリフト)", weight: "30kg", reps: "(7,7,7)", sortOrder: 1 },
      { category: "sub", exerciseName: "LPD", weight: "—", reps: "(3s)", sortOrder: 0 },
      { category: "sub", exerciseName: "DL", weight: "10kg", reps: "(10, 10, 10)", sortOrder: 1 },
    ],
  },
  {
    date: "2026-04-12",
    conditionScore: 6.1,
    note:
      "BP 1セット目自己ベスト更新。DF 2セット目から左手首の痛みにより中断。要デバッグ。コンディション最高値。\nテンポ 3s",
    items: [
      { category: "main", exerciseName: "BP (ベンチプレス)", weight: "45kg", reps: "(7,6,4)", sortOrder: 0 },
      { category: "sub", exerciseName: "DBP", weight: "14kg", reps: "(9,8,7)", sortOrder: 0 },
      { category: "sub", exerciseName: "DF", weight: "8kg", reps: "(9)", sortOrder: 1 },
    ],
  },
];
