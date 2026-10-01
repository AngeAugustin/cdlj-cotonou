import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserLoginCredentials } from "@/lib/userLoginVerification";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    // Même bucket que NextAuth authorize()
    const limited = rateLimit(`auth:credentials:${ip}`, { limit: 20, windowMs: 15 * 60_000 });
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ status: "invalid" as const });
    }

    const result = await verifyUserLoginCredentials(parsed.data.email, parsed.data.password);

    if (result.status === "disabled") {
      return NextResponse.json({ status: "disabled" as const });
    }
    if (result.status === "invalid") {
      return NextResponse.json({ status: "invalid" as const });
    }

    return NextResponse.json({ status: "ok" as const });
  } catch {
    return NextResponse.json({ status: "invalid" as const }, { status: 500 });
  }
}
