"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import type { CityPriceHistoryPoint } from "@/lib/city-market-data";

type CityMarketChartProps = {
  averagePrice: number;
  cityName: string;
  points: CityPriceHistoryPoint[];
};

type Period = "5y" | "all";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function MarketTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<TooltipValueType, number | string>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="city-chart-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <div key={String(item.dataKey)}>
          <i style={{ background: item.color }} />
          <span>{item.name}</span>
          <strong>{priceFormatter.format(Number(item.value))} €/m²</strong>
        </div>
      ))}
    </div>
  );
}

export function CityMarketChart({ averagePrice, cityName, points }: CityMarketChartProps) {
  const [period, setPeriod] = useState<Period>("all");
  const data = useMemo(() => {
    if (period === "all") {
      return points;
    }

    return points.slice(-6);
  }, [period, points]);

  return (
    <div className="city-interactive-chart">
      <div className="city-chart-controls">
        <div aria-label="Période du graphique" role="group">
          <button
            className={period === "5y" ? "active" : ""}
            onClick={() => setPeriod("5y")}
            type="button"
          >
            5 ans
          </button>
          <button
            className={period === "all" ? "active" : ""}
            onClick={() => setPeriod("all")}
            type="button"
          >
            Depuis 2014
          </button>
        </div>
        <span>Survolez la courbe pour afficher les prix</span>
      </div>

      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ bottom: 4, left: 0, right: 12, top: 18 }}
        responsive
        style={{ height: 390, width: "100%" }}
      >
        <defs>
          <linearGradient id="apartmentGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b77b4c" stopOpacity={0.24} />
            <stop offset="100%" stopColor="#b77b4c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="houseGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#72775a" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#72775a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e9e2d9" strokeDasharray="4 7" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="period"
          minTickGap={42}
          tick={{ fill: "#81796f", fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          domain={["dataMin - 250", "dataMax + 250"]}
          tick={{ fill: "#81796f", fontSize: 12 }}
          tickFormatter={(value) => `${Math.round(value / 1000)}k €`}
          tickLine={false}
          width={48}
        />
        <ReferenceLine
          label={{ fill: "#81796f", fontSize: 11, position: "insideTopRight", value: `Moyenne ${cityName}` }}
          stroke="#b9ada0"
          strokeDasharray="3 5"
          y={averagePrice}
        />
        <Tooltip content={MarketTooltip} cursor={{ stroke: "#171612", strokeDasharray: "4 4" }} />
        <Area
          activeDot={{ fill: "#171612", r: 6, stroke: "#fff", strokeWidth: 3 }}
          dataKey="apartment"
          fill="url(#apartmentGradient)"
          name="Appartement"
          stroke="#b77b4c"
          strokeWidth={3}
          type="monotone"
        />
        <Area
          activeDot={{ fill: "#72775a", r: 6, stroke: "#fff", strokeWidth: 3 }}
          dataKey="house"
          fill="url(#houseGradient)"
          name="Maison"
          stroke="#72775a"
          strokeWidth={3}
          type="monotone"
        />
      </AreaChart>
    </div>
  );
}
