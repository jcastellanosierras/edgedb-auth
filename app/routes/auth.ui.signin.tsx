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
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const { verifier, challenge } = generatePKCE();
  session.set("edgedb-pkce-verifier", verifier);
  console.log("verifier - sign up - loader -> ", verifier);

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const provider = "builtin::local_emailpassword";
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { verifier, challenge } = generatePKCE();
  session.set("edgedb-pkce-verifier", verifier);
  console.log("verifier - sign in - action -> ", verifier);

  const authenticateUrl = new URL("authenticate", EDGEDB_AUTH_BASE_URL);
  const authenticate_response = await fetch(authenticateUrl.href, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge: challenge,
      email: email,
      password: password,
      provider: provider,
    }),
  });

  const { code } = await authenticate_response.json();

  console.log("authenticate_response: code - ", code);

  const tokenUrl = new URL("token", EDGEDB_AUTH_BASE_URL);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("verifier", verifier);
  const tokenResponse = await fetch(tokenUrl.href, {
    method: "get",
  });

  if (!tokenResponse.ok) {
    const text = await authenticate_response.text();
    console.log("authenticate_response: ", text);
    return json(
      { message: `Error from the auth server: ` },
      {
        status: 400,
      }
    );
  }

  const { auth_token } = await tokenResponse.json();
  console.log("auth_token: ", auth_token);
  session.set("edgedb-auth-token", auth_token);
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function SignupPage() {
  return (
    <>
      <h1>Darse de alta</h1>
      <Form method="post">
        <input name="email" />
        <input name="password" />
        <button type="submit">Sign In</button>
      </Form>
    </>
  );
}
