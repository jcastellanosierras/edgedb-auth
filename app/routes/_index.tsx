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

export const EDGEDB_AUTH_BASE_URL = "http://localhost:10702/db/edgedb/ext/auth/"

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  console.log("session.get(challenge) -> ", session.has("challenge"));
  
  const challenge = initiatePKCE(session)

  const redirectUrl = new URL(
    "signin",
    EDGEDB_AUTH_BASE_URL
  );

  const email = 'test@test.es'
  const password = 'testtest'
  const provider = 'Email + Password'

  console.log(redirectUrl.href)
  const response = await fetch(
    redirectUrl.href,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        verify_url: '/signup',
        provider,
        challenge,
      }),
    }
  );

  console.log(response)
  console.log(await response.json())
  if (!response.ok) {
    throw new Error("Oh no!");
  }

  const { code } = await response.json();

  console.log(code)

  // redirectUrl.searchParams.set("challenge", challenge);

  // return redirect(redirectUrl.href);
  return json({
    code
  })
};

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  session.set("challenge", "klsjadfasdlfjl");
  console.log(JSON.stringify(session.get('challenge')));

  // Login succeeded, send them to the home page.
  return redirect("/signing", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Index() {
  const { code } = useLoaderData<typeof loader>()

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <h2>{code ?? 'no hay code'}</h2>
      <form method="POST" action="/?index">
        <button type="submit">AQui</button>
      </form>
    </div>
  );
}

function initiatePKCE(session: Session) {
  const verifier = crypto.randomBytes(32).toString("base64url")

  session.set("edgedb-pkce-verifier", verifier)

  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")

  return challenge
}