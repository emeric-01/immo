import "server-only";

import type { AdminSession } from "@/lib/admin/auth";
import type { AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";
import type { AdminClientAccount, AdminDataState } from "@/lib/admin/clients";
import type { ClientEstimationRow } from "@/lib/client-access/estimations";
import { clientSupabaseRequest } from "@/lib/client-access/supabase";
import { createImmoDataEstimation, type PropertyEstimationInput } from "@/lib/immo-data";
import { createInternalBuyerSearchRecord } from "@/lib/buyer-search/database";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import { getPersistableAdminUserId } from "@/lib/admin/session-user-id";

export type CrmContactStatus = "active" | "archived" | "prospect";

export type CrmContact = {
  assigned_admin_user_id: string | null;
  created_at: string;
  created_by_admin_user_id: string | null;
  deleted_at: string | null;
  deleted_by_admin_user_id: string | null;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  linked_client_account_id: string | null;
  notes: string;
  phone: string;
  source: string;
  status: CrmContactStatus;
  updated_at: string;
};

export type CrmContactDetail = {
  clientAccount: AdminClientAccount | null;
  clientEstimations: ClientEstimationRow[];
  clientSearches: AdminBuyerSearchRow[];
  contact: CrmContact;
  internalEstimations: ClientEstimationRow[];
  internalSearches: AdminBuyerSearchRow[];
};

export type CreateCrmContactInput = {
  assignedAdminUserId?: string | null;
  email?: string;
  firstName: string;
  lastName: string;
  notes?: string;
  phone?: string;
};

export type UpdateCrmContactInput = CreateCrmContactInput & { status?: CrmContactStatus };

export function isOwnCrmContact(contact: CrmContact, session: AdminSession) {
  return contact.created_by_admin_user_id === session.id || contact.assigned_admin_user_id === session.id;
}

function adminScope(session: AdminSession) {
  const ownership = session.role === "agent" ? `&or=(assigned_admin_user_id.eq.${session.id},created_by_admin_user_id.eq.${session.id})` : "";
  return `&deleted_at=is.null${ownership}`;
}

export async function getCrmContacts(session: AdminSession): Promise<AdminDataState<CrmContact[]>> {
  try {
    const rows = await clientSupabaseRequest<CrmContact[]>(
      `crm_contacts?select=*&order=updated_at.desc${adminScope(session)}`,
    );
    return { data: rows, status: "ready" };
  } catch (error) {
    return { message: message(error), status: "error" };
  }
}

export async function createCrmContact(input: CreateCrmContactInput, session: AdminSession) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) return { message: "Le prénom et le nom sont obligatoires.", success: false as const };
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { message: "Une adresse e-mail valide est obligatoire.", success: false as const };

  try {
    const linkedClientAccountId = await findMatchingClientAccount(email, phone);
    const sessionAdminUserId = getPersistableAdminUserId(session);
    const assignedAdminUserId = session.role === "agent"
      ? sessionAdminUserId
      : input.assignedAdminUserId || sessionAdminUserId;
    const rows = await clientSupabaseRequest<CrmContact[]>("crm_contacts?select=*", {
      body: JSON.stringify({
        assigned_admin_user_id: assignedAdminUserId,
        created_by_admin_user_id: sessionAdminUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        linked_client_account_id: linkedClientAccountId,
        notes: input.notes?.trim() ?? "",
        phone,
      }),
      headers: { Prefer: "return=representation" },
      method: "POST",
    });
    return rows[0] ? { contact: rows[0], success: true as const } : { message: "La fiche CRM n’a pas été créée.", success: false as const };
  } catch (error) {
    return { message: message(error), success: false as const };
  }
}

export async function updateCrmContact(id: string, input: UpdateCrmContactInput, session: AdminSession) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email?.trim().toLowerCase() ?? "";
  if (!firstName || !lastName) return { message: "Le prénom et le nom sont obligatoires.", success: false as const };
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { message: "Une adresse e-mail valide est obligatoire.", success: false as const };
  try {
    const rows = await clientSupabaseRequest<CrmContact[]>(`crm_contacts?id=eq.${encodeURIComponent(id)}&select=*${adminScope(session)}`, {
      body: JSON.stringify({
        ...(session.role === "agent" ? {} : { assigned_admin_user_id: input.assignedAdminUserId || null }),
        email,
        first_name: firstName,
        last_name: lastName,
        linked_client_account_id: await findMatchingClientAccount(email, input.phone?.trim() ?? ""),
        notes: input.notes?.trim() ?? "",
        phone: input.phone?.trim() ?? "",
        status: input.status ?? "prospect",
      }),
      headers: { Prefer: "return=representation" },
      method: "PATCH",
    });
    return rows[0] ? { contact: rows[0], success: true as const } : { message: "Fiche CRM inaccessible.", success: false as const };
  } catch (error) {
    return { message: message(error), success: false as const };
  }
}

export async function deleteCrmContact(id: string, session: AdminSession) {
  try {
    const ownership = session.role === "agent" ? `&created_by_admin_user_id=eq.${encodeURIComponent(session.id)}` : "";
    const rows = await clientSupabaseRequest<Array<{ id: string }>>(`crm_contacts?id=eq.${encodeURIComponent(id)}${ownership}&deleted_at=is.null&select=id`, {
      body: JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by_admin_user_id: session.id }),
      headers: { Prefer: "return=representation" },
      method: "PATCH",
    });
    return rows[0] ? { success: true as const } : { message: "Fiche CRM inaccessible.", success: false as const };
  } catch (error) {
    return { message: message(error), success: false as const };
  }
}

export async function getDeletedCrmContacts(): Promise<AdminDataState<CrmContact[]>> {
  try { return { data: await clientSupabaseRequest<CrmContact[]>("crm_contacts?deleted_at=not.is.null&select=*&order=deleted_at.desc"), status: "ready" }; }
  catch (error) { return { message: message(error), status: "error" }; }
}

export async function restoreCrmContact(id: string) {
  try {
    const rows = await clientSupabaseRequest<Array<{ id: string }>>(`crm_contacts?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null&select=id`, { body: JSON.stringify({ deleted_at: null, deleted_by_admin_user_id: null }), headers: { Prefer: "return=representation" }, method: "PATCH" });
    return rows[0] ? { success: true as const } : { message: "Fiche introuvable dans la corbeille.", success: false as const };
  } catch (error) { return { message: message(error), success: false as const }; }
}

export async function getCrmContact(id: string, session: AdminSession): Promise<AdminDataState<CrmContactDetail | null>> {
  try {
    const contacts = await clientSupabaseRequest<CrmContact[]>(
      `crm_contacts?id=eq.${encodeURIComponent(id)}&select=*&limit=1${adminScope(session)}`,
    );
    const contact = contacts[0];
    if (!contact) return { data: null, status: "ready" };

    let linkedId = contact.linked_client_account_id;
    if (!linkedId) {
      linkedId = await findMatchingClientAccount(contact.email, contact.phone);
      if (linkedId) {
        await clientSupabaseRequest(`crm_contacts?id=eq.${contact.id}`, {
          body: JSON.stringify({ linked_client_account_id: linkedId }),
          method: "PATCH",
        });
        contact.linked_client_account_id = linkedId;
      }
    }

    const [internalSearches, internalEstimations, clientAccounts, clientSearches, clientEstimations] = await Promise.all([
      clientSupabaseRequest<AdminBuyerSearchRow[]>(`buyer_searches?crm_contact_id=eq.${contact.id}&record_origin=eq.admin&select=*&order=created_at.desc`),
      clientSupabaseRequest<ClientEstimationRow[]>(`property_estimations?crm_contact_id=eq.${contact.id}&record_origin=eq.admin&select=*&order=created_at.desc`),
      linkedId ? clientSupabaseRequest<AdminClientAccount[]>(`client_accounts?id=eq.${linkedId}&select=*&limit=1`) : Promise.resolve([]),
      linkedId ? clientSupabaseRequest<AdminBuyerSearchRow[]>(`buyer_searches?client_account_id=eq.${linkedId}&record_origin=neq.admin&select=*&order=created_at.desc`) : Promise.resolve([]),
      linkedId ? clientSupabaseRequest<ClientEstimationRow[]>(`property_estimations?client_account_id=eq.${linkedId}&record_origin=neq.admin&select=*&order=created_at.desc`) : Promise.resolve([]),
    ]);

    return {
      data: {
        clientAccount: clientAccounts[0] ?? null,
        clientEstimations,
        clientSearches,
        contact,
        internalEstimations,
        internalSearches,
      },
      status: "ready",
    };
  } catch (error) {
    return { message: message(error), status: "error" };
  }
}

export async function createInternalBuyerSearch(contact: CrmContact, session: AdminSession, data: BuyerSearchFormData) {
  try {
    const sessionAdminUserId = getPersistableAdminUserId(session);
    const internalData = { ...data, contact: { ...data.contact, consent: false, email: contact.email, firstName: contact.first_name, lastName: contact.last_name, phone: contact.phone } };
    const result = await createInternalBuyerSearchRecord(internalData, {
      assignedAdminUserId: contact.assigned_admin_user_id || sessionAdminUserId,
      createdByAdminUserId: sessionAdminUserId,
      crmContactId: contact.id,
    });
    return { id: result.id, marketScore: result.marketScore, success: true as const };
  } catch (error) {
    return { message: message(error), success: false as const };
  }
}

export async function createInternalEstimation(contact: CrmContact, session: AdminSession, input: PropertyEstimationInput) {
  if (input.address.length < 5 || !["apartment", "house"].includes(input.propertyType) || !input.rooms || !input.surfaceM2) {
    return { message: "L’adresse, le type de bien, la surface et le nombre de pièces sont obligatoires.", success: false as const };
  }
  try {
    const sessionAdminUserId = getPersistableAdminUserId(session);
    const result = await createImmoDataEstimation(input);
    const rows = await clientSupabaseRequest<Array<{ id: string }>>("property_estimations?select=id", {
      body: JSON.stringify({
        address_label: result.addressLabel,
        assigned_admin_user_id: contact.assigned_admin_user_id || sessionAdminUserId,
        city_name: input.selectedAddress?.cityName ?? null,
        confidence_score: result.confidenceScore,
        created_by_admin_user_id: sessionAdminUserId,
        crm_contact_id: contact.id,
        high_price: result.highPrice,
        generated_high_price: result.highPrice,
        input_payload: input,
        low_price: result.lowPrice,
        generated_low_price: result.lowPrice,
        median_price: result.medianPrice,
        postal_code: input.selectedAddress?.postCode?.[0] ?? null,
        generated_median_price: result.medianPrice,
        price_per_m2: result.pricePerM2,
        property_type: input.propertyType,
        record_origin: "admin",
        generated_result_payload: result,
        result_payload: result,
        rooms: input.rooms,
        source: result.source,
        surface_m2: input.surfaceM2,
      }),
      headers: { Prefer: "return=representation" },
      method: "POST",
    });
    return rows[0] ? { estimation: result, id: rows[0].id, success: true as const } : { message: "L’estimation n’a pas été enregistrée.", success: false as const };
  } catch (error) {
    return { message: message(error), success: false as const };
  }
}

export async function linkCrmContactsToClientAccount(
  clientAccountId: string,
  email: string,
  phone: string,
  { allowPhoneMatch = false }: { allowPhoneMatch?: boolean } = {},
) {
  const filters = [
    email ? `email.eq.${encodeURIComponent(email.toLowerCase())}` : "",
    allowPhoneMatch && phone ? `phone.eq.${encodeURIComponent(phone)}` : "",
  ].filter(Boolean);
  if (!filters.length) return;
  try {
    await clientSupabaseRequest(`crm_contacts?linked_client_account_id=is.null&or=(${filters.join(",")})`, {
      body: JSON.stringify({ linked_client_account_id: clientAccountId }),
      method: "PATCH",
    });
  } catch (error) {
    console.error("CRM contact linking failed", error);
  }
}

async function findMatchingClientAccount(email: string, phone: string) {
  if (email) {
    const rows = await clientSupabaseRequest<Array<{ id: string }>>(`client_accounts?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id&limit=1`);
    if (rows[0]) return rows[0].id;
  }
  if (phone) {
    const rows = await clientSupabaseRequest<Array<{ id: string }>>(`client_accounts?phone=eq.${encodeURIComponent(phone)}&select=id&limit=2`);
    if (rows.length === 1) return rows[0].id;
  }
  return null;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur technique est survenue.";
}
