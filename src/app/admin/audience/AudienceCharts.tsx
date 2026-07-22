"use client";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SiteAnalyticsSummary } from "@/lib/site-analytics";
import styles from "./audience.module.css";

export function AudienceCharts({ summary }: { summary: SiteAnalyticsSummary }) {
  const audience = summary.audience.filter((item) => item.value > 0);
  return <section className={styles.charts}>
    <article className={styles.chartCard}><header><span>Tendance</span><h2>Trafic quotidien</h2></header><div className={styles.mainChart}><ResponsiveContainer height="100%" width="100%"><AreaChart data={summary.daily} margin={{ left: -18, right: 8, top: 12 }}><defs><linearGradient id="humanFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b77547" stopOpacity=".3"/><stop offset="1" stopColor="#b77547" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#eee5dc" strokeDasharray="4 4" vertical={false}/><XAxis axisLine={false} dataKey="date" fontSize={11} interval="preserveStartEnd" tickLine={false}/><YAxis allowDecimals={false} axisLine={false} fontSize={11} tickLine={false}/><Tooltip contentStyle={{ border: "1px solid #e3d8ce", borderRadius: 8 }}/><Area dataKey="humains" fill="url(#humanFill)" name="Humains" stroke="#b77547" strokeWidth={2.5}/><Area dataKey="robots" fill="transparent" name="Robots" stroke="#171512" strokeDasharray="5 4" strokeWidth={1.8}/><Area dataKey="incertains" fill="transparent" name="Incertain" stroke="#aaa097" strokeWidth={1.5}/></AreaChart></ResponsiveContainer></div></article>
    <article className={styles.chartCard}><header><span>Qualité</span><h2>Nature du trafic</h2></header><div className={styles.pieChart}>{audience.length ? <ResponsiveContainer height="100%" width="100%"><PieChart><Pie data={audience} dataKey="value" innerRadius={55} outerRadius={82} paddingAngle={3}>{audience.map((entry) => <Cell fill={entry.color} key={entry.name}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer> : <p className={styles.empty}>Les données apparaîtront après les premières visites.</p>}</div><div className={styles.legend}>{summary.audience.map((item) => <div key={item.name}><i style={{ background: item.color }}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></article>
  </section>;
}
