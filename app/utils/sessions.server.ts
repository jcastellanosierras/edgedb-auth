// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

type SessionData = {
  userId: string;
  challenge: string;
  "edgedb-pkce-verifier": string;
  "edgedb-auth-token": string;
};

type SessionFlashData = {
  error: string;
};

// FIX: arreglar el problema de la cookie, con los parametros opcionales no la crea correctamente
const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
      // domain: "localhost:3000",
      // Expires can also be set (although maxAge overrides it when used in combination).
      // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
      //
      // expires: new Date(Date.now() + 60_000),
      // httpOnly: true,
      // maxAge: 60,
      // // path: "/",
      // sameSite: "lax",
      // secrets: ["s3cret1alsdjflj"],
      // secure: process.env.NODE_ENV === "production" ? true : false,
    },
  });

export { getSession, commitSession, destroySession };
