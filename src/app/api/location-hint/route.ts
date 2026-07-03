import { NextResponse } from "next/server";

function readVercelHeader(headers: Headers, key: string) {
  const value = headers.get(key);

  return value ? decodeURIComponent(value) : undefined;
}

export async function GET(request: Request) {
  const city = readVercelHeader(request.headers, "x-vercel-ip-city");
  const region = readVercelHeader(request.headers, "x-vercel-ip-country-region");
  const country = readVercelHeader(request.headers, "x-vercel-ip-country");

  return NextResponse.json({
    city,
    region,
    country,
  });
}
