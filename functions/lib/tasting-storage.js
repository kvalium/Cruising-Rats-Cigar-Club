// Server-side S3 requests. Credentials never leave Pages Functions.
const enc = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
export const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
async function hmac(key, value) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(value));
}
export function storageReady(env) {
  return Boolean(env.CRCC_S3_ACCESS_KEY_ID && env.CRCC_S3_SECRET_ACCESS_KEY && env.CRCC_S3_SUBMISSIONS_BUCKET && env.CRCC_S3_PUBLIC_BUCKET);
}
export async function signedRequest(env, bucket, key, method='GET', body=null, extra={}, now=new Date()) {
  if (!storageReady(env)) throw Object.assign(Error('Le stockage S3 des soumissions est en cours de configuration.'), {status:503});
  if (!/^[a-z0-9][a-z0-9.-]+$/.test(bucket) || !/^[a-zA-Z0-9/_.,-]+$/.test(key) || key.includes('..')) throw Error('Clé de stockage invalide.');
  const region = env.CRCC_S3_REGION || 'eu-west-3';
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const path = '/' + key.split('/').map(encodeURIComponent).join('/');
  const stamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = stamp.slice(0,8), scope = `${day}/${region}/s3/aws4_request`;
  const headers = {host, 'x-amz-date':stamp, 'x-amz-content-sha256':await sha256(body || new Uint8Array()), ...extra};
  if (env.CRCC_S3_SESSION_TOKEN) headers['x-amz-security-token'] = env.CRCC_S3_SESSION_TOKEN;
  const names = Object.keys(headers).sort();
  const canonical = [method, path, '', names.map(k=>`${k}:${String(headers[k]).trim()}\n`).join(''), names.join(';'), headers['x-amz-content-sha256']].join('\n');
  const signing = await hmac(await hmac(await hmac(await hmac('AWS4'+env.CRCC_S3_SECRET_ACCESS_KEY, day), region), 's3'), 'aws4_request');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${env.CRCC_S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${names.join(';')}, Signature=${hex(await hmac(signing, `AWS4-HMAC-SHA256\n${stamp}\n${scope}\n${await sha256(canonical)}`))}`;
  // Workers supports only manual/follow. Reject redirect responses ourselves,
  // so signed credentials are never forwarded to another destination.
  return {url:`https://${host}${path}`, init:{method, headers, ...(body ? {body} : {}), redirect:'manual'}};
}
export async function s3(env, bucket, key, method='GET', body=null, extra={}) {
  const signed = await signedRequest(env,bucket,key,method,body,extra);
  let response;
  try { response = await fetch(signed.url,signed.init); }
  catch { throw Object.assign(Error('Le transfert S3 a été interrompu. Les pièces déjà reçues sont conservées ; vous pouvez réessayer.'), {status:502}); }
  if (!response.ok) throw Object.assign(Error('Échec du transfert S3. Les pièces conservées peuvent être réessayées.'), {status:502});
  return response;
}
export async function copyAsset(env, source, destination, type) {
  const r = await s3(env,env.CRCC_S3_PUBLIC_BUCKET,destination,'PUT',null,{
    'x-amz-copy-source':`/${env.CRCC_S3_SUBMISSIONS_BUCKET}/${source}`,
    'x-amz-metadata-directive':'REPLACE', 'content-type':type,
    'x-amz-server-side-encryption':'AES256',
  });
  // S3 CopyObject can report an embedded error with HTTP 200.
  if ((await r.text()).includes('<Error>')) throw Object.assign(Error('La copie S3 n’a pas abouti.'), {status:502});
}
