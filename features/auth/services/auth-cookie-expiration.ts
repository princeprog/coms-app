import { cookies } from "next/headers";

export const authCookieNames = [
  "coms_access",
  "coms_refresh",
  "__Host-coms_access",
  "__Host-coms_refresh",
] as const;

export async function expireAuthCookies() {
  const store = await cookies();
  for (const name of authCookieNames) {
    store.set(name, "", {
      maxAge: 0,
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Host-"),
    });
  }
}
