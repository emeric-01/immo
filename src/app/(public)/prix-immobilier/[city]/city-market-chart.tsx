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
import type {
  CityPriceHistoryCoverage,
  CityPriceHistoryPoint,
  CityPriceHistorySource,
} from "@/lib/city-market-data";
import {
  buildCityPriceHistoryCoverage,
  prepareCityPriceHistoryForDisplay,
  type DisplayCityPriceHistoryPoint,
} from "@/lib/price-history";

type CityMarketChartProps = {
  averagePrice?: number;
  cityName: string;
  defaultPeriod?: Period;
  historyCoverage?: CityPriceHistoryCoverage;
  historySource?: CityPriceHistorySource;
  points: CityPriceHistoryPoint[];
};

type Period = "5y" | "all";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function yearFromPeriod(period: string) {
  const year = Number.parseInt(period.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function filterCityMarketPoints(points: DisplayCityPriceHistoryPoint[], period: Period) {
  if (period === "all" || points.length === 0) return points;

  const latestYear = points.reduce<number | null>((latest, point) => {
    const year = yearFromPeriod(point.period);
    if (year === null) return latest;
    return latest === null ? year : Math.max(latest, year);
  }, null);

  if (latestYear === null) return points.slice(-5);

  return points.filter((point) => {
    const year = yearFromPeriod(point.period);
    return year !== null && year >= latestYear - 4;
  });
}

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
      {payload.map((item) => {
        const point = item.payload as DisplayCityPriceHistoryPoint | undefined;
        const source = item.dataKey === "apartment" ? point?.apartmentSource : point?.houseSource;
        return (
          <div key={String(item.dataKey)}>
            <i style={{ background: item.color }} />
            <span>
              {item.name}
              {source ? <small> · {source === "dvf" ? "DVF" : "Immo Data stocké"}</small> : null}
            </span>
            <strong>{priceFormatter.format(Number(item.value))} €/m²</strong>
          </div>
        );
      })}
    </div>
  );
}

export function CityMarketChart({
  averagePrice,
  cityName,
  defaultPeriod = "all",
  historyCoverage,
  historySource,
  points,
}: CityMarketChartProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const effectiveCoverage = useMemo(
    () => historyCoverage ?? buildCityPriceHistoryCoverage(points),
    [historyCoverage, points],
  );
  const displayPoints = useMemo(
    () => prepareCityPriceHistoryForDisplay(points, effectiveCoverage),
    [effectiveCoverage, points],
  );
  const data = useMemo(() => filterCityMarketPoints(displayPoints, period), [displayPoints, period]);
  const firstHistoryYear = yearFromPeriod(effectiveCoverage.expectedFrom || displayPoints[0]?.period || "");
  const hasApartmentHistory = displayPoints.some((point) => point.apartment !== undefined);
  const hasHouseHistory = displayPoints.some((point) => point.house !== undefined);
  const missingApartmentPeriods = data.filter((point) => point.apartment === undefined).map((point) => point.period);
  const missingHousePeriods = data.filter((point) => point.house === undefined).map((point) => point.period);
  const sourceLabel = historySource === "immo-data-dvf"
    ? "Immo Data stocké + DVF"
    : historySource === "immo-data"
      ? "Historique Immo Data stocké"
      : historySource === "dvf"
        ? "Historique DVF"
        : "Source de l’historique non renseignée";

  if (!hasApartmentHistory && !hasHouseHistory) {
    return (
      <div className="city-interactive-chart city-chart-unavailable" role="note">
        <strong>Historique indisponible pour {cityName}</strong>
        <span>Aucune valeur n’est affichée ou estimée tant que la source n’est pas vérifiée.</span>
      </div>
    );
  }

  return (
    <div className="city-interactive-chart">
      <div className="city-chart-controls">
        <div aria-label="Période du graphique" role="group">
          <button
            aria-pressed={period === "5y"}
            className={period === "5y" ? "active" : ""}
            onClick={() => setPeriod("5y")}
            type="button"
          >
            5 ans
          </button>
          <button
            aria-pressed={period === "all"}
            className={period === "all" ? "active" : ""}
            onClick={() => setPeriod("all")}
            type="button"
          >
            Depuis {firstHistoryYear ?? "l’origine"}
          </button>
        </div>
        <span>{sourceLabel}</span>
      </div>

      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ bottom: 4, left: 0, right: 12, top: 18 }}
        responsive
        style={{ height: 250, width: "100%" }}
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
          interval="preserveStartEnd"
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
        {typeof averagePrice === "number" ? (
          <ReferenceLine
            label={{ fill: "#81796f", fontSize: 11, position: "insideTopRight", value: `Moyenne ${cityName}` }}
            stroke="#b9ada0"
            strokeDasharray="3 5"
            y={averagePrice}
          />
        ) : null}
        <Tooltip content={MarketTooltip} cursor={{ stroke: "#171612", strokeDasharray: "4 4" }} />
        {hasApartmentHistory ? (
          <Area
            activeDot={{ fill: "#171612", r: 6, stroke: "#fff", strokeWidth: 3 }}
            dataKey="apartment"
            connectNulls={false}
            fill="url(#apartmentGradient)"
            name="Appartement"
            stroke="#b77b4c"
            strokeWidth={3}
            type="monotone"
          />
        ) : null}
        {hasHouseHistory ? (
          <Area
            activeDot={{ fill: "#72775a", r: 6, stroke: "#fff", strokeWidth: 3 }}
            dataKey="house"
            connectNulls={false}
            fill="url(#houseGradient)"
            name="Maison"
            stroke="#72775a"
            strokeWidth={3}
            type="monotone"
          />
        ) : null}
      </AreaChart>
      {missingApartmentPeriods.length > 0 || missingHousePeriods.length > 0 ? (
        <p className="city-chart-data-warning" role="note">
          Données non disponibles —
          {missingApartmentPeriods.length > 0 ? ` appartements : ${missingApartmentPeriods.join(", ")}` : ""}
          {missingApartmentPeriods.length > 0 && missingHousePeriods.length > 0 ? " ·" : ""}
          {missingHousePeriods.length > 0 ? ` maisons : ${missingHousePeriods.join(", ")}` : ""}.
          La courbe est interrompue ; aucune valeur de remplacement n’est inventée.
        </p>
      ) : null}
    </div>
  );
}
