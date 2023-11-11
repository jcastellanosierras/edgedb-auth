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
  console.log(email, " - ", password);

  const { verifier, challenge } = generatePKCE();
  session.set("edgedb-pkce-verifier", verifier);
  console.log("verifier - sign up - action -> ", verifier);

  const registerUrl = new URL("register", EDGEDB_AUTH_BASE_URL);
  const verifyUrl = new URL("verify", EDGEDB_AUTH_BASE_URL);
  const resgister_response = await fetch(registerUrl.href, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge: challenge,
      email: email,
      password: password,
      provider: provider,
      verify_url: `http://localhost:3000/auth/ui/verify`,
    }),
  });

  console.log("resgister_response -> ", await resgister_response.json());

  return json(
    {},
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export default function SignupPage() {
  return (
    <>
      <h1>Darse de alta</h1>
      <Form method="post">
        <input name="email" />
        <input name="password" />
        <button type="submit">Sign Up</button>
      </Form>
    </>
  );
}
