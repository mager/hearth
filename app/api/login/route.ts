import { findUserByEmail, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession({ id: user.id, name: user.name, email: user.email });
    return Response.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login failed", error);
    return Response.json({ error: "Sign-in is unavailable right now. Try again in a moment." }, { status: 500 });
  }
}
