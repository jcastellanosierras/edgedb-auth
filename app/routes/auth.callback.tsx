import { LoaderFunctionArgs, json } from "@remix-run/node";
import { commitSession, getSession } from "~/utils/sessions.server";
import { EDGEDB_AUTH_BASE_URL } from "./_index";

/* /auth/callback */
export async function loader ({ request, params }: LoaderFunctionArgs) {
  const code = params.code
  if (!code) {
    const error = params.error
    throw new Response(null, {
      status: 400,
      statusText: `OAuth callback is missing code. \
      OAuth provider responded with error: ${error}`
    })
  }

  const session = await getSession(request.headers.get('Cookie'))
  const verifier = session.get('edgedb-pkce-verifier')
  if (!verifier) {
    throw new Response(null, {
      status: 400,
      statusText: `Could not find 'verifier' in the cookie store. Is this the \
      same user agent/browser that started the authorization flow?`,
    })
  }

  const codeExchangeUrl = new URL("token", EDGEDB_AUTH_BASE_URL)
  codeExchangeUrl.searchParams.set("code", code)
  codeExchangeUrl.searchParams.set("verifier", verifier)
  const codeExchangeResponse = await fetch(codeExchangeUrl.href, {
    method: "GET",
 })

 if (!codeExchangeResponse.ok) {
  const text = await codeExchangeResponse.text()
  throw new Response(null, {
    status: 400,
    statusText: `Error from the auth server: ${text}`
  })
 }

 const { auth_token } = await codeExchangeResponse.json()
 session.set('edgedb-auth-token', auth_token)
 return json({}, {
  status: 204,
  headers: {
    'Set-Cookie': await commitSession(session)
  }
 })
}