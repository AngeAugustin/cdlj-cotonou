import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserLoginCredentials } from "@/lib/userLoginVerification";

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
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
