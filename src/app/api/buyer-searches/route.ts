import { NextResponse, type NextRequest } from "next/server";
import { createBuyerSearchRecord } from "@/lib/buyer-search/database";
import { buyerSearchSchema, stepSchemas } from "@/lib/buyer-search/schema";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";

type SubmissionValidationResult =
  | { data: BuyerSearchFormData; success: true }
  | { errors: Record<string, string[]>; success: false };

const submissionSteps: Array<keyof typeof stepSchemas> = [
  "location",
  "property",
  "characteristics",
  "preferences",
  "project",
  "priorities",
  "contact",
];

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validation = validateBuyerSearchSubmission(payload);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Certaines informations de la recherche sont invalides.",
          fields: validation.errors,
        },
        { status: 400 },
      );
    }

    const result = await createBuyerSearchRecord(validation.data, {
      ipAddress: getClientIp(request),
      source: "website",
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(result, { status: result.persisted ? 201 : 202 });
  } catch (error) {
    console.error("Buyer search submission failed", error);

    return NextResponse.json(
      {
        error: "La recherche n'a pas pu etre enregistree pour le moment.",
      },
      { status: 502 },
    );
  }
}

function validateBuyerSearchSubmission(payload: unknown): SubmissionValidationResult {
  const parsed = buyerSearchSchema.safeParse(payload);

  if (!parsed.success) {
    return { errors: formatIssues(parsed.error.issues), success: false };
  }

  const errors: Record<string, string[]> = {};

  submissionSteps.forEach((step) => {
    const result = stepSchemas[step].safeParse(parsed.data[step]);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path.length > 0 ? `${step}.${issue.path.join(".")}` : step;
        errors[key] = [...(errors[key] ?? []), issue.message];
      });
    }
  });

  if (Object.keys(errors).length > 0) {
    return { errors, success: false };
  }

  return { data: parsed.data, success: true };
}

function formatIssues(issues: Array<{ message: string; path: PropertyKey[] }>) {
  return issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    accumulator[key] = [...(accumulator[key] ?? []), issue.message];
    return accumulator;
  }, {});
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}
