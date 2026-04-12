
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  APP_VERSION,
  C,
  F,
  LISTEN_DATA,
  READING_DATA,
  SPEAK_DATA,
  UPDATES,
  VOCAB,
  WRITE_IELTS,
  WRITE_PTE,
  analyzeSpeech,
  checkWriting,
  exportData,
  hashStr,
  loadData,
  mulberry32,
  pick,
  saveData,
  shuffle,
  speak,
  todayStr,
  useRec,
} from "./utils/appCore";
import { Back, Hdr, Nav, Prog, Res } from "./components/SharedUI";

export default function App(){
  const[data,setData]=useState(loadData);
  const[curDate,setCurDate]=useState(todayStr);
  const[tab,setTab]=useState("home");
  const[showUpdate,setShowUpdate]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[importMsg,setImportMsg]=useState("");

  const exam=data.settings?.examType||"ielts";
  const setExam=t=>{const nd={...data,settings:{...data.settings,examType:t}};setData(nd);saveData(nd)};
  const scores=data.scores||{};
  const setScores=useCallback(ns=>{const nd={...data,scores:ns};setData(nd);saveData(nd)},[data]);
  const isToday=curDate===todayStr();
  const dayIdx=useMemo(()=>Math.floor((new Date(curDate)-new Date(2024,0,1))/86400000),[curDate]);
  const rng=useMemo(()=>mulberry32(hashStr(curDate)),[curDate]);
  const vocab=useMemo(()=>pick(VOCAB,15,mulberry32(hashStr(curDate))),[curDate]);
  const yDate=useMemo(()=>{const d=new Date(curDate);d.setDate(d.getDate()-1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`},[curDate]);
  const yVocab=useMemo(()=>pick(VOCAB,15,mulberry32(hashStr(yDate))),[yDate]);

  // Check for updates
  useEffect(()=>{
    const lastSeen=data.lastSeen;
    if(!lastSeen||lastSeen!==APP_VERSION)setShowUpdate(true);
  },[]);

  const dismissUpdate=()=>{setShowUpdate(false);const nd={...data,lastSeen:APP_VERSION};setData(nd);saveData(nd)};
  const chgDate=d=>{const dt=new Date(curDate);dt.setDate(dt.getDate()+d);setCurDate(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`)};

  const handleImport=e=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);setData(d);saveData(d);setImportMsg("✓ 데이터 복원 완료!");}catch{setImportMsg("✗ 파일 형식이 올바르지 않습니다.")}};
    reader.readAsText(file);
  };

  const tabs=[
    {id:"home",l:"홈",i:"⬡"},{id:"vocab",l:"단어",i:"◈"},{id:"review",l:"복습",i:"↻"},
    {id:"reading",l:"Read",i:"▤"},{id:"listening",l:"Listen",i:"◉"},
    {id:"speaking",l:"Speak",i:"◎"},{id:"writing",l:"Write",i:"▧"},
    {id:"history",l:"기록",i:"▦"},
  ];

  return(
    <div style={{fontFamily:F.b,background:C.bg,minHeight:"100vh",color:C.text,maxWidth:900,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet"/>

      {/* UPDATE MODAL */}
      {showUpdate&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={dismissUpdate}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:16,padding:24,maxWidth:400,width:"100%"}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:600,letterSpacing:1,marginBottom:4}}>UPDATE v{APP_VERSION}</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:12}}>{UPDATES[0].title}</div>
          <div style={{display:"grid",gap:6}}>
            {UPDATES[0].items.map((item,i)=>(
              <div key={i} style={{fontSize:12,color:C.dim,display:"flex",gap:8,alignItems:"baseline"}}>
                <span style={{color:C.accent}}>✦</span>{item}
              </div>
            ))}
          </div>
          <button onClick={dismissUpdate} style={{width:"100%",marginTop:16,padding:12,background:C.accent,border:"none",borderRadius:10,color:C.bg,fontSize:14,fontWeight:600,cursor:"pointer"}}>확인</button>
        </div>
      </div>}

      {/* SETTINGS MODAL */}
      {showSettings&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowSettings(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,maxWidth:400,width:"100%"}}>
          <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>설정 & 데이터 관리</div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>데이터 백업 (내보내기)</div>
            <button onClick={()=>exportData(data)} style={{width:"100%",padding:10,background:C.accent+"22",border:`1px solid ${C.accent}44`,borderRadius:8,color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600}}>📥 JSON 파일로 내보내기</button>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>모든 학습 기록이 파일로 저장됩니다. 기기 변경이나 캐시 삭제 전에 백업하세요.</div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>데이터 복원 (불러오기)</div>
            <label style={{display:"block",width:"100%",padding:10,background:C.blue+"22",border:`1px solid ${C.blue}44`,borderRadius:8,color:C.blue,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"center"}}>
              📤 백업 파일 불러오기
              <input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
            </label>
            {importMsg&&<div style={{fontSize:11,color:importMsg.startsWith("✓")?C.ok:C.no,marginTop:6}}>{importMsg}</div>}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:6,fontWeight:600}}>학습 통계</div>
            <div style={{fontSize:12,color:C.dim}}>총 학습일: {Object.keys(scores).length}일</div>
            <div style={{fontSize:12,color:C.dim}}>앱 버전: v{APP_VERSION}</div>
          </div>

          <button onClick={()=>setShowSettings(false)} style={{width:"100%",padding:10,background:C.border,border:"none",borderRadius:8,color:C.text,cursor:"pointer",fontSize:13}}>닫기</button>
        </div>
      </div>}

      {/* HEADER */}
      <div style={{background:`linear-gradient(180deg,${C.card} 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.border}`,padding:"14px 16px 10px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <h1 style={{margin:0,fontSize:18,fontWeight:800,letterSpacing:"-0.5px"}}>
              <span style={{color:C.accent}}>ENG</span><span style={{color:C.dim,fontWeight:400}}> MASTERY</span>
            </h1>
            <p style={{margin:"2px 0 0",fontSize:10,color:C.muted,letterSpacing:1}}>IELTS · PTE DAILY STUDY</p>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Exam toggle */}
            <div style={{display:"flex",background:C.input,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
              {["ielts","pte"].map(t=>(
                <button key={t} onClick={()=>setExam(t)} style={{padding:"6px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:0.5,background:exam===t?(t==="ielts"?C.ielts:C.pte):"transparent",color:exam===t?C.bg:C.muted,transition:"all 0.15s"}}>{t.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={()=>setShowSettings(true)} style={{background:C.border,border:"none",color:C.dim,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙</button>
          </div>
        </div>
        {/* Date nav */}
        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <button onClick={()=>chgDate(-1)} style={{background:C.border,border:"none",color:C.text,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>◂</button>
          <div style={{background:C.input,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 12px",fontSize:11,fontFamily:F.m,color:isToday?C.accent:C.dim}}>
            {curDate}{isToday&&<span style={{color:C.accent,marginLeft:5,fontSize:9}}>TODAY</span>}
          </div>
          <button onClick={()=>chgDate(1)} style={{background:C.border,border:"none",color:C.text,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>▸</button>
        </div>
      </div>

      {/* TAB NAV */}
      <div style={{background:C.bg2,borderBottom:`1px solid ${C.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",padding:"0 2px"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"0 0 auto",padding:"8px 10px",border:"none",background:"none",cursor:"pointer",fontSize:10,fontWeight:tab===t.id?700:400,color:tab===t.id?C.accent:C.muted,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",transition:"all 0.15s",whiteSpace:"nowrap"}}>
              <span style={{fontSize:13,display:"block",marginBottom:1,opacity:tab===t.id?1:0.5}}>{t.i}</span>{t.l}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"14px 14px 100px"}}>
        {tab==="home"&&<Home cur={curDate} scores={scores} go={setTab} isToday={isToday} exam={exam}/>}
        {tab==="vocab"&&<Vocab vocab={vocab} cur={curDate} scores={scores} save={setScores}/>}
        {tab==="review"&&<Review yv={yVocab} yd={yDate}/>}
        {tab==="reading"&&<Reading di={dayIdx} cur={curDate} scores={scores} save={setScores} exam={exam}/>}
        {tab==="listening"&&<Listening di={dayIdx} cur={curDate} scores={scores} save={setScores}/>}
        {tab==="speaking"&&<Speaking di={dayIdx} cur={curDate} scores={scores} save={setScores} exam={exam}/>}
        {tab==="writing"&&<Writing di={dayIdx} cur={curDate} scores={scores} save={setScores} exam={exam}/>}
        {tab==="history"&&<History scores={scores}/>}
      </div>
    </div>
  );
}

// ═══ HOME ═══
function Home({cur,scores,go,isToday,exam}){
  const ds=scores[cur]||{};
  const secs=["vocab","reading","listening","speaking","writing"];
  const lb={vocab:"단어 학습",reading:"Reading",listening:"Listening",speaking:"Speaking",writing:"Writing"};
  const ic={vocab:"◈",reading:"▤",listening:"◉",speaking:"◎",writing:"▧"};
  const cl={vocab:C.accent,reading:C.blue,listening:C.purple,speaking:C.warn,writing:C.pink};
  const done=secs.filter(s=>ds[s]!==undefined).length;
  return(
    <div>
      <div style={{textAlign:"center",padding:"16px 0 12px"}}>
        <div style={{fontSize:12,color:C.muted,letterSpacing:0.5}}>{isToday?"TODAY'S PROGRESS":cur}</div>
        <div style={{fontSize:48,fontWeight:800,color:C.accent,lineHeight:1}}>{done}<span style={{fontSize:16,color:C.muted,fontWeight:400}}>/5</span></div>
        <div style={{width:"100%",maxWidth:260,height:4,background:C.border,borderRadius:2,margin:"12px auto 0",overflow:"hidden"}}>
          <div style={{width:`${(done/5)*100}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},${C.cyan})`,borderRadius:2,transition:"width 0.5s"}}/>
        </div>
        <div style={{display:"inline-block",marginTop:8,padding:"3px 10px",background:(exam==="ielts"?C.ielts:C.pte)+"22",borderRadius:5,fontSize:10,fontWeight:600,color:exam==="ielts"?C.ielts:C.pte}}>{exam.toUpperCase()} MODE</div>
      </div>
      <div style={{display:"grid",gap:8}}>
        {secs.map(s=>{const ok=ds[s]!==undefined;return(
          <button key={s} onClick={()=>go(s)} style={{background:ok?cl[s]+"0d":C.card,border:`1px solid ${ok?cl[s]+"33":C.border}`,borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:18,color:ok?cl[s]:C.muted,fontWeight:700}}>{ic[s]}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{lb[s]}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{ok?(typeof ds[s]==="number"?ds[s]+"%":"완료 ✓"):"미완료"}</div></div>
            </div>
            <span style={{color:ok?cl[s]:C.muted,fontSize:14}}>{ok?"✓":"→"}</span>
          </button>
        )})}
        <button onClick={()=>go("review")} style={{background:C.card,border:`1px solid ${C.cyan}33`,borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
          <span style={{fontSize:18,color:C.cyan,fontWeight:700}}>↻</span>
          <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>전날 복습</div><div style={{fontSize:10,color:C.muted}}>어제 배운 단어 복습하기</div></div>
        </button>
      </div>
    </div>
  );
}

// ═══ VOCAB ═══
function Vocab({vocab,cur,scores,save}){
  const[mode,setMode]=useState("learn");
  const[ans,setAns]=useState({});const[show,setShow]=useState(false);const[q,setQ]=useState(0);const[exp,setExp]=useState(null);
  const n=vocab.length;const reset=()=>{setAns({});setShow(false);setQ(0)};

  if(mode==="learn")return(
    <div>
      <Hdr i="◈" t="오늘의 단어" s={n+"개 · 중급~고급"} c={C.accent}/>
      <div style={{display:"grid",gap:6}}>
        {vocab.map((v,i)=>(
          <div key={i} onClick={()=>setExp(exp===i?null:i)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontSize:14,fontWeight:600,color:C.accent}}>{v.w}</span>
                <span style={{fontSize:9,padding:"1px 5px",background:v.lv==="고급"?C.pink+"22":C.blue+"22",color:v.lv==="고급"?C.pink:C.blue,borderRadius:3,fontWeight:600}}>{v.lv}</span>
              </div>
              <span style={{fontSize:9,fontFamily:F.m,color:C.muted}}>{v.p}</span>
            </div>
            <div style={{fontSize:12,color:C.text,margin:"3px 0 0"}}>{v.k}</div>
            {exp===i&&<div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`,fontSize:10,color:C.muted}}>
              <div><span style={{color:C.blue}}>동의어:</span> {v.syn.join(", ")}</div>
              {v.ant.length>0&&<div><span style={{color:C.pink}}>반의어:</span> {v.ant.join(", ")}</div>}
              <div><span style={{color:C.cyan}}>비슷한 단어:</span> {v.sim.join(", ")}</div>
            </div>}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:14}}>
        {[{id:"meaning",l:"뜻 맞추기",d:"영→한"},{id:"word",l:"단어 쓰기",d:"한→영"},{id:"synonym",l:"동의어",d:"4지선다"}].map(m=>(
          <button key={m.id} onClick={()=>{setMode(m.id);reset()}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 6px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.accent}}>{m.l}</div>
            <div style={{fontSize:9,color:C.muted,marginTop:2}}>{m.d}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if(show){
    let ok=0;vocab.forEach((v,i)=>{
      if(mode==="synonym"){if(ans[i]===v.syn[0])ok++}
      else if(mode==="meaning"){if((ans[i]||"").trim().toLowerCase()===v.k.toLowerCase())ok++}
      else{if((ans[i]||"").trim().toLowerCase()===v.w.toLowerCase())ok++}
    });
    const pct=Math.round(ok/n*100);
    if(!scores[cur]?.vocab)save({...scores,[cur]:{...(scores[cur]||{}),vocab:pct}});
    return<Res pct={pct} ok={ok} n={n} items={vocab.map((v,i)=>{
      let c;if(mode==="synonym")c=ans[i]===v.syn[0];else if(mode==="meaning")c=(ans[i]||"").trim().toLowerCase()===v.k.toLowerCase();else c=(ans[i]||"").trim().toLowerCase()===v.w.toLowerCase();
      return{l:`${v.w} — ${v.k}`,ok:c,ua:ans[i]||"미답"};
    })} retry={reset} back={()=>{setMode("learn");reset()}} bl="단어 목록"/>;
  }

  if(mode==="synonym"){
    const v=vocab[q];const r2=mulberry32(hashStr(cur+q));
    const pool=VOCAB.flatMap(x=>x.syn).filter(s=>s!==v.syn[0]&&!v.syn.includes(s));
    const opts=shuffle([v.syn[0],...pick(pool,3,r2)],r2);
    return(<div><Back f={()=>{setMode("learn");reset()}} l="단어 목록"/><Prog c={q} t={n}/>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px",marginTop:12,textAlign:"center"}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:4}}>동의어를 고르세요</div>
        <div style={{fontSize:20,fontWeight:700,color:C.accent}}>{v.w}</div>
        <div style={{fontSize:11,color:C.dim,marginTop:3}}>{v.k}</div>
      </div>
      <div style={{display:"grid",gap:6,marginTop:10}}>
        {opts.map((o,i)=>{const s=ans[q]===o;return(
          <button key={i} onClick={()=>setAns({...ans,[q]:o})} style={{background:s?C.glow:C.card,border:`1px solid ${s?C.accent:C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",fontSize:13,color:C.text,textAlign:"left"}}>{o}</button>
        )})}
      </div>
      <Nav q={q} t={n} set={setQ} fin={()=>setShow(true)}/>
    </div>);
  }

  const v=vocab[q];const pr=mode==="meaning"?v.w:v.k;const ph=mode==="meaning"?"한국어 뜻을 입력하세요":"영어 단어를 입력하세요";
  return(<div><Back f={()=>{setMode("learn");reset()}} l="단어 목록"/><Prog c={q} t={n}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px",marginTop:12,textAlign:"center"}}>
      <div style={{fontSize:20,fontWeight:700,color:C.accent}}>{pr}</div>
      {mode==="word"&&<div style={{fontSize:9,fontFamily:F.m,color:C.muted,marginTop:3}}>{v.p}</div>}
    </div>
    <input type="text" value={ans[q]||""} onChange={e=>setAns({...ans,[q]:e.target.value})} placeholder={ph}
      style={{width:"100%",boxSizing:"border-box",marginTop:10,padding:"10px 14px",background:C.input,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:14,fontFamily:F.b,outline:"none"}}
      onKeyDown={e=>{if(e.key==="Enter"){q<n-1?setQ(q+1):setShow(true)}}} autoFocus/>
    <Nav q={q} t={n} set={setQ} fin={()=>setShow(true)}/>
  </div>);
}

// ═══ REVIEW ═══
function Review({yv,yd}){
  const[mode,setMode]=useState("cards");const[flip,setFlip]=useState({});
  const[ans,setAns]=useState({});const[show,setShow]=useState(false);const[q,setQ]=useState(0);
  const n=yv.length;const reset=()=>{setAns({});setShow(false);setQ(0)};

  if(mode==="cards")return(<div>
    <Hdr i="↻" t="전날 복습" s={yd+" 단어"} c={C.cyan}/>
    <div style={{display:"grid",gap:6}}>
      {yv.map((v,i)=>(<div key={i} onClick={()=>setFlip({...flip,[i]:!flip[i]})} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",cursor:"pointer"}}>
        {!flip[i]?<div style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:600,color:C.cyan}}>{v.w}</div><div style={{fontSize:9,color:C.muted,marginTop:3}}>탭해서 뜻 보기</div></div>
        :<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:14,fontWeight:600,color:C.cyan}}>{v.w}</span><span style={{fontSize:9,fontFamily:F.m,color:C.muted}}>{v.p}</span></div>
          <div style={{fontSize:12,color:C.text,margin:"3px 0"}}>{v.k}</div>
          <div style={{fontSize:10,color:C.muted}}><span style={{color:C.blue}}>동의어:</span> {v.syn.join(", ")}{v.ant.length>0&&<span> · <span style={{color:C.pink}}>반의어:</span> {v.ant.join(", ")}</span>}</div>
        </div>}
      </div>))}
    </div>
    <button onClick={()=>{setMode("quiz");reset()}} style={{width:"100%",marginTop:14,padding:12,background:C.cyan,border:"none",borderRadius:8,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>복습 테스트 →</button>
  </div>);

  if(show){
    let ok=0;yv.forEach((v,i)=>{if((ans[i]||"").trim().toLowerCase()===v.k.toLowerCase())ok++});
    return<Res pct={Math.round(ok/n*100)} ok={ok} n={n} items={yv.map((v,i)=>({l:`${v.w} — ${v.k}`,ok:(ans[i]||"").trim().toLowerCase()===v.k.toLowerCase(),ua:ans[i]||"미답"}))} retry={reset} back={()=>{setMode("cards");reset()}} bl="카드로"/>;
  }
  const v=yv[q];
  return(<div><Back f={()=>{setMode("cards");reset()}} l="카드 보기"/><Prog c={q} t={n}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"18px",marginTop:12,textAlign:"center"}}>
      <div style={{fontSize:10,color:C.cyan,marginBottom:4}}>복습 테스트</div>
      <div style={{fontSize:20,fontWeight:700,color:C.cyan}}>{v.w}</div>
      <div style={{fontSize:9,fontFamily:F.m,color:C.muted,marginTop:3}}>{v.p}</div>
    </div>
    <input type="text" value={ans[q]||""} onChange={e=>setAns({...ans,[q]:e.target.value})} placeholder="한국어 뜻 입력"
      style={{width:"100%",boxSizing:"border-box",marginTop:10,padding:"10px 14px",background:C.input,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:14,fontFamily:F.b,outline:"none"}}
      onKeyDown={e=>{if(e.key==="Enter"){q<n-1?setQ(q+1):setShow(true)}}} autoFocus/>
    <Nav q={q} t={n} set={setQ} fin={()=>setShow(true)}/>
  </div>);
}

// ═══ READING (20 questions) ═══
function Reading({di,cur,scores,save,exam}){
  const d=READING_DATA[di%READING_DATA.length];
  const[ans,setAns]=useState({});const[show,setShow]=useState(false);const[q,setQ]=useState(0);
  const n=d.qs.length;const reset=()=>{setAns({});setShow(false);setQ(0)};

  if(show){
    let ok=0;d.qs.forEach((qq,i)=>{if(ans[i]===qq.a)ok++});const pct=Math.round(ok/n*100);
    if(scores[cur]?.reading===undefined)save({...scores,[cur]:{...(scores[cur]||{}),reading:pct}});
    return<Res pct={pct} ok={ok} n={n} items={d.qs.map((qq,i)=>({l:qq.q,ok:ans[i]===qq.a,ua:qq.o[ans[i]]||"미답",ca:qq.o[qq.a]}))} retry={reset}/>;
  }
  const qq=d.qs[q];
  return(<div>
    <Hdr i="▤" t="Reading" s={exam==="ielts"?"IELTS Academic Reading":"PTE Read & Analyze"} c={C.blue}/>
    <div style={{background:C.input,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",marginBottom:12,maxHeight:200,overflowY:"auto"}}>
      <div style={{fontSize:11,fontWeight:600,color:C.blue,marginBottom:4}}>{d.title}</div>
      <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>{d.text}</div>
    </div>
    <Prog c={q} t={n}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{qq.q}</div>
    </div>
    <div style={{display:"grid",gap:5,marginTop:8}}>
      {qq.o.map((o,i)=>{const s=ans[q]===i;return(
        <button key={i} onClick={()=>setAns({...ans,[q]:i})} style={{background:s?C.glow:C.card,border:`1px solid ${s?C.accent:C.border}`,borderRadius:7,padding:"9px 12px",cursor:"pointer",fontSize:12,color:C.text,textAlign:"left"}}>
          <span style={{color:s?C.accent:C.muted,fontWeight:600,marginRight:6}}>{String.fromCharCode(65+i)}</span>{o}
        </button>
      )})}
    </div>
    <Nav q={q} t={n} set={setQ} fin={()=>setShow(true)}/>
  </div>);
}

// ═══ LISTENING (TTS + 20 questions) ═══
function Listening({di,cur,scores,save}){
  const d=LISTEN_DATA[di%LISTEN_DATA.length];
  const[acc,setAcc]=useState("us");const[playing,setPlaying]=useState(false);
  const[ans,setAns]=useState({});const[show,setShow]=useState(false);const[q,setQ]=useState(0);
  const n=d.qs.length;const reset=()=>{setAns({});setShow(false);setQ(0)};
  const play=async()=>{setPlaying(true);await speak(d.sample,acc);setPlaying(false)};

  if(show){
    let ok=0;d.qs.forEach((qq,i)=>{if(ans[i]===qq.a)ok++});const pct=Math.round(ok/n*100);
    if(scores[cur]?.listening===undefined)save({...scores,[cur]:{...(scores[cur]||{}),listening:pct}});
    return<Res pct={pct} ok={ok} n={n} items={d.qs.map((qq,i)=>({l:qq.q,ok:ans[i]===qq.a,ua:qq.o[ans[i]]||"미답",ca:qq.o[qq.a]}))} retry={reset}/>;
  }
  const qq=d.qs[q];
  return(<div>
    <Hdr i="◉" t="Listening" s="음성을 듣고 문제를 풀어보세요" c={C.purple}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:C.purple,marginBottom:6}}>{d.title}</div>
      <div style={{fontSize:10,color:C.dim,marginBottom:10}}>🎧 {d.ctx}</div>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {[{id:"us",l:"🇺🇸 US"},{id:"uk",l:"🇬🇧 UK"},{id:"au",l:"🇦🇺 AU"}].map(a=>(
          <button key={a.id} onClick={()=>setAcc(a.id)} style={{flex:1,padding:"6px",background:acc===a.id?C.purple+"22":C.input,border:`1px solid ${acc===a.id?C.purple:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,color:acc===a.id?C.purple:C.muted,fontWeight:acc===a.id?600:400}}>{a.l}</button>
        ))}
      </div>
      <button onClick={play} disabled={playing} style={{width:"100%",padding:10,background:playing?C.muted:C.purple,border:"none",borderRadius:8,color:C.bg,fontSize:12,fontWeight:600,cursor:playing?"not-allowed":"pointer"}}>{playing?"▶ 재생 중...":"▶ 음성 듣기"}</button>
      <div style={{fontSize:9,color:C.muted,marginTop:6,textAlign:"center"}}>* 브라우저 TTS 사용. 억양은 기기에 따라 다를 수 있음</div>
    </div>
    <Prog c={q} t={n}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",marginTop:8}}>
      <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{qq.q}</div>
    </div>
    <div style={{display:"grid",gap:5,marginTop:8}}>
      {qq.o.map((o,i)=>{const s=ans[q]===i;return(
        <button key={i} onClick={()=>setAns({...ans,[q]:i})} style={{background:s?C.glow:C.card,border:`1px solid ${s?C.accent:C.border}`,borderRadius:7,padding:"9px 12px",cursor:"pointer",fontSize:12,color:C.text,textAlign:"left"}}>
          <span style={{color:s?C.accent:C.muted,fontWeight:600,marginRight:6}}>{String.fromCharCode(65+i)}</span>{o}
        </button>
      )})}
    </div>
    <Nav q={q} t={n} set={setQ} fin={()=>setShow(true)}/>
  </div>);
}

// ═══ SPEAKING (Record + Transcript + Feedback) ═══
function Speaking({di,cur,scores,save,exam}){
  const d=SPEAK_DATA[di%SPEAK_DATA.length];
  const{rec,url,tr,start,stop,reset:rr,setTr}=useRec();
  const[sub,setSub]=useState(false);const[ana,setAna]=useState(null);
  const[manual,setManual]=useState(false);const[mt,setMt]=useState("");

  const submit=()=>{const t=manual?mt:tr;setAna(analyzeSpeech(t));setSub(true);
    if(scores[cur]?.speaking===undefined)save({...scores,[cur]:{...(scores[cur]||{}),speaking:"done"}})};
  const rst=()=>{rr();setSub(false);setAna(null);setMt("")};

  return(<div>
    <Hdr i="◎" t="Speaking" s={exam==="ielts"?d.ielts:d.pte} c={C.warn}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.warn,fontWeight:600,marginBottom:4,letterSpacing:0.5}}>TODAY'S TOPIC</div>
      <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{d.topic}</div>
    </div>
    <div style={{marginTop:10}}>
      <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:5}}>FOLLOW-UP QUESTIONS</div>
      {d.follow.map((f,i)=><div key={i} style={{background:C.input,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",marginBottom:4,fontSize:11,color:C.dim}}>{i+1}. {f}</div>)}
    </div>

    {!sub?(<div style={{marginTop:14}}>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        <button onClick={()=>setManual(false)} style={{flex:1,padding:7,background:!manual?C.warn+"22":C.input,border:`1px solid ${!manual?C.warn:C.border}`,borderRadius:6,cursor:"pointer",fontSize:11,color:!manual?C.warn:C.muted,fontWeight:!manual?600:400}}>🎙 녹음</button>
        <button onClick={()=>setManual(true)} style={{flex:1,padding:7,background:manual?C.warn+"22":C.input,border:`1px solid ${manual?C.warn:C.border}`,borderRadius:6,cursor:"pointer",fontSize:11,color:manual?C.warn:C.muted,fontWeight:manual?600:400}}>⌨ 직접 입력</button>
      </div>
      {!manual?(<div>
        <button onClick={rec?stop:start} style={{width:"100%",padding:12,background:rec?"#ef4444":C.warn,border:"none",borderRadius:8,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>{rec?"⏹ 녹음 중지":"🎙 녹음 시작"}</button>
        {url&&<div style={{marginTop:10}}><audio src={url} controls style={{width:"100%",borderRadius:6}}/></div>}
        {tr&&<div style={{marginTop:10,background:C.input,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:10,color:C.warn,fontWeight:600,marginBottom:4}}>TRANSCRIPT</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{tr}</div>
        </div>}
        {(url||tr)&&<button onClick={submit} style={{width:"100%",marginTop:10,padding:11,background:C.accent,border:"none",borderRadius:8,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>분석 제출 →</button>}
        <div style={{fontSize:9,color:C.muted,marginTop:6,textAlign:"center"}}>마이크 권한 필요. 음성인식은 브라우저 기능 사용.</div>
      </div>):(<div>
        <textarea value={mt} onChange={e=>setMt(e.target.value)} placeholder="영어로 입력하세요..."
          style={{width:"100%",boxSizing:"border-box",minHeight:130,padding:"10px 14px",background:C.input,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,fontFamily:F.b,outline:"none",resize:"vertical",lineHeight:1.6}}/>
        <div style={{fontSize:10,color:C.muted,textAlign:"right",marginTop:2}}>{mt.trim().split(/\s+/).filter(Boolean).length} words</div>
        {mt.trim()&&<button onClick={submit} style={{width:"100%",marginTop:6,padding:11,background:C.accent,border:"none",borderRadius:8,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>분석 제출 →</button>}
      </div>)}
    </div>):(<div style={{marginTop:14}}>
      <div style={{textAlign:"center",marginBottom:12,fontSize:13,fontWeight:600,color:C.ok}}>✓ Speaking 분석 완료</div>
      {ana&&ana.fb.map((f,i)=><div key={i} style={{background:C.card,border:`1px solid ${f.t==="ok"?C.ok+"33":f.t==="warn"?C.no+"33":f.t==="tip"?C.blue+"33":C.warn+"33"}`,borderRadius:8,padding:"10px 12px",marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:f.t==="ok"?C.ok:f.t==="warn"?C.no:f.t==="tip"?C.blue:C.warn}}>{f.t==="ok"?"✓":f.t==="warn"?"⚠":f.t==="tip"?"💡":"↑"} {f.l}</div>
        {f.m&&<div style={{fontSize:11,color:C.dim,marginTop:2}}>{f.m}</div>}
        {f.tip&&<div style={{fontSize:10,color:C.muted,marginTop:3,whiteSpace:"pre-line"}}>{f.tip}</div>}
      </div>)}
      <button onClick={rst} style={{width:"100%",marginTop:10,padding:10,background:C.border,border:"none",borderRadius:8,color:C.text,cursor:"pointer",fontSize:12}}>다시 연습하기</button>
    </div>)}
  </div>);
}

// ═══ WRITING (Feedback Engine) ═══
function Writing({di,cur,scores,save,exam}){
  const tasks=exam==="ielts"?WRITE_IELTS:WRITE_PTE;
  const task=tasks[di%tasks.length];
  const[essay,setEssay]=useState("");const[sub,setSub]=useState(false);const[ana,setAna]=useState(null);
  const wc=essay.trim()?essay.trim().split(/\s+/).length:0;

  const submit=()=>{const a=checkWriting(essay);setAna(a);setSub(true);
    if(scores[cur]?.writing===undefined)save({...scores,[cur]:{...(scores[cur]||{}),writing:a.score}})};
  const rst=()=>{setEssay("");setSub(false);setAna(null)};

  return(<div>
    <Hdr i="▧" t="Writing" s={`${exam.toUpperCase()} · ${task.type}`} c={C.pink}/>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.pink,fontWeight:600,marginBottom:4}}>{task.type}</div>
      <div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{task.prompt}</div>
      <div style={{fontSize:9,color:C.muted,marginTop:6}}>목표: {task.target}+ words</div>
    </div>
    {!sub?(<div style={{marginTop:12}}>
      <div style={{position:"relative"}}>
        <textarea value={essay} onChange={e=>setEssay(e.target.value)} placeholder="에세이를 작성하세요..."
          style={{width:"100%",boxSizing:"border-box",minHeight:200,padding:"12px 14px 28px",background:C.input,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,fontFamily:F.b,outline:"none",resize:"vertical",lineHeight:1.7}}/>
        <div style={{position:"absolute",bottom:6,right:12,fontSize:10,fontFamily:F.m,color:wc>=task.target?C.ok:C.muted}}>{wc}/{task.target}+</div>
      </div>
      {essay.trim()&&<button onClick={submit} style={{width:"100%",marginTop:10,padding:11,background:C.accent,border:"none",borderRadius:8,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>제출하고 피드백 받기 →</button>}
    </div>):(<div style={{marginTop:12}}>
      {/* Score */}
      <div style={{textAlign:"center",padding:14,background:C.card,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:12}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>예상 Band / Score</div>
        <div style={{fontSize:36,fontWeight:800,color:ana.score>=7?C.ok:ana.score>=5?C.warn:C.no}}>{ana.score}</div>
        <div style={{fontSize:10,color:C.dim}}>{ana.wc} words · {ana.sc} sentences · 평균 {ana.avg} words/sent</div>
      </div>
      {/* Corrections */}
      {ana.corrections.length>0&&<div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:C.no,marginBottom:6}}>✗ 수정 필요 ({ana.corrections.length}개)</div>
        {ana.corrections.map((c,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.no}33`,borderRadius:6,padding:"8px 12px",marginBottom:5}}>
          <div style={{fontSize:11}}><span style={{color:C.no,textDecoration:"line-through"}}>{c.orig}</span><span style={{color:C.muted,margin:"0 5px"}}>→</span><span style={{color:C.ok,fontWeight:600}}>{c.fix}</span></div>
          <div style={{fontSize:9,color:C.muted,marginTop:2}}>{c.rule}</div>
        </div>)}
      </div>}
      {!ana.corrections.length&&<div style={{background:C.card,border:`1px solid ${C.ok}33`,borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:11,color:C.ok,fontWeight:600}}>✓ 문법 오류 없음</div>}
      {/* Feedback */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:C.blue,marginBottom:6}}>전문가 피드백</div>
        {ana.feedback.map((f,i)=><div key={i} style={{background:C.card,border:`1px solid ${f.t==="ok"?C.ok+"33":f.t==="warn"?C.no+"33":C.warn+"33"}`,borderRadius:6,padding:"8px 12px",marginBottom:5}}>
          <div style={{fontSize:11,color:f.t==="ok"?C.ok:f.t==="warn"?C.no:C.warn,fontWeight:600}}>{f.t==="ok"?"✓ 잘한 점":f.t==="warn"?"⚠ 주의":"↑ 개선"}</div>
          <div style={{fontSize:11,color:C.dim,marginTop:1}}>{f.msg}</div>
          {f.tip&&<div style={{fontSize:10,color:C.muted,marginTop:2,fontStyle:"italic"}}>{f.tip}</div>}
        </div>)}
      </div>
      {/* Useful expressions */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:C.accent,marginBottom:6}}>💡 유용한 표현</div>
        {[{c:"서론",e:"It is widely acknowledged that... / There is growing debate surrounding..."},{c:"양보",e:"While it is true that..., it should also be noted... / Admittedly, ... however..."},{c:"예시",e:"A compelling example can be seen in... / This is evidenced by..."},{c:"결론",e:"In conclusion, the evidence suggests... / On balance, I believe..."}].map((e,i)=><div key={i} style={{marginBottom:4}}><span style={{fontSize:10,color:C.accent,fontWeight:600}}>{e.c}: </span><span style={{fontSize:10,color:C.dim}}>{e.e}</span></div>)}
      </div>
      <button onClick={rst} style={{width:"100%",padding:10,background:C.border,border:"none",borderRadius:8,color:C.text,cursor:"pointer",fontSize:12}}>다시 작성하기</button>
    </div>)}
  </div>);
}

// ═══ HISTORY ═══
function History({scores}){
  const dates=Object.keys(scores).sort().reverse();
  if(!dates.length)return<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>▦</div><div style={{fontSize:12}}>기록이 없어요</div></div>;
  const totalDays=dates.length;
  const avgScore=Math.round(dates.reduce((sum,d)=>{const s=scores[d];const nums=Object.values(s).filter(v=>typeof v==="number");return sum+(nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0)},0)/totalDays);
  return(<div>
    <Hdr i="▦" t="학습 기록" s={`${totalDays}일 학습 · 평균 ${avgScore}%`} c={C.accent}/>
    {dates.map(d=>{const s=scores[d];return(
      <div key={d} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:6}}>
        <div style={{fontSize:11,fontFamily:F.m,color:C.accent,marginBottom:5}}>{d}</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {Object.entries(s).map(([k,v])=><span key={k} style={{background:C.input,borderRadius:4,padding:"2px 7px",fontSize:9,color:C.dim}}>{k}: {typeof v==="number"?v+"%":"✓"}</span>)}
        </div>
      </div>
    )})}
  </div>);
}

