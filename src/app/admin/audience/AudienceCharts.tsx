"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SiteAnalyticsSummary } from "@/lib/site-analytics";
import styles from "./audience.module.css";

type HumanMetric = "humains" | "visiteurs";

export function AudienceCharts({ summary }: { summary: SiteAnalyticsSummary }) {
  const [humanMetric, setHumanMetric] = useState<HumanMetric>("humains");
  const audience = summary.audience.filter((item) => item.value > 0);
  const humanMetricName = humanMetric === "humains" ? "Pages vues humaines" : "Visiteurs uniques";

  return <section className={styles.charts}>
    <article className={styles.chartCard}>
      <header className={styles.chartHeader}>
        <div><span>Tendance</span><h2>Trafic quotidien</h2></div>
        <div aria-label="Mesure du trafic humain" className={styles.metricToggle} role="group">
          <button aria-pressed={humanMetric === "humains"} onClick={() => setHumanMetric("humains")} type="button">Pages vues</button>
          <button aria-pressed={humanMetric === "visiteurs"} onClick={() => setHumanMetric("visiteurs")} type="button">Visiteurs uniques</button>
        </div>
      </header>
      <div className={styles.mainChart}>
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={summary.daily} margin={{ left: 0, right: 0, top: 12 }}>
            <defs><linearGradient id="humanFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b77547" stopOpacity=".3"/><stop offset="1" stopColor="#b77547" stopOpacity="0"/></linearGradient></defs>
            <CartesianGrid stroke="#eee5dc" strokeDasharray="4 4" vertical={false}/>
            <XAxis axisLine={false} dataKey="date" fontSize={11} interval="preserveStartEnd" tickLine={false}/>
            <YAxis allowDecimals={false} axisLine={false} fontSize={11} tick={{ fill: "#b77547" }} tickLine={false} width={36} yAxisId="human"/>
            <YAxis allowDecimals={false} axisLine={false} fontSize={11} orientation="right" tick={{ fill: "#171512" }} tickLine={false} width={42} yAxisId="robot"/>
            <Tooltip contentStyle={{ border: "1px solid #e3d8ce", borderRadius: 8 }}/>
            <Area dataKey={humanMetric} fill="url(#humanFill)" key={humanMetric} name={humanMetricName} stroke="#b77547" strokeWidth={2.5} yAxisId="human"/>
            <Area dataKey="robots" fill="transparent" name="Robots" stroke="#171512" strokeDasharray="5 4" strokeWidth={1.8} yAxisId="robot"/>
            <Area dataKey="incertains" fill="transparent" name="Incertain" stroke="#aaa097" strokeWidth={1.5} yAxisId="human"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
    <article className={styles.chartCard}><header><span>Qualité</span><h2>Nature du trafic</h2></header><div className={styles.pieChart}>{audience.length ? <ResponsiveContainer height="100%" width="100%"><PieChart><Pie data={audience} dataKey="value" innerRadius={55} outerRadius={82} paddingAngle={3}>{audience.map((entry) => <Cell fill={entry.color} key={entry.name}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer> : <p className={styles.empty}>Les données apparaîtront après les premières visites.</p>}</div><div className={styles.legend}>{summary.audience.map((item) => <div key={item.name}><i style={{ background: item.color }}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></article>
  </section>;
}
