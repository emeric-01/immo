"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PropertyAnalyticsSummary } from "@/lib/property-analytics";
import styles from "./analytics.module.css";

export function PropertyAnalyticsCharts({ summary }: { summary: PropertyAnalyticsSummary }) {
  return <section className={styles.charts}>
    <article className={styles.chartCard}><header><div><span>Évolution</span><h2>Vues et contacts sur 30 jours</h2></div></header><div className={styles.chart}><ResponsiveContainer height="100%" width="100%"><LineChart data={summary.daily} margin={{ left: -18, right: 8, top: 12 }}><CartesianGrid stroke="#eee5dc" strokeDasharray="4 4" vertical={false}/><XAxis axisLine={false} dataKey="date" fontSize={11} interval={4} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} fontSize={11} tickLine={false}/><Tooltip contentStyle={{ border:"1px solid #e3d8ce", borderRadius:8, boxShadow:"0 10px 30px #2b1b0e15" }}/><Line dataKey="views" dot={false} name="Vues" stroke="#b77547" strokeWidth={2.5}/><Line dataKey="contacts" dot={false} name="Contacts" stroke="#171512" strokeWidth={2}/></LineChart></ResponsiveContainer></div></article>
    <article className={styles.sideCard}><span>Répartition</span><h2>Appareils</h2>{summary.devices.length?summary.devices.map(device=><div className={styles.barRow} key={device.name}><div><strong>{device.name === "mobile" ? "Mobile" : device.name === "tablet" ? "Tablette" : "Ordinateur"}</strong><small>{device.value} vues</small></div><span><i style={{width:`${Math.round(device.value/Math.max(summary.totalViews,1)*100)}%`}}/></span></div>):<p>Pas encore assez de données.</p>}</article>
  </section>;
}
