"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[91],{7091:(e,d,n)=>{n.r(d),n.d(d,{default:()=>o});var s=n(5893),r=n(7294),i=n(5863),l=n(4953),c=n(6278),t=n(158),a=n(4933);function h(e,d){const n=Object.keys(e).map((d=>{var n;const s=null===(n=e[d])||void 0===n?void 0:n.lastView;return void 0===s?-1:(0,i.O5)(s)}));let s=new Array(d);return s.fill(0),n.forEach((e=>{e>-1&&e<d&&(s[e]=s[e]?s[e]+1:1)})),s}function j(e){let d={wrong:0,overdue:0,due:0,pending:0,unPlayed:0};return Object.keys(e).map((n=>{var s;const{lastView:r,lastReview:c,accuracyP:t,daysBetweenReviews:a}=null!==(s=e[n])&&void 0!==s?s:{},h=!(!r||0!==(0,i.O5)(r)),j=!(!c||0!==(0,i.O5)(c));if(!c||j||h||"number"!=typeof t)j||(d.unPlayed=d.unPlayed+1);else if(t<100*l._9)d.wrong+=1;else{const e=(0,i.O5)(c),n=(0,l.ct)({accuracy:t/100,daysBetweenReviews:a,daysSinceReview:e});2===n?d.overdue+=1:n>1?d.due+=1:n>0&&(d.pending+=1)}})),d}function o(){const{repetition:e}=(0,t.Q)(),{repetition:d}=(0,a.Z)(),{repetition:n}=(0,c.R)(),{phraseC:i,vocabC:l,kanjiC:o,phraseR:x,vocabR:u,kanjiR:p}=(0,r.useMemo)((()=>({phraseC:h(e,5),vocabC:h(d,5),kanjiC:h(n,5),phraseR:j(e),vocabR:j(d),kanjiR:j(n)})),[e,d,n]),v=i.map(((e,d)=>new Date(Date.now()-864e5*d).toLocaleString("en-us",{weekday:"short"})));return(0,s.jsx)("div",{className:"outer",children:(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1 text-end",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Recall"}),(0,s.jsx)("td",{className:"p-1",children:"-1"}),(0,s.jsx)("td",{className:"p-1",children:"2.0"}),(0,s.jsx)("td",{className:"p-1",children:"(1,2)"}),(0,s.jsx)("td",{className:"p-1",children:"(0,1]"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),(0,s.jsx)("td",{children:x.wrong}),(0,s.jsx)("td",{children:x.overdue}),(0,s.jsx)("td",{children:x.due}),(0,s.jsx)("td",{children:x.pending})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),(0,s.jsx)("td",{children:u.wrong}),(0,s.jsx)("td",{children:u.overdue}),(0,s.jsx)("td",{children:u.due}),(0,s.jsx)("td",{children:u.pending})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),(0,s.jsx)("td",{children:p.wrong}),(0,s.jsx)("td",{children:p.overdue}),(0,s.jsx)("td",{children:p.due}),(0,s.jsx)("td",{children:p.pending})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{}),(0,s.jsx)("td",{children:x.wrong+u.wrong+p.wrong}),(0,s.jsx)("td",{children:x.overdue+u.overdue+p.overdue}),(0,s.jsx)("td",{children:x.due+u.due+p.due}),(0,s.jsx)("td",{children:x.pending+u.pending+p.pending})]})]})]})}),(0,s.jsx)("div",{className:"column-2 setting-block",children:(0,s.jsx)("div",{className:"mb-2",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Viewed"}),v.map(((e,d)=>(0,s.jsx)("td",{className:"p-1",children:0===d?"Today":e},`${d} ${e}`)))]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),i.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),l.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),o.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{}),i.map(((e,d)=>{var n,r,c;return(0,s.jsx)("td",{children:(null!==(n=i[d])&&void 0!==n?n:0)+(null!==(r=l[d])&&void 0!==r?r:0)+(null!==(c=o[d])&&void 0!==c?c:0)},`total-${v[d]}-${d}`)}))]})]})]})})})]})})}}}]);