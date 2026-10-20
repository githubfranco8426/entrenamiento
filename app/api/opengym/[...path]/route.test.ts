import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({ user:{id:"alice",email:"a@example.test"} as {id:string;email:string}|null, rpc:vi.fn(), profile:vi.fn() }));
vi.mock("@/lib/supabase/get-authenticated-user",()=>({getAuthenticatedUser:async()=>mocks.user}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({rpc:mocks.rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.profile})})})})}));
vi.mock("@/lib/opengym/coach",()=>({propose:vi.fn()}));
import { GET, PUT } from "./route";
import { EMPTY_STATE } from "@/lib/opengym/state";
const ctx=(path:string)=>({params:Promise.resolve({path:path.split("/")})});
beforeEach(()=>{mocks.user={id:"alice",email:"a@example.test"};mocks.rpc.mockReset();mocks.profile.mockResolvedValue({data:{user_id:"alice",state:EMPTY_STATE,revision:3},error:null});});
describe("OpenGym HTTP boundary",()=>{
  it("requires authentication before reading any profile",async()=>{
    mocks.user=null;mocks.profile.mockClear();
    expect((await GET(new Request("https://app.test/api/opengym/data"),ctx("data"))).status).toBe(401);
    expect(mocks.profile).not.toHaveBeenCalled();
  });
  it("reuses the app account without granting upstream admin privileges",async()=>{
    const r=await GET(new Request("https://app.test/api/opengym/me"),ctx("me"));
    expect((await r.json()).user).toEqual({id:"alice",name:"a@example.test",admin:false});
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects a pending write after the cookie session switches accounts",async()=>{
    const r=await PUT(new Request("https://app.test/api/opengym/data",{method:"PUT",headers:{"X-OpenGym-Account":"bob","If-Match":"3"},body:JSON.stringify({state:EMPTY_STATE})}),ctx("data"));
    expect(r.status).toBe(409);expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects a cross-origin mutation and a missing revision",async()=>{
    const make=(headers:Record<string,string>)=>new Request("https://app.test/api/opengym/data",{method:"PUT",headers,body:JSON.stringify({state:EMPTY_STATE})});
    expect((await PUT(make({origin:"https://elsewhere.test"}),ctx("data"))).status).toBe(403);
    expect((await PUT(make({}),ctx("data"))).status).toBe(428);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("reports stale revisions without acknowledging the local state",async()=>{
    mocks.rpc.mockResolvedValue({data:null,error:{code:"40001"}});
    const r=await PUT(new Request("https://app.test/api/opengym/data",{method:"PUT",headers:{"If-Match":"2"},body:JSON.stringify({state:EMPTY_STATE})}),ctx("data"));
    expect(r.status).toBe(409);expect((await r.json()).revision).toBeUndefined();
  });
});
