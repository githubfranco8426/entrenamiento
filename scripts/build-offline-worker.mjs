import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
const root = ".next/static";
function walk(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]); }
const assets=walk(root).filter(f=>/\.(js|css|woff2?)$/.test(f)).map(f=>"/_next/static/"+relative(root,f).replaceAll("\\","/"));
const version=readFileSync(".next/BUILD_ID","utf8").trim();
const source = `
const CACHE = "training-shell-${version}";
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener("install", event => event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll([...ASSETS,"/offline-workout"]);
})()));
self.addEventListener("activate", event => event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith("training-shell-") && key!==CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener("fetch", event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET" || url.origin!==self.location.origin) return;
  if(url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request)) || fetch(event.request))); return;
  }
  if(event.request.mode==="navigate") event.respondWith((async()=>{
    try { return await fetch(event.request); }
    catch {
      if(url.pathname==="/offline-workout") return (await caches.match("/offline-workout")) || Response.error();
      if(url.pathname.startsWith("/workouts/") || url.pathname==="/dashboard" || url.pathname==="/") {
        const id=url.pathname.startsWith("/workouts/") ? url.pathname.split("/")[2] : "";
        return Response.redirect(new URL("/offline-workout"+(id?"?workout="+encodeURIComponent(id):""),self.location.origin).href,302);
      }
      return new Response("Sin conexión. Volvé a abrir tu sesión desde el panel.",{headers:{"Content-Type":"text/plain; charset=utf-8"}});
    }
  })());
});
`;
writeFileSync("public/sw.js",source);
console.log("Offline shell:",assets.length,"assets");
