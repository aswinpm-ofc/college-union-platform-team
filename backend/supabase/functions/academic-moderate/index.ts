import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req) => {
  if (req.method !== "POST") return Response.json({error:"Method not allowed"},{status:405});
  // TODO production: validate JWT -> maintainer scope -> block self-approval -> update status -> audit -> notify.
  const payload = await req.json();
  return Response.json({ok:true, mode:"starter", payload});
});
