// Backend + WebAuthn helpers (ported from the vanilla app).
export const IS_APPLE = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
export const IS_ANDROID = /Android/.test(navigator.userAgent)
export const BIO = IS_APPLE ? 'Face ID / Touch ID' : IS_ANDROID ? 'fingerprint or face unlock' : 'your fingerprint, face or PIN'
export const VAULT = IS_APPLE ? 'iCloud Keychain' : IS_ANDROID ? 'Google Password Manager' : 'your password manager'
export const webauthnOK = () => !!(window.PublicKeyCredential && navigator.credentials)

const ACCOUNT = localStorage.getItem('opengym-account')
let syncQueue = Promise.resolve()
export function api(path, opts) {
  if (path === '/api/data' && opts?.method === 'PUT') {
    const next = syncQueue.then(() => send(path, opts))
    syncQueue = next.catch(() => {})
    return next
  }
  return send(path, opts)
}
async function send(path, opts) {
  if (ACCOUNT !== localStorage.getItem('opengym-account')) throw new Error('La cuenta cambió. Vuelve a abrir OpenGym.')
  const r = await fetch(path.replace('/api/', '/api/opengym/'), Object.assign({ headers: { 'Content-Type': 'application/json', 'X-OpenGym-Account': ACCOUNT, ...(path === '/api/data' && opts?.method === 'PUT' ? { 'If-Match': localStorage.getItem('opengym-revision:' + localStorage.getItem('opengym-account')) || '0' } : {}) } }, opts))
  const data = await r.json().catch(() => ({}))
  if (ACCOUNT !== localStorage.getItem('opengym-account')) throw new Error('La cuenta cambió. Vuelve a abrir OpenGym.')
  if ((path === '/api/bridge/import' || (path === '/api/data' && (opts?.method === 'PUT' || localStorage.getItem('opengym:gym_dirty:' + localStorage.getItem('opengym-account')) !== '1'))) && r.ok && data.revision != null) localStorage.setItem('opengym-revision:' + localStorage.getItem('opengym-account'), String(data.revision))
  if (!r.ok) { window.dispatchEvent(new CustomEvent('opengym-sync-error', { detail: data.error || 'No se pudo sincronizar' })); const e = new Error(data.error || ('HTTP ' + r.status)); e.status = r.status; throw e }
  return data
}

const bufToB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64uToBuf = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer

function toCreationOptions(o) {
  o.challenge = b64uToBuf(o.challenge)
  o.user.id = b64uToBuf(o.user.id)
  ;(o.excludeCredentials || []).forEach(c => { c.id = b64uToBuf(c.id) })
  return o
}
function toRequestOptions(o) {
  o.challenge = b64uToBuf(o.challenge)
  ;(o.allowCredentials || []).forEach(c => { c.id = b64uToBuf(c.id) })
  return o
}
function credToJSON(cred) {
  const r = cred.response
  const out = {
    id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {},
    authenticatorAttachment: cred.authenticatorAttachment || null,
    response: { clientDataJSON: bufToB64u(r.clientDataJSON) }
  }
  if (r.attestationObject) {
    out.response.attestationObject = bufToB64u(r.attestationObject)
    out.response.transports = r.getTransports ? r.getTransports() : ['internal']
  }
  if (r.authenticatorData) {
    out.response.authenticatorData = bufToB64u(r.authenticatorData)
    out.response.signature = bufToB64u(r.signature)
    out.response.userHandle = r.userHandle ? bufToB64u(r.userHandle) : null
  }
  return out
}
export async function passkeyRegister(name, code) {
  const { cid, options } = await api('/api/register/options', { method: 'POST', body: JSON.stringify({ name, code: code || '' }) })
  const cred = await navigator.credentials.create({ publicKey: toCreationOptions(options) })
  const res = await api('/api/register/verify', { method: 'POST', body: JSON.stringify({ cid, credential: credToJSON(cred) }) })
  return res.user
}
export async function passkeyLogin() {
  const { cid, options } = await api('/api/login/options', { method: 'POST', body: '{}' })
  const cred = await navigator.credentials.get({ publicKey: toRequestOptions(options) })
  const res = await api('/api/login/verify', { method: 'POST', body: JSON.stringify({ cid, credential: credToJSON(cred) }) })
  return res.user
}
