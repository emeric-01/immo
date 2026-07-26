export const adminPermissions = [
  "properties:read",
  "properties:create",
  "properties:update_own",
  "properties:write",
  "buyer_searches:read",
  "estimations:read",
  "clients:read",
  "referrals:read",
  "city_searches:read",
  "audience:read",
  "contents:read",
  "contents:write",
  "users:manage",
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

export const adminPermissionOptions: Array<{
  description: string;
  label: string;
  permission: AdminPermission;
}> = [
  { permission: "properties:read", label: "Voir les biens", description: "Affiche le menu Biens et la liste du catalogue." },
  { permission: "properties:create", label: "Créer des biens", description: "Permet d'ajouter de nouvelles annonces." },
  { permission: "properties:update_own", label: "Modifier ses biens", description: "Permet de modifier uniquement les biens créés par ce compte." },
  { permission: "properties:write", label: "Gérer tous les biens", description: "Permet de modifier, supprimer et réordonner tous les biens." },
  { permission: "buyer_searches:read", label: "Recherches", description: "Accès aux demandes des acquéreurs." },
  { permission: "estimations:read", label: "Estimations", description: "Accès aux demandes et résultats d'estimation." },
  { permission: "clients:read", label: "Clients", description: "Accès aux comptes et coordonnées clients." },
  { permission: "referrals:read", label: "Parrainages", description: "Accès aux dossiers de parrainage." },
  { permission: "city_searches:read", label: "Villes recherchées", description: "Accès aux recherches de villes non référencées." },
  { permission: "audience:read", label: "Audience", description: "Accès aux statistiques de fréquentation." },
  { permission: "contents:read", label: "Voir les contenus", description: "Accès au menu éditorial." },
  { permission: "contents:write", label: "Modifier les contenus", description: "Création et modification des articles." },
  { permission: "users:manage", label: "Utilisateurs", description: "Création des comptes et gestion de leurs accès." },
];

export const defaultPermissionsByRole = {
  admin: [...adminPermissions],
  bootstrap: [...adminPermissions],
  editor: ["contents:read", "contents:write"],
  agent: [
    "properties:read",
    "properties:create",
    "properties:update_own",
    "buyer_searches:read",
    "estimations:read",
    "clients:read",
    "referrals:read",
  ],
  manager: adminPermissions.filter((permission) => permission !== "users:manage"),
} satisfies Record<string, AdminPermission[]>;

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === "string" && adminPermissions.includes(value as AdminPermission);
}
