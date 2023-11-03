import { createClient } from "edgedb";

declare const tokenFromAuthServer: string;
console.log(tokenFromAuthServer)
export const client = createClient()
  .withGlobals({
    "ext::auth::client_token": tokenFromAuthServer
  });

const carts = await client.query(`select Cart { * };`);

console.log(carts)