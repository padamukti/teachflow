import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Heart,ArrowRight,ChevronLeft,Check,BookOpen,X} from 'lucide-react';
import {tourCopy,tourSteps,sidebarStep,advanceTour,placeBubble} from '../tour.mjs';
import './guide.css';

function Celebration(){return <div className="gift-effects" aria-hidden="true">{Array.from({length:3},(_,b)=><div key={b} className={'gift-burst burst-'+b}>{Array.from({length:12},(_,i)=><i key={i} className={'spark spark-'+i}/>)}</div>)}{Array.from({length:10},(_,i)=><Heart key={i} className={'gift-heart heart-'+i} size={22}/>)}</div>}
export function Guide({language,onEnd,onSidebar}){
 const c=tourCopy[language]||tourCopy.id;
 const [index,setIndex]=useState(-1),[missing,setMissing]=useState(false);
 const dialog=useRef(null),bubble=useRef(null),spot=useRef(null),title=useRef(null);
 const step=tourSteps[index];
 const endRef=useRef(onEnd);endRef.current=onEnd;
 const sidebarRef=useRef(onSidebar);sidebarRef.current=onSidebar;
 useLayoutEffect(()=>{const el=dialog.current,previous=document.activeElement;el.showModal();const old=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';return()=>{el.close();document.documentElement.style.overflow=old;previous?.focus?.({preventScroll:true})}},[]);
 useLayoutEffect(()=>{
  const media=matchMedia('(max-width:760px)');const sync=()=>sidebarRef.current(!!step&&sidebarStep(step)&&media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);
 },[step]);
 useLayoutEffect(()=>{title.current?.focus({preventScroll:true});if(!step)return;
  let frame=0,until=performance.now()+350,scrolled=false;
  const update=()=>{
   const target=document.querySelector(`[data-tour="${step}"]`),s=spot.current,b=bubble.current;if(!s||!b)return;
   if(target&&!scrolled&&getComputedStyle(target).visibility!=='hidden'){scrolled=true;target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
   const r=target?.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
   const visible=!!r&&r.width>0&&r.height>0&&r.right>0&&r.left<vw&&r.bottom>0&&r.top<vh&&getComputedStyle(target).visibility!=='hidden';
   if(!visible){s.hidden=true;b.dataset.side='none';b.style.left=Math.max(12,(vw-b.offsetWidth)/2)+'px';b.style.top=Math.max(12,(vh-b.offsetHeight)/2)+'px';setMissing(true);return;}
   setMissing(false);const rect={left:Math.max(4,r.left-4),top:Math.max(4,r.top-4),right:Math.min(vw-4,r.right+4),bottom:Math.min(vh-4,r.bottom+4)};
   s.hidden=false;s.style.left=rect.left+'px';s.style.top=rect.top+'px';s.style.width=(rect.right-rect.left)+'px';s.style.height=(rect.bottom-rect.top)+'px';
   const p=placeBubble(rect,b.offsetWidth,b.offsetHeight,vw,vh,sidebarStep(step));b.style.left=p.x+'px';b.style.top=p.y+'px';b.dataset.side=p.separated?p.side:'none';b.style.setProperty('--arrow-offset',p.arrow+'px');
  };
  const animate=()=>{update();if(performance.now()<until)frame=requestAnimationFrame(animate)};animate();
  const resized=()=>{scrolled=false;until=performance.now()+300;cancelAnimationFrame(frame);frame=requestAnimationFrame(animate)};
  window.addEventListener('resize',resized);window.addEventListener('scroll',update,true);const observer=new ResizeObserver(update);observer.observe(bubble.current);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resized);window.removeEventListener('scroll',update,true);observer.disconnect()};
 },[step,language]);
 const finish=()=>endRef.current();const next=()=>{const n=advanceTour(index,1);if(n===tourSteps.length)finish();else setIndex(n)};
 return <dialog ref={dialog} className={'guide-dialog '+(step?'guide-walk':'guide-welcome')} aria-labelledby="guide-title" onCancel={e=>{e.preventDefault();finish()}}>
 {!step?<><Celebration/><section className="gift-card"><button className="icon gift-close" aria-label={c.end} onClick={finish}><X size={20}/></button><div className="gift-symbol"><BookOpen size={27}/><Heart size={17}/></div><p className="gift-occasion">{c.occasion}</p><h1 id="guide-title" tabIndex={-1} ref={title}>{c.title}</h1><p className="gift-message">{c.message}</p><p className="gift-sign">{c.sign}</p><div className="gift-actions"><button className="primary" onClick={next}>{c.start}<ArrowRight size={18}/></button><button className="text-button" onClick={finish}>{c.end}</button></div></section></>:<><div className="guide-spot" ref={spot} aria-hidden="true"/><section className="guide-bubble" ref={bubble} aria-describedby="guide-description"><span className="guide-arrow" aria-hidden="true"/><div className="guide-progress"><span>{c.guide}</span><span>{c.step} {index+1}/{tourSteps.length}</span></div><h2 id="guide-title" tabIndex={-1} ref={title}>{c.steps[step][0]}</h2><p id="guide-description">{c.steps[step][1]}</p>{missing&&<p className="muted small">{c.missing}</p>}<div className="guide-actions"><button className="text-button" onClick={finish}>{c.end}</button><div><button className="icon" aria-label={c.back} title={c.back} disabled={index===0} onClick={()=>setIndex(advanceTour(index,-1))}><ChevronLeft size={18}/></button><button className="primary" onClick={next}>{index===tourSteps.length-1?c.done:c.next}{index===tourSteps.length-1?<Check size={16}/>:<ArrowRight size={16}/>}</button></div></div></section></>}
 </dialog>
}
