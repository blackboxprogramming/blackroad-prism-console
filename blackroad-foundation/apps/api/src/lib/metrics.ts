export async function pushMatomo(endpoint:string, body:any, token:string){
  const url = `https://analytics.blackroad.io/${endpoint}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if(!resp.ok){ throw new Error(`Matomo ${resp.status}`); }
  return await resp.json().catch(()=> ({}));
}
