import { FedaPay, Transaction, Customer, Webhook } from "fedapay";

let configured = false;

function configure(): void {
  if (configured) return;
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key?.trim()) throw new Error("FEDAPAY_SECRET_KEY n'est pas configuré.");
  FedaPay.setApiKey(key.trim());
  const env = process.env.FEDAPAY_ENVIRONMENT?.toLowerCase() === "live" ? "live" : "sandbox";
  FedaPay.setEnvironment(env);
  configured = true;
}

export async function fedapayCreateCustomer(params: {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
}) {
  configure();
  return Customer.create({
    firstname: params.firstname,
    lastname: params.lastname,
    email: params.email,
    phone: params.phone,
  });
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
