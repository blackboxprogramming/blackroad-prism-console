addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request))
})

async function handle(req: Request): Promise<Response> {
  if (req.method === 'POST') {
    try {
      const data = await req.json()
      console.log('Prompt request', data)
    } catch (err) {
      console.log('Prompt request parse error')
    }
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' }
  })
}
