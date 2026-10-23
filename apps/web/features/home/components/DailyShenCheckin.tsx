"use client";
import { useEffect, useState } from "react";
import { dailyShenDate, dailyShenQuestions, recommendDailyShen, type DailyShenId } from "@/packages/daily-shen-checkin";

export function DailyShenCheckin({ onSelect }: { onSelect: (shen: DailyShenId) => void }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<DailyShenId[]>([]);
  useEffect(() => { if (localStorage.getItem('shibashi-daily-shen-date') !== dailyShenDate()) setStep(0); }, []);
  if (step < 0 || step >= dailyShenQuestions.length) return null;
  const question = dailyShenQuestions[step];
  return <div role="dialog" aria-modal="true" aria-label="Beş Shen günlüğü" style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(2,12,10,.88)', display:'grid', placeItems:'center', padding:20 }}><div style={{ width:'min(100%,440px)', background:'#15231d', border:'1px solid #bda46a', borderRadius:22, padding:28, color:'#f5eee0', boxShadow:'0 24px 80px #0009' }}><p style={{ color:'#d5b972', letterSpacing:2, fontSize:12 }}>BEŞ SHEN GÜNLÜĞÜ · {step + 1} / 3</p><h2 style={{ fontSize:25, margin:'18px 0 22px' }}>{question.title}</h2><div style={{ display:'grid', gap:10 }}>{question.answers.map((answer) => <button key={answer.shen} type="button" onClick={() => { const next=[...answers,answer.shen]; if(step===2){ const selected=recommendDailyShen(next); localStorage.setItem('shibashi-daily-shen-date',dailyShenDate()); localStorage.setItem('shibashi-daily-shen-answers',JSON.stringify(next)); onSelect(selected); setStep(-1); } else { setAnswers(next); setStep(step+1); } }} style={{ background:'#22352a', border:'1px solid #48634b', borderRadius:12, color:'#fff', padding:'14px 16px', textAlign:'left', cursor:'pointer', fontSize:16 }}>{answer.label}</button>)}</div></div></div>;
}
