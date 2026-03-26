import { FedaPay, Transaction, Customer, Webhook, ApiConnectionError } from "fedapay";

let configured = false;

function configure(): void {
  if (configured) return;
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key?.trim()) throw new Error("FEDAPAY_SECRET_KEY n'est pas configuré.");
  FedaPay.setApiKey(key.trim());
  const env = process.env.FEDAPAY_ENVIRONMENT?.toLowerCase() === "live" ? "live" : "sandbox";
  FedaPay.setEnvironment(env);
  const accountId = process.env.FEDAPAY_ACCOUNT_ID?.trim();
  if (accountId) FedaPay.setAccountId(accountId);
  configured = true;
}

function fedapayApiBase(): string {
  const env = process.env.FEDAPAY_ENVIRONMENT?.toLowerCase() === "live" ? "live" : "sandbox";
  if (env === "live") return "https://api.fedapay.com";
  return "https://sandbox-api.fedapay.com";
}

function defaultFedapayHeaders(): Record<string, string> {
  const key = process.env.FEDAPAY_SECRET_KEY?.trim() ?? "";
  const h: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "X-Version": FedaPay.VERSION,
    "X-Source": "FedaPay NodeLib",
  };
  const accountId = process.env.FEDAPAY_ACCOUNT_ID?.trim();
  if (accountId) h["FedaPay-Account"] = String(accountId);
  return h;
}

function normalizeCustomerRow(item: unknown): { id?: number; email?: string } {
  if (!item || typeof item !== "object") return {};
  const r = item as Record<string, unknown>;
  if (r.attributes && typeof r.attributes === "object") {
    const a = r.attributes as Record<string, unknown>;
    const rawId = r.id;
    const id =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
          ? Number(rawId)
          : undefined;
    return {
      id: id !== undefined && Number.isFinite(id) ? id : undefined,
      email: typeof a.email === "string" ? a.email : undefined,
    };
  }
  const id = typeof r.id === "number" ? r.id : typeof r.id === "string" ? Number(r.id) : undefined;
  return {
    id: id !== undefined && Number.isFinite(id) ? id : undefined,
    email: typeof r.email === "string" ? r.email : undefined,
  };
}

function extractCustomerRows(data: unknown): Array<{ id?: number; email?: string }> {
  if (Array.isArray(data)) return data.map(normalizeCustomerRow);
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const customers = o.customers ?? o.data;
    if (Array.isArray(customers)) return customers.map(normalizeCustomerRow);
  }
  return [];
}

function pickCustomerIdForEmail(
  rows: Array<{ id?: number; email?: string }>,
  email: string
): number | null {
  const lower = email.toLowerCase();
  const match =
    rows.find((c) => c.email?.toLowerCase() === lower) ?? (rows.length === 1 ? rows[0] : undefined);
  const id = match?.id;
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

async function fedapaySearchCustomerIdByEmail(email: string): Promise<number | null> {
  const base = fedapayApiBase();
  const qs = new URLSearchParams({ "filter[email]": email });
  const paths = [`${base}/v1/customers/search?${qs}`, `${base}/v1/customers?${qs}`];
  for (const url of paths) {
    const res = await fetch(url, { headers: defaultFedapayHeaders() });
    if (!res.ok) continue;
    const data: unknown = await res.json();
    const rows = extractCustomerRows(data);
    const id = pickCustomerIdForEmail(rows, email);
    if (id != null) return id;
  }

  try {
    const res = await Customer.all({ "filter[email]": email } as Record<string, string>);
    const rows = extractCustomerRows(res);
    return pickCustomerIdForEmail(rows, email);
  } catch {
    return null;
  }
}

function isDuplicateCustomerEmailError(err: unknown): boolean {
  if (!(err instanceof ApiConnectionError)) return false;
  const errors = err.errors as Record<string, unknown> | undefined;
  const emailErr = errors?.email;
  if (!Array.isArray(emailErr)) return false;
  return emailErr.some((m) => String(m).toLowerCase().includes("disponible"));
}

/**
 * Crée un client FedaPay ou réutilise celui qui existe déjà pour le même e-mail
 * (FedaPay refuse les doublons : erreur « n'est pas disponible » sur l'e-mail).
 */
export async function fedapayFindOrCreateCustomer(params: {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
}) {
  configure();
  try {
    return await Customer.create({
      firstname: params.firstname,
      lastname: params.lastname,
      email: params.email,
      phone: params.phone,
    });
  } catch (e: unknown) {
    if (!isDuplicateCustomerEmailError(e)) throw e;
    const id = await fedapaySearchCustomerIdByEmail(params.email.trim());
    if (id == null) {
      throw new Error(
        "Ce compte e-mail est déjà enregistré chez FedaPay mais la récupération du client a échoué. Contactez le support ou vérifiez l’API FedaPay."
      );
    }
    return Customer.retrieve(id);
  }
}

export async function fedapayCreateTransactionAndPaymentUrl(opts: {
  customerId: number;
  amount: number;
  description: string;
  callbackUrl: string;
  /** FedaPay attend souvent des valeurs string dans custom_metadata */
  metadata: Record<string, string>;
}) {
  configure();
  const mode = (process.env.FEDAPAY_PAYMENT_MODE ?? "mtn_open").trim() || "mtn_open";
  const amount = Math.max(0, Math.round(opts.amount));
  if (amount < 1) throw new Error("Le montant FedaPay doit être au moins 1 XOF.");

  const tx = await Transaction.create({
    customer: { id: opts.customerId },
    currency: { iso: "XOF" },
    description: opts.description.slice(0, 500),
    callback_url: opts.callbackUrl,
    amount,
    custom_metadata: opts.metadata,
    mode,
    include: "customer,currency",
  });

  const tokenObj = await tx.generateToken();
  const url = (tokenObj as { url?: string }).url;
  if (!url) throw new Error("FedaPay n'a pas renvoyé d'URL de paiement.");
  return {
    transaction: tx,
    paymentUrl: url,
  };
}

export async function fedapayRetrieveTransaction(id: number) {
  configure();
  return Transaction.retrieve(id);
}

export function fedapayVerifyWebhook(rawBody: string, signatureHeader: string | null): Record<string, unknown> {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret?.trim()) throw new Error("FEDAPAY_WEBHOOK_SECRET n'est pas configuré.");
  if (!signatureHeader) throw new Error("Signature webhook manquante.");
  return Webhook.constructEvent(rawBody, signatureHeader, secret.trim()) as Record<string, unknown>;
}
