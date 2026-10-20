import { describe, it, expect } from "vitest";
import { bridgeId, publishRecords } from "./bridge";
import { EMPTY_STATE, StateSchema, routineSignature } from "./state";

const state = () => StateSchema.parse({ ...EMPTY_STATE,
  customEx:[{id:"mine",n:"Press",bp:"Pecho"}],
  routines:[{id:"routine",name:"Torso",ex:[{id:"mine",sets:3,reps:8,weight:100}]}],
  workouts:[{id:"session",d:"2026-10-19",start:1792425600000,end:1792429200000,entries:[{id:"mine",sets:[{w:100,r:8,done:true,rir:2},{w:100,r:8,done:false}]}]}],
});
describe("OpenGym data bridge",()=>{
  it("publishes stable user-isolated ids and only completed sets",()=>{
    const a=publishRecords(state(),"alice"), b=publishRecords(state(),"alice");
    expect(a).toEqual(b); expect(a.set_logs).toHaveLength(1); expect(a.set_logs[0].rpe_actual).toBe(8);
    expect(bridgeId("alice","set","1")).not.toBe(bridgeId("bob","set","1"));
    expect(a.target_sets).toHaveLength(3);
  });
  it("converts pounds to kilograms without modifying the OpenGym state",()=>{
    const s=state(); s.unit="lb";
    expect(publishRecords(s,"alice").set_logs[0].weight_kg).toBe(45.36);
    expect(s.workouts[0].entries[0].sets[0].w).toBe(100);
  });
  it("skips original history and unchanged routines, copies edited routines",()=>{
    const s=state(); s.workouts[0].id="training:original"; s.routines[0].id="training:source";
    s._trainingBase={"training:source":routineSignature(s.routines[0])};
    expect(publishRecords(s,"alice").workouts).toHaveLength(0);
    expect(publishRecords(s,"alice").routines).toHaveLength(0);
    s.routines[0].ex[0].sets=4;
    expect(publishRecords(s,"alice").target_sets).toHaveLength(4);
  });
  it("rejects malformed and unbounded imports",()=>{
    const s=state(); s.workouts[0].entries[0].sets[0].w=NaN;
    expect(StateSchema.safeParse(s).success).toBe(false);
    expect(StateSchema.safeParse({...EMPTY_STATE,routines:Array(201).fill(state().routines[0])}).success).toBe(false);
  });
});
