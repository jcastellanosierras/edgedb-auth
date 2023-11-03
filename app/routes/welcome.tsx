import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader ({ request }: LoaderFunctionArgs) {
  return json({
    success: true,
    message: 'Welcome'
  })
}

export default function () {
  const { message } = useLoaderData<typeof loader>()

  return (
    <h1>
      {message}    
    </h1>
  )
}