import { describe, it, expect } from "vitest";
import { resolvePublicSupabaseConfig } from "./resolve-public-config.mjs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

const url="https://example.supabase.co";
describe("Supabase public configuration",()=>{
  it("accepts a legacy key and preserves it when a modern key is also set",()=>{
    expect(resolvePublicSupabaseConfig({url,anonKey:"legacy",publishableKey:"modern"})).toEqual({url,key:"legacy"});
  });
  it("supports the modern key names without requiring an anon alias",()=>{
    expect(resolvePublicSupabaseConfig({url,publishableKey:"sb_publishable_test"}).key).toBe("sb_publishable_test");
    expect(resolvePublicSupabaseConfig({url,publishableDefaultKey:"sb_publishable_default"}).key).toBe("sb_publishable_default");
  });
  it("ignores blank aliases and surrounding whitespace",()=>{
    expect(resolvePublicSupabaseConfig({url:` ${url} `,anonKey:" ",publishableKey:" public "})).toEqual({url,key:"public"});
  });
  it("names missing variables without revealing any configured value",()=>{
    expect(()=>resolvePublicSupabaseConfig({anonKey:"do-not-print"})).toThrow("NEXT_PUBLIC_SUPABASE_URL");
    expect(()=>resolvePublicSupabaseConfig({url})).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(()=>resolvePublicSupabaseConfig({url:"private-invalid-value",anonKey:"do-not-print"})).toThrow("URL HTTP/HTTPS válida");
  });
  it("rejects secret and service-role keys in the browser configuration",()=>{
    expect(()=>resolvePublicSupabaseConfig({url,anonKey:"sb_secret_do_not_expose"})).toThrow("clave secreta");
    const token="eyJhbGciOiJIUzI1NiJ9."+btoa(JSON.stringify({role:"service_role"}))+".signature";
    expect(()=>resolvePublicSupabaseConfig({url,anonKey:token})).toThrow("service_role");
  });
  it("the build preflight exits early with missing names and never logs values",()=>{
    const cwd=mkdtempSync(path.resolve("../env-check-"));
    try {
      const result=spawnSync(process.execPath,[path.resolve("scripts/check-build-env.mjs")],{cwd,encoding:"utf8",env:{NODE_ENV:"production",VERCEL_ENV:"preview",NEXT_PUBLIC_SUPABASE_ANON_KEY:"private-test-value"}});
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_URL: ausente");
      expect(result.stderr).not.toContain("private-test-value");
    } finally { rmSync(cwd,{recursive:true,force:true}); }
  });
  it("the build preflight accepts a modern public key without Gemini",()=>{
    const cwd=mkdtempSync(path.resolve("../env-check-"));
    try {
      const result=spawnSync(process.execPath,[path.resolve("scripts/check-build-env.mjs")],{cwd,encoding:"utf8",env:{NODE_ENV:"production",NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test"}});
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Configuración pública de Supabase: disponible");
      expect(result.stderr).toContain("entrenador IA de OpenGym permanecerá desactivado");
      expect(result.stdout+result.stderr).not.toContain("sb_publishable_test");
    } finally { rmSync(cwd,{recursive:true,force:true}); }
  });
});
