import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { generatePKCE } from "~/utils/auth.server";
import { EDGEDB_AUTH_BASE_URL } from "./_index";
import { commitSession, getSession } from "~/utils/sessions.server";
import { Form } from "@remix-run/react";
import { VerificationException } from "@aws-sdk/client-sns";

/* /auth/ui/signup */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  console.log(session.has("edgedb-pkce-verifier"));
  console.log("dentro de /auth/verify loader ");
  console.log("params : ", params);
  // parse the search params for `?q=`
  const url = new URL(request.url);
  const verification_token = url.searchParams.get("verification_token");
  console.log("verification_token: ", verification_token);
  if (!verification_token) {
    return json({
      message: `Verify request is missing 'verification_token' search param. The verification email is malformed.`,
    });
  }

  const verifier = session.get("edgedb-pkce-verifier");
  console.log("verifier: ", verifier);
  if (!verifier) {
    return json({
      message: `Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`,
    });
  }

  const verifyUrl = new URL("verify", EDGEDB_AUTH_BASE_URL);
  const verifyResponse = await fetch(verifyUrl.href, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      verification_token,
      verifier,
      provider: "builtin::local_emailpassword",
    }),
  });

  console.log("verify_response: ", verifyResponse);
  if (!verifyResponse.ok) {
    const text = await verifyResponse.text();
    return json(
      { message: `Error from the auth server: ${text}` },
      {
        status: 400,
      }
    );
  }

  const { code } = await verifyResponse.json();

  console.log("code: ", code);
  const tokenUrl = new URL("token", EDGEDB_AUTH_BASE_URL);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("verifier", verifier);
  const tokenResponse = await fetch(tokenUrl.href, {
    method: "get",
  });

  console.log("token_response: ", tokenResponse);
  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return json(
      { message: `Error from the auth server: ${text}` },
      {
        status: 400,
      }
    );
  }

  const { auth_token } = await tokenResponse.json();
  console.log("auth_token: ", auth_token);
  session.set("edgedb-auth-token", auth_token);
  return json(
    {},
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export default function VerifyPage() {
  return (
    <>
      <h1>Se ha dado de alta correctamente?</h1>
    </>
  );
}
