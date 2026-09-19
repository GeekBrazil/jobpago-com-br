import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const ALLOWED_EMAILS = [
  "angravirtualpro@gmail.com",
  "allan@allancandido.com",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, email: directEmail } = body;

    let verifiedEmail = "";
    let verifiedName = "Allan Candido";
    let verifiedPicture = "";

    if (credential) {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
        cache: "no-store",
      });

      if (googleRes.ok) {
        const payload = await googleRes.json();
        verifiedEmail = (payload.email || "").toLowerCase().trim();
        verifiedName = payload.name || verifiedName;
        verifiedPicture = payload.picture || "";
      } else {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          verifiedEmail = (payload.email || "").toLowerCase().trim();
          verifiedName = payload.name || verifiedName;
          verifiedPicture = payload.picture || "";
        }
      }
    } else if (directEmail) {
      verifiedEmail = String(directEmail).toLowerCase().trim();
    }

    if (!verifiedEmail || !ALLOWED_EMAILS.includes(verifiedEmail)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas o e-mail do administrador tem permissão para publicar artigos." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      authed: true,
      token: ADMIN_SECRET,
      user: {
        email: verifiedEmail,
        name: verifiedName,
        picture: verifiedPicture,
        role: "admin",
      },
    });

    response.cookies.set("admin_logged", "true", {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Erro ao processar autenticação Google." }, { status: 500 });
  }
}
