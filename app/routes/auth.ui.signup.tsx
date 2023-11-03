import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { generatePKCE } from "~/utils/auth.server";
import { EDGEDB_AUTH_BASE_URL } from "./_index";
import { commitSession, getSession } from "~/utils/sessions.server";

/* /auth/ui/signup */
export async function loader ({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const { verifier, challenge } = generatePKCE()

  session.set('edgedb-pkce-verifier', verifier)

  const redirectUrl = new URL('ui/signup', EDGEDB_AUTH_BASE_URL)
  redirectUrl.searchParams.set('challenge', challenge)

  return redirect(redirectUrl.href, {
    headers: {
      'Set-Cookie': `${await commitSession(session)}; Path=/`
    }
  })
}