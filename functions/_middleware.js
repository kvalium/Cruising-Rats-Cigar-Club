// CRCC: protect pages and attached PDFs at the Cloudflare edge.
// The common password is a Cloudflare secret, never bundled into site HTML.
function equal(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  const guarded = /^\/(?:fiches-degustation|fiches-degustation-docs)(?:\/|$)/.test(path);
  if (!guarded) return context.next();
  const password = context.env.CRCC_MEMBERS_PASSWORD;
  if (!password) return new Response('Configuration des archives indisponible.', {status:503});
  const value = context.request.headers.get('Authorization') || '';
  const expected = 'Basic ' + btoa('crcc:' + password);
  if (!equal(value, expected)) {
    return new Response('Accès réservé aux membres du Cruising Rats Cigar Club.', {
      status:401, headers:{'WWW-Authenticate':'Basic realm="Archives privees du CRCC", charset="UTF-8"', 'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}
    });
  }
  const response = await context.next();
  const h = new Headers(response.headers);
  h.set('Cache-Control','private, no-store');
  h.set('X-Robots-Tag','noindex,nofollow');
  h.set('Referrer-Policy','no-referrer');
  return new Response(response.body, {status:response.status,headers:h});
}
