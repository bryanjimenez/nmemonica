"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[184],{3184:(e,t,s)=>{s.r(t),s.d(t,{default:()=>b});var i=s(5893),l=s(743),c=s(6537),n=s(3329),a=s(7567),r=s(3392),v=s(8527),d=s(9983),o=s(6278),m=s(4933),u=s(8673),x=s(4133),j=s(7891),h=s(4567),g=s(6176);function b(){const e=(0,l.I0)(),{vocabList:t}=(0,m.Z)(),{filterType:s,orderType:b,reinforce:T,activeTags:L,kanjiList:N,repetition:f,kanjiTagObj:E,spaRepMaxReviewItem:R,includeNew:w,includeReviewed:y}=(0,o.R)(),C=s.current,p=b.current;if(0===t.length&&e((0,j.Rz)()),0===Object.keys(E).length&&e((0,u.tk)()),N.length<1||Object.keys(E).length<1)return(0,i.jsx)(c.n,{addlStyle:"vocabulary-settings"});const A=Object.values(N).filter((e=>e.tags.some((e=>L.includes(e))))),k=A.map((e=>e.uid)),F=Object.keys(f).filter((e=>{var t;return!0===(null===(t=f[e])||void 0===t?void 0:t.rein)})),I=F.filter((e=>!k.includes(e)));return(0,i.jsx)("div",{className:"outer",children:(0,i.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,i.jsxs)("div",{className:"column-1",children:[(0,i.jsx)("h4",{children:(0,d.w_)(C,["Kanji Group","Frequency List","Tags"])}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(a.Z,{active:C%2==0,action:(0,v.c)(e,u.cy),color:"default",statusText:"Filter by"})}),C===x.Lx.FREQUENCY&&0===F.length&&(0,i.jsx)("div",{className:"fst-italic",children:"No words have been chosen"}),C===x.Lx.TAGS&&(0,i.jsx)(g.E,{selectedCount:0===A.length?Object.values(N).length:A.length,termsTags:E,termsActive:L,toggleTermActive:(0,v.c)(e,u.X8)}),C===x.Lx.FREQUENCY&&F.length>0&&(0,i.jsx)(h.a,{termsActive:L,termsFreq:F,terms:N,removeFrequencyTerm:(0,v.c)(e,u.SI),toggleTermActiveGrp:(0,v.c)(e,u.LD)})]}),(0,i.jsxs)("div",{className:"column-2 setting-block",children:[(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(r.Z,{title:"Sort by:",options:x.iU,allowed:[x.vl.DIFFICULTY,x.vl.RANDOM,x.vl.VIEW_DATE,x.vl.RECALL],initial:p,onChange:t=>(x.vl.RECALL===t&&e((0,u.vT)(!1)),(0,v.c)(e,u.vX)(t))})}),p===x.vl.RECALL&&(0,i.jsx)(n.Z,{label:"Max review items ",value:R,onChange:t=>{e((0,u.rg)(t))}}),p===x.vl.VIEW_DATE&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(a.Z,{active:w,action:(0,v.c)(e,u.nw),statusText:"Staleness +New"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(a.Z,{active:y,action:(0,v.c)(e,u.Sm),statusText:"Staleness +Reviewed"})})]}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(a.Z,{active:T.current,action:(0,v.c)(e,u.vT),disabled:C===x.Lx.FREQUENCY||p===x.vl.RECALL,statusText:(T?`(+${I.length} ) `:"")+"Reinforcement"})})]})]})})}}}]);