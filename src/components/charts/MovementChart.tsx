"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type MovementChartPoint = {
  index: number;
  weight: number;
  reps: number;
  rest: number;
};

type MovementChartProps = {
  points: MovementChartPoint[];
  visibleLines: {
    weight: boolean;
    reps: boolean;
    rest: boolean;
  };
  onToggleLine: (key: "weight" | "reps" | "rest") => void;
  showLegend?: boolean;
  showPointLabels?: boolean;
  heightClassName?: string;
};

export default function MovementChart({
  points,
  visibleLines,
  onToggleLine,
  showLegend = true,
  showPointLabels = false,
  heightClassName = "h-52",
}: MovementChartProps) {
  const labelConfig = showPointLabels
    ? { position: "top" as const, fontSize: 9, fill: "#0f172a", offset: 6 }
    : undefined;

  return (
    <div className="px-0">
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onToggleLine("weight")}
          className={`rounded-md border px-2.5 py-1 font-semibold transition ${
            visibleLines.weight
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          Beban
        </button>
        <button
          type="button"
          onClick={() => onToggleLine("reps")}
          className={`rounded-md border px-2.5 py-1 font-semibold transition ${
            visibleLines.reps
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          Reps
        </button>
        <button
          type="button"
          onClick={() => onToggleLine("rest")}
          className={`rounded-md border px-2.5 py-1 font-semibold transition ${
            visibleLines.rest
              ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          Rest
        </button>
      </div>
      <div className={`${heightClassName} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 20, right: 14, left: 6, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="index" tick={{ fontSize: 9 }} tickMargin={6} padding={{ left: 16, right: 16 }} />
            <YAxis tick={{ fontSize: 9 }} width={20} tickMargin={10} axisLine padding={{ top: 17, bottom: 6 }} />
            <Tooltip
              labelClassName="text-[10px] font-light"
              wrapperClassName="text-[10px]"
              formatter={(value, name) => {
                if (name === "weight") return [`${value} kg`, "Beban"];
                if (name === "reps") return [`${value} reps`, "Reps"];
                return [`${value} sec`, "Rest"];
              }}
              labelFormatter={(label) => `Set ${label}`}
              separator=" "
              contentStyle={{
                padding: "6px 8px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.16)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
              }}
              itemStyle={{ padding: 0, margin: "2px 0" }}
              labelStyle={{ marginBottom: 4 }}
            />
            {visibleLines.weight && (
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#6ee7b7"
                strokeWidth={3}
                dot={{ r: 4 }}
                label={labelConfig}
              />
            )}
            {visibleLines.reps && (
              <Line
                type="monotone"
                dataKey="reps"
                stroke="#93c5fd"
                strokeWidth={2}
                dot={{ r: 3 }}
                label={labelConfig}
              />
            )}
            {visibleLines.rest && (
              <Line
                type="monotone"
                dataKey="rest"
                stroke="#d8b4fe"
                strokeWidth={2}
                dot={{ r: 3 }}
                label={labelConfig}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className={`flex items-center gap-2 ${visibleLines.weight ? "" : "opacity-40"}`}>
            <span className="h-2 w-2 rounded-full bg-[#6ee7b7]" />
            Beban (kg)
          </span>
          <span className={`flex items-center gap-2 ${visibleLines.reps ? "" : "opacity-40"}`}>
            <span className="h-2 w-2 rounded-full bg-[#93c5fd]" />
            Reps
          </span>
          <span className={`flex items-center gap-2 ${visibleLines.rest ? "" : "opacity-40"}`}>
            <span className="h-2 w-2 rounded-full bg-[#d8b4fe]" />
            Rest (sec)
          </span>
        </div>
      )}
    </div>
  );
}
