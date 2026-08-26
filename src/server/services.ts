import { QaService } from "@/src/domain/service";
import { cookies } from "next/headers";
import { D1StateRepository } from "./d1-repository";

const SESSION_COOKIE = "testpilot_session";
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getQaService(): Promise<QaService> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const sessionId = existingSessionId && SESSION_ID_PATTERN.test(existingSessionId)
    ? existingSessionId
    : crypto.randomUUID();

  if (sessionId !== existingSessionId) {
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  return new QaService(new D1StateRepository(sessionId));
}
