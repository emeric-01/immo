import "server-only";

export async function getStaticMapImage(coordinates?: { latitude: number; longitude: number }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  if (!token || !coordinates) return null;
  const longitude = coordinates.longitude.toFixed(6);
  const latitude = coordinates.latitude.toFixed(6);
  const overlay = `pin-l+bd7446(${longitude},${latitude})`;
  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${overlay}/${longitude},${latitude},14.2,0/1000x520@2x?access_token=${encodeURIComponent(token)}&logo=false&attribution=false`;
  const response = await fetch(url, { cache: "force-cache", next: { revalidate: 2_592_000 } });
  if (!response.ok) {
    console.error("Mapbox static image unavailable", response.status);
    return null;
  }
  return Buffer.from(await response.arrayBuffer());
}
