import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ThemeModel } from "@/lib/models/theme.model";

const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidColor(val: unknown): boolean {
  return val === "" || (typeof val === "string" && COLOR_REGEX.test(val));
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const doc = await ThemeModel.findOne({ userId: session.user.id }).lean();

  return Response.json({
    primaryColor: doc?.primaryColor ?? "",
    secondaryColor: doc?.secondaryColor ?? "",
    logoUrl: doc?.logoUrl ?? "",
    unsubscribeUrl: doc?.unsubscribeUrl ?? "",
    fontFamily: doc?.fontFamily ?? "",
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    unsubscribeUrl?: string;
    fontFamily?: string;
  };

  if (!isValidColor(body.primaryColor) || !isValidColor(body.secondaryColor)) {
    return Response.json({ error: "Invalid color format" }, { status: 400 });
  }

  await connectDB();

  const doc = await ThemeModel.findOneAndUpdate(
    { userId: session.user.id },
    {
      $set: {
        primaryColor: body.primaryColor ?? "",
        secondaryColor: body.secondaryColor ?? "",
        logoUrl: body.logoUrl ?? "",
        unsubscribeUrl: body.unsubscribeUrl ?? "",
        fontFamily: body.fontFamily ?? "",
      },
    },
    { upsert: true, new: true },
  );

  return Response.json({
    primaryColor: doc.primaryColor,
    secondaryColor: doc.secondaryColor,
    logoUrl: doc.logoUrl,
    unsubscribeUrl: doc.unsubscribeUrl,
    fontFamily: doc.fontFamily,
  });
}
