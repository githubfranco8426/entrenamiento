import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  const values = new Map([['opengym-account','alice'],['opengym-revision:alice','1']])
  vi.stubGlobal('localStorage', { getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value) })
  vi.stubGlobal('navigator', { userAgent:'test' })
  vi.stubGlobal('window', { dispatchEvent:vi.fn() })
})
describe('Entrenamiento integration synchronization', () => {
  it('does not advance a dirty local copy to a newer remote revision', async () => {
    localStorage.setItem('opengym:gym_dirty:alice','1')
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({revision:9,state:{}})))
    const {api}=await import('./api.js')
    await api('/api/data')
    expect(localStorage.getItem('opengym-revision:alice')).toBe('1')
  })
  it('serializes saves so each one uses the acknowledged revision', async () => {
    const headers=[]
    vi.stubGlobal('fetch',vi.fn(async(path,options)=>{
      headers.push(options.headers['If-Match'])
      return Response.json({revision:headers.length+1})
    }))
    const {api}=await import('./api.js')
    await Promise.all([api('/api/data',{method:'PUT',body:'{}'}),api('/api/data',{method:'PUT',body:'{}'})])
    expect(headers).toEqual(['1','2'])
  })
  it('blocks an old account from syncing into a newly selected account', async () => {
    vi.stubGlobal('fetch',vi.fn())
    const {api}=await import('./api.js')
    localStorage.setItem('opengym-account','bob')
    await expect(api('/api/data',{method:'PUT',body:'{}'})).rejects.toThrow('cuenta cambió')
    expect(fetch).not.toHaveBeenCalled()
  })
})
