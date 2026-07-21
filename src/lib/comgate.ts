const COMGATE_MERCHANT = (process.env.COMGATE_MERCHANT || "").trim();
const COMGATE_SECRET = (process.env.COMGATE_SECRET || "").trim();
const COMGATE_TEST = (process.env.COMGATE_TEST || "").trim() === "true";
const COMGATE_API = "https://payments.comgate.cz/v1.0";

export interface ComgateCreateParams {
  price: number; // halere (CZK integer)
  label: string; // max 16 chars
  refId: string; // variable symbol / order ID
  email: string;
  fullName?: string;
  method?: string; // "ALL" = all methods (default)
  country?: string; // "CZ" (default)
  lang?: string; // "cs" (default)
}

export interface ComgateCreateResult {
  success: boolean;
  transId?: string;
  redirect?: string;
  error?: string;
  code?: number;
}

export interface ComgateStatusResult {
  success: boolean;
  status?: "PENDING" | "PAID" | "CANCELLED" | "AUTHORIZED";
  price?: number;
  curr?: string;
  label?: string;
  refId?: string;
  email?: string;
  transId?: string;
  fee?: string;
  error?: string;
}

export interface ComgateRefundResult {
  success: boolean;
  error?: string;
}

function parseResponse(text: string): Record<string, string> {
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

async function comgateRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<Record<string, string>> {
  const body = new URLSearchParams({
    merchant: COMGATE_MERCHANT,
    secret: COMGATE_SECRET,
    ...params,
  });

  const response = await fetch(`${COMGATE_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await response.text();
  return parseResponse(text);
}

export async function createPayment(
  params: ComgateCreateParams
): Promise<ComgateCreateResult> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.hairland.cz").replace(/\/$/, "");
  const callbackUrl = `${baseUrl}/api/comgate/callback`;

  const result = await comgateRequest("create", {
    price: String(params.price),
    curr: "CZK",
    label: params.label.slice(0, 16),
    refId: params.refId,
    email: params.email,
    fullName: params.fullName || "",
    method: params.method || "ALL",
    country: params.country || "CZ",
    lang: params.lang || "cs",
    prepareOnly: "true",
    test: COMGATE_TEST ? "true" : "false",
    url_paid: callbackUrl,
    url_cancelled: callbackUrl,
    url_pending: callbackUrl,
  });

  if (result.code === "0" && result.transId && result.redirect) {
    return {
      success: true,
      transId: result.transId,
      redirect: result.redirect,
    };
  }

  return {
    success: false,
    error: result.message || "Unknown error",
    code: parseInt(result.code || "999"),
  };
}

export async function getPaymentStatus(
  transId: string
): Promise<ComgateStatusResult> {
  const result = await comgateRequest("status", { transId });

  if (result.code === "0") {
    return {
      success: true,
      status: result.status as ComgateStatusResult["status"],
      price: parseInt(result.price || "0"),
      curr: result.curr,
      label: result.label,
      refId: result.refId,
      email: result.email,
      transId: result.transId,
      fee: result.fee,
    };
  }

  return {
    success: false,
    error: result.message || "Unknown error",
  };
}

export async function refundPayment(
  transId: string,
  amount: number,
  refId?: string
): Promise<ComgateRefundResult> {
  const result = await comgateRequest("refund", {
    transId,
    amount: String(amount),
    curr: "CZK",
    ...(refId ? { refId } : {}),
  });

  if (result.code === "0") {
    return { success: true };
  }

  return {
    success: false,
    error: result.message || "Refund failed",
  };
}

export async function cancelPayment(
  transId: string
): Promise<ComgateRefundResult> {
  const result = await comgateRequest("cancel", { transId });

  if (result.code === "0") {
    return { success: true };
  }

  return {
    success: false,
    error: result.message || "Cancel failed",
  };
}
