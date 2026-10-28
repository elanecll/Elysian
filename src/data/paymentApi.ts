import type {
  BookingRequest,
  PaymentRecord,
  Receipt,
  ShopRequest,
} from "../../shared/payments";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  options: { method?: string; key?: string; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || (body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      signal: options.signal,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.key ? { "Idempotency-Key": options.key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "Unable to reach Elysian. Please retry; your payment has not been assumed successful.",
      0,
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new ApiError(
      data?.error || "The server could not complete this request.",
      response.status,
    );
  return data as T;
}
export const submitBooking = (body: BookingRequest, key: string) =>
  api<{ receipt: Receipt; receiptToken: string }>("/bookings", body, { key });
export const submitShop = (body: ShopRequest, key: string) =>
  api<{ url?: string; receiptToken: string; recordId: string }>(
    "/shop/checkout",
    body,
    { key },
  );
export const getReceipt = (token: string, signal?: AbortSignal) =>
  api<{ receipt: Receipt; checkoutUrl?: string; customCheckout?: boolean }>(
    `/receipts/${encodeURIComponent(token)}`,
    undefined,
    { signal },
  );
export const getOwnerRecords = () =>
  api<{ records: PaymentRecord[] }>("/owner/records");
export function submissionKey(
  previous: { fingerprint: string; key: string } | null,
  payload: unknown,
) {
  const fingerprint = JSON.stringify(payload);
  return previous?.fingerprint === fingerprint
    ? previous
    : { fingerprint, key: crypto.randomUUID() };
}

export const getCheckout = (token: string, signal?: AbortSignal) =>
  api<{ clientSecret: string; publishableKey: string; sessionId: string }>(
    `/receipts/${encodeURIComponent(token)}/checkout`,
    undefined,
    { signal },
  );
