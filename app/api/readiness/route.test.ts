import { beforeEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({rpc:vi.fn(),user:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({rpc:state.rpc})}));
vi.mock("@/lib/supabase/get-authenticated-user",()=>({getAuthenticatedUser:state.user}));
import { POST } from "./route";
const req=(data:unknown,origin="http://localhost")=>new Request("http://localhost/api/readiness",{method:"POST",headers:{Origin:origin},body:JSON.stringify(data)});
const base={logDate:"2026-11-02",shiftType:"dia4_libre",willTrain:true,energyLevel:3};
beforeEach(()=>{state.rpc.mockReset();state.user.mockResolvedValue({id:crypto.randomUUID()});});
it("requires authentication and validates before a single atomic write",async()=>{
 state.user.mockResolvedValueOnce(null);expect((await POST(req(base))).status).toBe(401);
 expect((await POST(req({...base,fatiguePerceived:11}))).status).toBe(400);
 expect(state.rpc).not.toHaveBeenCalled();
 state.rpc.mockResolvedValue({data:{},error:null});expect((await POST(req(base))).status).toBe(200);
 expect(state.rpc).toHaveBeenCalledWith("save_daily_checkin",{p:{log_date:base.logDate,shift_type:base.shiftType,will_train:true,energy_level:3}});
});
it("rejects cross-origin writes and reports database errors without internal details",async()=>{
 expect((await POST(req(base,"https://other.example"))).status).toBe(403);
 state.rpc.mockResolvedValue({error:{message:"internal detail"}});
 const response=await POST(req(base));expect(response.status).toBe(409);expect(await response.text()).not.toContain("internal detail");
});
