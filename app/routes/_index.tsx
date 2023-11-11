import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  Session,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import crypto from "node:crypto";
import { getSession, commitSession } from "~/utils/sessions.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const EDGEDB_AUTH_BASE_URL =
  "http://localhost:10723/db/edgedb/ext/auth/ui";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const has_user_auth_token = session.has("edgedb-auth-token");

  if (!has_user_auth_token) {
    return redirect("/auth/ui/signup");
  }

  // estamos presuponiendo que el token es valido. En la primera consulta que veamos que el token no es valido,
  // quitar el token de la sesion y redirigir al usuario a /signin

  // return redirect(redirectUrl.href);
  return json({ user_token: session.get("edgedb-auth-token") });
};

export default function Index() {
  const { user_token } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <p> Bienvenido, estas logueado!!</p>
      <p>Tu token es {user_token} </p>
    </div>
  );
}

function initiatePKCE(session: Session) {
  const verifier = crypto.randomBytes(32).toString("base64url");

  session.set("edgedb-pkce-verifier", verifier);

  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return { verifier, challenge };
}
