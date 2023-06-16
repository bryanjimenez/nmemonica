"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[196],{4196:(e,s,t)=>{t.r(s),t.d(s,{default:()=>E});var i=t(5893),l=t(195),a=t(5529),n=t(4184),r=t.n(n),c=t(7294),o=t(743),d=t(9983),u=t(8670),m=t(4933),x=t(4133),b=t(7891),h=t(4567),v=t(1557),j=t(6537),p=t(7567),f=t(5834),g=t(6867),N=t(2440),y=t(9334),C=t(1664),M=t(7182),T=t(5697),k=t.n(T);function w(e){const[s,t]=(0,c.useState)(null),[l,n]=(0,c.useState)(e.initial),o=(0,c.useMemo)((()=>e.options),[]);(0,c.useMemo)((()=>{n(e.initial)}),[e.initial]);const d=Boolean(s),u=e=>{t(e.currentTarget)};return(0,i.jsxs)("div",{className:r()({clickable:!0!==e.disabled,"d-flex":!0,"flex-row-reverse":!0===e.flip||void 0,"justify-content-end":!0}),children:[(0,i.jsx)(N.Z,{component:"nav",disablePadding:!0,children:(0,i.jsx)(f.Z,{disableGutters:!0,disabled:!0===e.disabled,id:"filter-button","aria-haspopup":"listbox","aria-controls":"filter-menu","aria-expanded":d?"true":void 0,onClick:u,children:(0,i.jsx)(y.Z,{primary:e.title,secondary:o[l],secondaryTypographyProps:{color:"unset"}})})}),(0,i.jsx)(C.Z,{id:"filter-menu",anchorEl:s,open:d,onClose:()=>{t(null)},MenuListProps:{"aria-labelledby":"filter-button",role:"listbox"},children:o.map(((s,a)=>(0,i.jsx)(M.Z,{selected:a===l,onClick:s=>((s,i)=>{n(i),t(null),e.onChange(i)})(0,a),children:s},s)))}),(0,i.jsx)(g.Z,{"aria-labelledby":"filter-button",sx:{color:"unset",minWidth:"55px"},"aria-haspopup":"listbox",disabled:!0===e.disabled,onClick:u,children:(0,i.jsx)(a.Ui8,{size:"medium",className:r()({"rotate-transition":!0,"rotate-90":d})})})]})}w.propTypes={disabled:k().bool,flip:k().bool,title:k().string,options:k().arrayOf(k().string),initial:k().number,onChange:k().func};var Z=t(245);function G(e){const[s]=(0,c.useState)(e.initial),t=Math.min(e.max,s),a=e.max;let n=[],r={};for(let e=0;e<a+1;e++){const s=(e-0)/(a-0)*100;n=[...n,{value:s,raw:e}],r["r"+s]=e,r["s"+e]=s}const o=e=>r["r"+e],d=e=>{const s=o(e),t=Math.trunc(a/2);let i="",l=t+Math.abs(t-s);return a%2!=0&&s<=t&&(l++,i=l+""),a%2==0&&s===t||(i=s<t+1?l+" "+(a-l):a-l+" "+l),i};return(0,i.jsxs)("div",{className:"verb-form-slider-root",children:[(0,i.jsx)(Z.Z,{id:"discrete-slider-restrict",gutterBottom:!0,children:e.statusText}),(0,i.jsx)(l.ZP,{defaultValue:(u=t,r["s"+u]),valueLabelFormat:d,getAriaValueText:d,"aria-labelledby":"discrete-slider-restrict",step:null,valueLabelDisplay:"auto",marks:n,onChangeCommitted:(s,i)=>{"number"==typeof i&&(s=>{const i=t,l=o(s);l!==i&&e.setChoiceN(l)})(i)}})]});var u}function E(){const e=(0,o.I0)(),{vocabList:s,vocabGroups:t,sortMethod:n,romajiEnabled:f,bareKanji:g,hintEnabled:N,activeGroup:y,autoVerbView:C,verbColSplit:M,filterType:T,memoThreshold:k,repetition:Z,reinforce:E,verbFormsOrder:F}=(0,m.Z)(),L=T.current,R=k.current,S=n.current,V=E.current,U=N.current,[O]=(0,c.useState)(Math.abs(R));0===Object.keys(t).length&&e((0,b.Rz)());const z=(0,c.useMemo)((()=>Object.keys(Z).filter((e=>{var s;return!0===(null===(s=Z[e])||void 0===s?void 0:s.rein)}))),[Z]),[A,P]=(0,c.useMemo)((()=>{const e=b.kT.setting.verbFormsOrder,s=F.reduce(((s,t)=>(e.includes(t)&&(s=[...s,t]),s)),[]),t=e.reduce(((e,t)=>(s.includes(t)||(e=[...e,t]),e)),[]);return[s,t]}),[F]);if(s.length<1||Object.keys(t).length<1)return(0,i.jsx)(j.n,{addlStyle:"vocabulary-settings"});const q=(0,d.wG)(t,y);if(q.length>0)throw new Error("Stale vocabulary active group",{cause:{code:"StaleVocabActiveGrp",value:q}});return(0,i.jsx)("div",{className:"outer",children:(0,i.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,i.jsxs)("div",{className:"column-1",children:[(0,i.jsx)(w,{flip:!0,title:"Filter by:",options:["Word Group","Frequency List"],initial:L,onChange:(0,u.cM)(e,b.ZZ)}),L===x.Lx.GROUP&&(0,i.jsx)(v.P,{termsGroups:t,termsActive:y,toggleTermActiveGrp:(0,u.cM)(e,b.sG)}),L===x.Lx.FREQUENCY&&0===z.length&&(0,i.jsx)("div",{className:"fst-italic",children:"No words have been chosen"}),L===x.Lx.FREQUENCY&&z.length>0&&(0,i.jsx)(h.a,{termsActive:y,termsFreq:z,terms:s,removeFrequencyTerm:(0,u.cM)(e,b.xz),toggleTermActiveGrp:(0,u.cM)(e,b.sG)})]}),(0,i.jsxs)("div",{className:"column-2 setting-block",children:[(0,i.jsx)(w,{title:"Sort by:",options:x.iU,initial:S,onChange:(0,u.cM)(e,b.wf)}),S===x.vl.DIFFICULTY&&(0,i.jsxs)("div",{className:"d-flex justify-content-end",children:[(0,i.jsx)(l.ZP,{defaultValue:O,track:R<0?"inverted":void 0,onChangeCommitted:(s,t)=>{const i=R<0?-1:1;"number"==typeof t&&e((0,b._4)(i*t))},valueLabelDisplay:"auto"}),(0,i.jsx)("div",{className:"mt-2 ms-3 ",onClick:(0,u.cM)(e,b._4,-1*R),children:R<0?(0,i.jsx)(a.k6S,{}):(0,i.jsx)(a.aoE,{})})]}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(p.Z,{active:V,action:(0,u.cM)(e,b.gl),disabled:L===x.Lx.FREQUENCY,statusText:"Reinforcement"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(p.Z,{active:f,action:(0,u.cM)(e,b.VX),statusText:"Romaji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(p.Z,{active:g,action:(0,u.cM)(e,b.Vb),statusText:"English+Kanji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(p.Z,{active:U,action:(0,u.cM)(e,b.Tn),statusText:"Hint"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(p.Z,{active:C,action:(0,u.cM)(e,b.eK),statusText:"Auto Verb View"})}),C&&(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)("div",{className:"d-flex flex-row justify-content-end",children:(0,i.jsx)("div",{children:[A.map(((s,t)=>(0,i.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,i.jsx)("div",{className:r()({"me-3":!0,"disabled-color":0===t}),onClick:()=>{if(t>0){const s=A.slice(0,t-1),i=A[t-1],l=A[t],a=A.slice(t+1);e((0,b.Hi)([...s,l,i,...a]))}},children:(0,i.jsx)(a.g8U,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start",children:s}),(0,i.jsx)("div",{onClick:()=>{if(A.length>1){const s=[...A.slice(0,t),...A.slice(t+1)];e((0,b.Hi)(s))}},children:(0,i.jsx)(a.oOx,{className:r()({"mt-1 ms-3":!0,"incorrect-color":A.length>1,"disabled-color":1===A.length}),size:"small","aria-label":"remove"})})]},s))),P.map(((s,t)=>(0,i.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,i.jsx)("div",{className:"me-3 invisible",children:(0,i.jsx)(a.g8U,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start disabled-color",children:s}),(0,i.jsx)("div",{onClick:(0,u.cM)(e,b.Hi,[...A,P[t]]),children:(0,i.jsx)(a.wl8,{className:"mt-1 ms-3",size:"small","aria-label":"add"})})]},s)))]})})}),C&&(0,i.jsx)("div",{children:(0,i.jsx)("div",{className:"d-flex justify-content-end p-2",children:(0,i.jsx)(G,{initial:M,setChoiceN:(0,u.cM)(e,b.oG),max:F.length,statusText:"Column layout"})})})]})]})})}G.propTypes={statusText:k().string,initial:k().number.isRequired,max:k().number.isRequired,setChoiceN:k().func.isRequired}}}]);