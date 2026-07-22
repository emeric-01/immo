export type PublicPropertySort = "manual" | "recent" | "price-asc" | "price-desc";

type OrderableProperty = {
  created_at: string;
  display_order: number;
  price: number;
  published_at: string | null;
  status: string;
};

function publicationTime(property: OrderableProperty) {
  return new Date(property.published_at || property.created_at).getTime();
}

export function comparePublicProperties(sort: PublicPropertySort) {
  return (a: OrderableProperty, b: OrderableProperty) => {
    if (a.status !== b.status) return a.status === "sold" ? 1 : -1;
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "recent") return publicationTime(b) - publicationTime(a);
    return a.display_order - b.display_order || publicationTime(b) - publicationTime(a);
  };
}
