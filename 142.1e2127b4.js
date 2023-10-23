"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[142],{1142:(e,s,t)=>{t.r(s),t.d(s,{default:()=>R});var i=t(5893),l=t(5529),a=t(4184),c=t.n(a),n=t(7294),r=t(743),o=t(6537),d=t(3329),m=t(7567),u=t(3392),x=t(641),v=t(245),h=t(195),j=t(5697),b=t.n(j);function f(e){const[s]=(0,n.useState)(e.initial),t=Math.min(e.max,s),l=e.max;let a=[],c={};for(let e=0;e<l+1;e++){const s=(e-0)/(l-0)*100;a=[...a,{value:s,raw:e}],c["r"+s]=e,c["s"+e]=s}const r=e=>c["r"+e],o=e=>{const s=r(e),t=Math.trunc(l/2);let i="",a=t+Math.abs(t-s);return l%2!=0&&s<=t&&(a++,i=String(a)),l%2==0&&s===t||(i=s<t+1?a+" "+(l-a):l-a+" "+a),i};return(0,i.jsxs)("div",{className:"verb-form-slider-root",children:[(0,i.jsx)(v.Z,{id:"discrete-slider-restrict",gutterBottom:!0,children:e.statusText}),(0,i.jsx)(h.ZP,{defaultValue:(d=t,c["s"+d]),valueLabelFormat:o,getAriaValueText:o,"aria-labelledby":"discrete-slider-restrict",track:!1,step:null,valueLabelDisplay:"auto",marks:a,onChangeCommitted:(s,i)=>{"number"==typeof i&&(s=>{const i=t,l=r(s);l!==i&&e.setChoiceN(l)})(i)}})]});var d}f.propTypes={statusText:b().string,initial:b().number.isRequired,max:b().number.isRequired,setChoiceN:b().func.isRequired};var g=t(8527),N=t(9983),p=t(4933),w=t(4133),y=t(7891),C=t(4567),T=t(1557);function R(){const e=(0,r.I0)(),{vocabList:s,vocabGroups:t,sortMethod:a,romajiEnabled:v,bareKanji:h,hintEnabled:j,activeGroup:b,autoVerbView:R,verbColSplit:E,filterType:Z,difficultyThreshold:k,repetition:L,spaRepMaxReviewItem:G,reinforce:A,verbFormsOrder:F,includeNew:S,includeReviewed:V}=(0,p.Z)(),M=Z.current,O=a.current,U=A.current,q=j.current;0===Object.keys(t).length&&e((0,y.Rz)());const z=(0,n.useMemo)((()=>Object.keys(L).filter((e=>{var s;return!0===(null===(s=L[e])||void 0===s?void 0:s.rein)}))),[L]),[H,I]=(0,n.useMemo)((()=>{const e=y.kT.setting.verbFormsOrder,s=F.reduce(((s,t)=>(e.includes(t)&&(s=[...s,t]),s)),[]),t=e.reduce(((e,t)=>(s.includes(t)||(e=[...e,t]),e)),[]);return[s,t]}),[F]);if(s.length<1||Object.keys(t).length<1)return(0,i.jsx)(o.n,{addlStyle:"vocabulary-settings"});const K=(0,N.wG)(t,b);if(K.length>0)throw new Error("Stale vocabulary active group",{cause:{code:"StaleVocabActiveGrp",value:K}});return(0,i.jsx)("div",{className:"outer",children:(0,i.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,i.jsxs)("div",{className:"column-1",children:[(0,i.jsx)(u.Z,{flip:!0,title:"Filter by:",options:["Word Group","Frequency List"],initial:M,onChange:(0,g.c)(e,y.ZZ)}),M===w.Lx.GROUP&&(0,i.jsx)(T.P,{termsGroups:t,termsActive:b,toggleTermActiveGrp:(0,g.c)(e,y.sG)}),M===w.Lx.FREQUENCY&&0===z.length&&(0,i.jsx)("div",{className:"fst-italic",children:"No words have been chosen"}),M===w.Lx.FREQUENCY&&z.length>0&&(0,i.jsx)(C.a,{termsActive:b,termsFreq:z,terms:s,removeFrequencyTerm:(0,g.c)(e,y.xz),toggleTermActiveGrp:(0,g.c)(e,y.sG)})]}),(0,i.jsxs)("div",{className:"column-2 setting-block",children:[(0,i.jsx)(u.Z,{title:"Sort by:",options:w.iU,initial:O,onChange:s=>(w.vl.RECALL===s&&e((0,y.gl)(!1)),(0,g.c)(e,y.wf)(s))}),(0,i.jsx)("div",{className:"d-flex justify-content-end",children:(0,i.jsx)(x.E,{threshold:k,setThreshold:(0,g.c)(e,y._4)})}),O===w.vl.RECALL&&(0,i.jsx)(d.Z,{label:"Max review items ",value:G,onChange:s=>{e((0,y.rg)(s))}}),O===w.vl.VIEW_DATE&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:S,action:(0,g.c)(e,y.nw),statusText:"Staleness +New"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:V,action:(0,g.c)(e,y.Sm),statusText:"Staleness +Reviewed"})})]}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:U,action:(0,g.c)(e,y.gl),disabled:M===w.Lx.FREQUENCY||O===w.vl.RECALL,statusText:"Reinforcement"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:v,action:(0,g.c)(e,y.VX),statusText:"Romaji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:h,action:(0,g.c)(e,y.Vb),statusText:"English+Kanji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:q,action:(0,g.c)(e,y.Tn),statusText:"Hint"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(m.Z,{active:R,action:(0,g.c)(e,y.eK),statusText:"Auto Verb View"})}),R&&(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)("div",{className:"d-flex flex-row justify-content-end",children:(0,i.jsx)("div",{children:[H.map(((s,t)=>(0,i.jsxs)("div",{className:c()({"d-flex justify-content-between":!0,"pt-2":t===H.length-E,"pb-2":t===H.length-1&&0===E}),children:[(0,i.jsx)("div",{className:c()({"me-3":!0,"disabled-color":0===t}),onClick:()=>{if(t>0){const s=H.slice(0,t-1),i=H[t-1],l=H[t],a=H.slice(t+1);e((0,y.Hi)([...s,l,i,...a]))}},children:(0,i.jsx)(l.g8U,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start",children:s}),(0,i.jsx)("div",{onClick:()=>{if(H.length>1){const s=[...H.slice(0,t),...H.slice(t+1)];e((0,y.Hi)(s))}},children:(0,i.jsx)(l.oOx,{className:c()({"mt-1 ms-3":!0,"incorrect-color":H.length>1,"disabled-color":1===H.length}),size:"small","aria-label":"remove"})})]},s))),I.map(((s,t)=>(0,i.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,i.jsx)("div",{className:"me-3 invisible",children:(0,i.jsx)(l.g8U,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start disabled-color",children:s}),(0,i.jsx)("div",{onClick:(0,g.c)(e,y.Hi,[...H,I[t]]),children:(0,i.jsx)(l.wl8,{className:"mt-1 ms-3",size:"small","aria-label":"add"})})]},s)))]})})}),R&&(0,i.jsx)("div",{children:(0,i.jsx)("div",{className:"d-flex justify-content-end p-2",children:(0,i.jsx)(f,{initial:H.length-E,setChoiceN:s=>{e((0,y.oG)(H.length-s))},max:F.length,statusText:"Column layout"})})})]})]})})}}}]);