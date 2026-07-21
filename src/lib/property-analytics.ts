import "server-only";
import { adminRest } from "@/lib/properties";

type AnalyticsEvent = { event_type: "view"|"visit_request"|"phone_click"|"email_click"; visitor_hash: string; referrer_host: string|null; device_type: "mobile"|"tablet"|"desktop"; created_at: string };
export type PropertyAnalyticsSummary = { totalViews:number;uniqueVisitors:number;views7Days:number;views30Days:number;contacts:number;conversionRate:number;daily:Array<{date:string;views:number;contacts:number}>;devices:Array<{name:string;value:number}>;sources:Array<{name:string;value:number}>;actions:{visitRequests:number;phoneClicks:number;emailClicks:number} };

export async function getPropertyAnalytics(propertyId:string):Promise<PropertyAnalyticsSummary>{
  const events=await adminRest<AnalyticsEvent[]>(`property_analytics_events?property_id=eq.${encodeURIComponent(propertyId)}&select=event_type,visitor_hash,referrer_host,device_type,created_at&order=created_at.asc`);
  const now=Date.now(),views=events.filter(event=>event.event_type==="view"),contacts=events.filter(event=>event.event_type!=="view");
  const dailyMap=new Map<string,{views:number;contacts:number}>();for(let index=29;index>=0;index--){const date=new Date(now-index*86400000).toISOString().slice(0,10);dailyMap.set(date,{views:0,contacts:0});}
  for(const event of events){const date=event.created_at.slice(0,10);const day=dailyMap.get(date);if(day){if(event.event_type==="view")day.views++;else day.contacts++;}}
  const countBy=<T extends string>(values:T[])=>[...values.reduce((map,value)=>map.set(value,(map.get(value)??0)+1),new Map<T,number>())].sort((a,b)=>b[1]-a[1]);
  const sourceNames=views.map(event=>event.referrer_host||"Accès direct");
  const actions={visitRequests:contacts.filter(event=>event.event_type==="visit_request").length,phoneClicks:contacts.filter(event=>event.event_type==="phone_click").length,emailClicks:contacts.filter(event=>event.event_type==="email_click").length};
  return{totalViews:views.length,uniqueVisitors:new Set(views.map(event=>event.visitor_hash)).size,views7Days:views.filter(event=>now-new Date(event.created_at).getTime()<=7*86400000).length,views30Days:views.filter(event=>now-new Date(event.created_at).getTime()<=30*86400000).length,contacts:contacts.length,conversionRate:views.length?Number((contacts.length/views.length*100).toFixed(1)):0,daily:[...dailyMap].map(([date,value])=>({date:date.slice(5),...value})),devices:countBy(views.map(event=>event.device_type)).map(([name,value])=>({name,value})),sources:countBy(sourceNames).slice(0,5).map(([name,value])=>({name,value})),actions};
}
