"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Home, LoaderCircle, Save } from "lucide-react";
import styles from "../properties.module.css";

export type OrderedProperty = {
  cityName: string;
  id: string;
  imageUrl: string | null;
  status: "published" | "sold";
  title: string;
};

type Group = "published" | "sold";

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PropertyOrderManager({ properties }: { properties: OrderedProperty[] }) {
  const router = useRouter();
  const [published, setPublished] = useState(() => properties.filter((property) => property.status === "published"));
  const [sold, setSold] = useState(() => properties.filter((property) => property.status === "sold"));
  const [dragged, setDragged] = useState<{ group: Group; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  const update = (group: Group, next: OrderedProperty[]) => {
    if (group === "published") setPublished(next);
    else setSold(next);
    setDirty(true);
    setMessage("");
  };

  const shift = (group: Group, index: number, direction: -1 | 1) => {
    const items = group === "published" ? published : sold;
    update(group, move(items, index, index + direction));
  };

  const drop = (group: Group, targetId: string) => {
    if (!dragged || dragged.group !== group) return;
    const items = group === "published" ? published : sold;
    update(group, move(items, items.findIndex((item) => item.id === dragged.id), items.findIndex((item) => item.id === targetId)));
    setDragged(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/properties/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedIds: published.map(({ id }) => id), soldIds: sold.map(({ id }) => id) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible.");
      setDirty(false);
      setMessage("Ordre enregistré.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (group: Group, label: string, items: OrderedProperty[]) => <section className={styles.orderGroup}>
    <header className={styles.orderGroupHeader}><h3>{label}</h3><span>{items.length} bien{items.length > 1 ? "s" : ""}</span></header>
    {items.length ? <div className={styles.orderList}>{items.map((property, index) => <article
      className={styles.orderRow}
      data-dragging={dragged?.id === property.id}
      draggable
      key={property.id}
      onDragEnd={() => setDragged(null)}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={() => setDragged({ group, id: property.id })}
      onDrop={() => drop(group, property.id)}
    >
      <span className={styles.orderHandle} aria-hidden="true"><GripVertical/></span>
      <strong className={styles.orderPosition}>{index + 1}</strong>
      <span className={styles.orderImage}>{property.imageUrl ? <Image alt="" height={54} src={property.imageUrl} width={72}/> : <Home/>}</span>
      <span className={styles.orderInfo}><strong>{property.title}</strong><small>{property.cityName}</small></span>
      {group === "published" && index === 0 ? <span className={styles.featuredLabel}>Grande carte</span> : null}
      <span className={styles.orderControls}>
        <button aria-label={`Monter ${property.title}`} disabled={index === 0} onClick={() => shift(group, index, -1)} title="Monter" type="button"><ArrowUp/></button>
        <button aria-label={`Descendre ${property.title}`} disabled={index === items.length - 1} onClick={() => shift(group, index, 1)} title="Descendre" type="button"><ArrowDown/></button>
      </span>
    </article>)}</div> : <p className={styles.orderEmpty}>Aucun bien dans cette catégorie.</p>}
  </section>;

  return <section className={styles.orderPanel}>
    <header className={styles.orderHeader}>
      <div><p>Page publique</p><h2>Ordre d’affichage</h2><span>Glissez les lignes ou utilisez les flèches. Le premier bien en vente occupe la grande carte.</span></div>
      <div><button disabled={!dirty || saving} onClick={save} type="button">{saving ? <LoaderCircle className={styles.spin}/> : <Save/>} Enregistrer l’ordre</button>{message ? <small data-error={!message.includes("enregistré")}>{message}</small> : null}</div>
    </header>
    <div className={styles.orderGroups}>{renderGroup("published", "Biens en vente", published)}{renderGroup("sold", "Biens vendus, affichés à la fin", sold)}</div>
  </section>;
}
