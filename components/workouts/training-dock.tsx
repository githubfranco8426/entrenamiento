"use client";
import { useEffect, useState } from "react";
import { RestTimerWidget } from "./rest-timer-widget";
import { ActiveSetWidget } from "./active-set-widget";
import { useRestTimer } from "./rest-timer-context";
export function TrainingDock() {
  const { secondsLeft } = useRestTimer();
  const [typing,setTyping]=useState(false);
  useEffect(()=>{
    const update=()=>setTyping(document.activeElement instanceof HTMLElement && document.activeElement.matches("input, textarea, [contenteditable=true]"));
    document.addEventListener("focusin",update); document.addEventListener("focusout",update);
    return ()=>{document.removeEventListener("focusin",update);document.removeEventListener("focusout",update);};
  },[]);
  if(typing) return null;
  return secondsLeft != null ? <RestTimerWidget/> : <ActiveSetWidget/>;
}
