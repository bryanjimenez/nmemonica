"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[91],{7091:(e,d,n)=>{n.r(d),n.d(d,{default:()=>o});var s=n(5893),r=n(7294),i=n(5863),c=n(4953),t=n(6278),l=n(158),a=n(4933);function h(e,d){const n=Object.keys(e).map((d=>{var n;const s=null===(n=e[d])||void 0===n?void 0:n.lastView;return void 0===s?-1:(0,i.O5)(s)}));let s=new Array(d);return n.forEach((e=>{e>-1&&e<d&&(s[e]=s[e]?s[e]+1:1)})),s}function j(e){const d=Object.keys(e).map((d=>{var n;const{lastView:s,lastReview:r,accuracy:t,daysBetweenReviews:l}=null!==(n=e[d])&&void 0!==n?n:{};if(s&&(0,i.O5)(s)>0&&void 0!==t&&void 0!==r){const e=(0,i.O5)(r);return(0,c.ct)({accuracy:t,daysBetweenReviews:l,daysSinceReview:e})}return s&&0===(0,i.O5)(s)?-2:-1}));let n={overdue:0,due:0,pending:0,unPlayed:0};return d.forEach((e=>{2===e?n.overdue=n.overdue+1:e>=1?n.due=n.due+1:e>0?n.pending=n.pending+1:-2===e||(n.unPlayed=n.unPlayed+1)})),n}function o(){const{repetition:e}=(0,l.Q)(),{repetition:d}=(0,a.Z)(),{repetition:n}=(0,t.R)(),{phraseC:i,vocabC:c,kanjiC:o,phraseR:x,vocabR:u,kanjiR:v}=(0,r.useMemo)((()=>({phraseC:h(e,5),vocabC:h(d,5),kanjiC:h(n,5),phraseR:j(e),vocabR:j(d),kanjiR:j(n)})),[e,d,n]),p=i.map(((e,d)=>new Date(Date.now()-864e5*d).toLocaleString("en-us",{weekday:"short"})));return(0,s.jsx)("div",{className:"outer",children:(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Recall"}),(0,s.jsx)("td",{children:"Overdue"}),(0,s.jsx)("td",{children:"Due"}),(0,s.jsx)("td",{children:"..."})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),(0,s.jsx)("td",{children:x.overdue}),(0,s.jsx)("td",{children:x.due}),(0,s.jsx)("td",{children:x.pending})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),(0,s.jsx)("td",{children:u.overdue}),(0,s.jsx)("td",{children:u.due}),(0,s.jsx)("td",{children:u.pending})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),(0,s.jsx)("td",{children:v.overdue}),(0,s.jsx)("td",{children:v.due}),(0,s.jsx)("td",{children:v.pending})]})]})]})}),(0,s.jsx)("div",{className:"column-2 setting-block",children:(0,s.jsx)("div",{className:"mb-2",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Viewed"}),p.map(((e,d)=>(0,s.jsx)("td",{children:0===d?"Today":e},`${d} ${e}`)))]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),i.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),c.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),o.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]})]})]})})})]})})}}}]);