import "server-only";

import { getCityByMarketIdentifier } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import type { CityMarketData, CitySalePoint } from "@/lib/city-market-data";
import type { Property } from "@/lib/properties";

export type PropertyMarketScore = {
  score: number; listingPricePerM2: number; referencePricePerM2: number; gapPercent: number;
  comparableCount: number; source: "DVF + marché ville" | "Marché ville"; updatedAt: string;
  status: "coherent" | "watch" | "high-gap"; label: string;
};

function median(values: number[]) { const sorted=[...values].sort((a,b)=>a-b);const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2; }
function comparablePrices(property:Property,sales:CitySalePoint[]){const expectedType=property.property_type==="house"?"Maison":"Appartement";return sales.filter(sale=>sale.propertyType===expectedType&&typeof sale.pricePerM2==="number"&&sale.pricePerM2>0).filter(sale=>!property.surface_m2||!sale.surfaceM2||(sale.surfaceM2>=property.surface_m2*.6&&sale.surfaceM2<=property.surface_m2*1.6)).map(sale=>sale.pricePerM2 as number);}

export function calculatePropertyMarketScore(property:Property,market:CityMarketData):PropertyMarketScore|null{
  if(!property.surface_m2||property.surface_m2<=0||property.price<=0||!["apartment","house"].includes(property.property_type))return null;
  const listingPricePerM2=property.price/property.surface_m2;const cityReference=property.property_type==="house"?market.house.averagePricePerM2:market.apartment.averagePricePerM2;if(!cityReference||cityReference<=0)return null;
  const comparables=comparablePrices(property,market.salePoints);const referencePricePerM2=comparables.length>=2?median(comparables)*.7+cityReference*.3:cityReference;const gapPercent=((listingPricePerM2-referencePricePerM2)/referencePricePerM2)*100;const absoluteGap=Math.abs(gapPercent);const score=Math.max(0,Math.min(100,Math.round(100-absoluteGap*2.5)));const status=absoluteGap<=8?"coherent":absoluteGap<=16?"watch":"high-gap";
  return{score,listingPricePerM2:Math.round(listingPricePerM2),referencePricePerM2:Math.round(referencePricePerM2),gapPercent:Number(gapPercent.toFixed(1)),comparableCount:comparables.length,source:comparables.length>=2?"DVF + marché ville":"Marché ville",updatedAt:market.updatedAt,status,label:status==="coherent"?"Prix cohérent":status==="watch"?"À surveiller":"Écart marqué"};
}

export async function getPropertyMarketScores(properties:Property[]){const markets=new Map<string,CityMarketData>();const uniqueCities=[...new Set(properties.map(property=>property.city_name))];await Promise.all(uniqueCities.map(async cityName=>{const city=getCityByMarketIdentifier({name:cityName});if(!city)return;const cached=await readCityMarketCache(city);if(cached?.data)markets.set(cityName,cached.data);}));return new Map(properties.map(property=>[property.id,markets.has(property.city_name)?calculatePropertyMarketScore(property,markets.get(property.city_name) as CityMarketData):null]));}
