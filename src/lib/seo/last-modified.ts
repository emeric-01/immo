export type LastModifiedValue = Date | string | null | undefined;

export function latestLastModified(...values: LastModifiedValue[]) {
  const timestamps = values
    .map((value) => value instanceof Date ? value.getTime() : value ? Date.parse(value) : Number.NaN)
    .filter(Number.isFinite);

  if (timestamps.length === 0) return undefined;

  return new Date(Math.max(...timestamps)).toISOString();
}

export function getPricePageLastModified(...contentDates: LastModifiedValue[]) {
  return latestLastModified(
    ...contentDates,
    process.env.SEO_PRICE_PAGE_TEMPLATE_LAST_MODIFIED,
  );
}
