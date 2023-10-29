"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[546],{1546:(e,d,n)=>{n.r(d),n.d(d,{default:()=>v});var s=n(5893),l=n(7294),r=n(6537),t=n(5863),i=n(4953);function c(e,d){const n=Object.keys(e).map((d=>{var n;const s=null===(n=e[d])||void 0===n?void 0:n.lastView;return void 0===s?-1:(0,t.O5)(s)}));let s=new Array(d);return s.fill(0),n.forEach((e=>{e>-1&&e<d&&(s[e]=s[e]?s[e]+1:1)})),s}function a(e){let d={wrong:0,overdue:0,due:0,pending:0,unPlayed:0};return Object.keys(e).map((n=>{var s;const{lastView:l,lastReview:r,accuracyP:c,daysBetweenReviews:a}=null!==(s=e[n])&&void 0!==s?s:{},h=!(!l||0!==(0,t.O5)(l)),x=!(!r||0!==(0,t.O5)(r));if(!r||x||h||"number"!=typeof c)return x?0:(d.unPlayed=d.unPlayed+1,-1);{const e=(0,t.O5)(r),n=(0,i.ct)({accuracy:c/100,daysBetweenReviews:a,daysSinceReview:e});return c<100*i._9?d.wrong+=1:2===n?d.overdue+=1:n>=1?d.due+=1:n>0&&(d.pending+=1),n}})),d}function h(e){const d={range:0,unPlayed:0,min:Number.MAX_SAFE_INTEGER,max:-1,mean:Number.NaN,q1:Number.NaN,q2:Number.NaN,q3:Number.NaN};let n=0;const s=Object.keys(e).reduce(((s,l)=>{var r;const i=null===(r=e[l])||void 0===r?void 0:r.lastView;if(void 0!==i){const e=(0,t.O5)(i);return d.min=d.min>e?e:d.min,d.max=d.max<e?e:d.max,n+=e,[...s,e]}return d.unPlayed+=1,s}),[]),l=[...s].sort(((e,d)=>e-d));return d.range=s.length,d.mean=n/s.length,d.q1=l[Math.round(.25*s.length)-1],d.q3=l[Math.round(.75*s.length)-1],s.length%2==0?d.q2=(l[Math.round(.5*s.length)-1]+l[Math.round(.5*s.length)])/2:d.q2=l[Math.round(.5*s.length)-1],d}function x(e){let d=0,n=new Array(10);return n.fill(0),Object.keys(e).map((s=>{var l;const r=null===(l=e[s])||void 0===l?void 0:l.difficultyP;if(void 0===r)return d+=1,-1;{const e=r/10-1;return n[e]=n[e]+1,r}})),n}var j=n(6278),o=n(158),m=n(4933);const u=(0,l.lazy)((()=>n.e(52).then(n.bind(n,2052)))),p=(0,l.lazy)((()=>n.e(423).then(n.bind(n,1423))));function v(){const{repetition:e}=(0,o.Q)(),{repetition:d}=(0,m.Z)(),{repetition:n}=(0,j.R)(),{phraseC:t,vocabC:i,kanjiC:v,phraseR:N,vocabR:b,kanjiR:g,phraseQ:w,vocabQ:y,kanjiQ:f,phraseD:k,vocabD:q,kanjiD:$}=(0,l.useMemo)((()=>({phraseC:c(e,5),vocabC:c(d,5),kanjiC:c(n,5),phraseR:a(e),vocabR:a(d),kanjiR:a(n),phraseQ:h(e),vocabQ:h(d),kanjiQ:h(n),phraseD:x(e),vocabD:x(d),kanjiD:x(n)})),[e,d,n]),P=t.map(((e,d)=>new Date(Date.now()-864e5*d).toLocaleString("en-us",{weekday:"short"})));return(0,s.jsxs)("div",{className:"outer",children:[(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1 text-end",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Recall"}),(0,s.jsx)("td",{className:"p-1",children:"(0,1)"}),(0,s.jsx)("td",{className:"p-1",children:"[1,2)"}),(0,s.jsx)("td",{className:"p-1",children:"2.0"}),(0,s.jsx)("td",{className:"p-1",children:"-1"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),(0,s.jsx)("td",{children:N.pending}),(0,s.jsx)("td",{children:N.due}),(0,s.jsx)("td",{children:N.overdue}),(0,s.jsx)("td",{children:N.wrong})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),(0,s.jsx)("td",{children:b.pending}),(0,s.jsx)("td",{children:b.due}),(0,s.jsx)("td",{children:b.overdue}),(0,s.jsx)("td",{children:b.wrong})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),(0,s.jsx)("td",{children:g.pending}),(0,s.jsx)("td",{children:g.due}),(0,s.jsx)("td",{children:g.overdue}),(0,s.jsx)("td",{children:g.wrong})]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{}),(0,s.jsx)("td",{children:N.pending+b.pending+g.pending}),(0,s.jsx)("td",{children:N.due+b.due+g.due}),(0,s.jsx)("td",{children:N.overdue+b.overdue+g.overdue}),(0,s.jsx)("td",{children:N.wrong+b.wrong+g.wrong})]})]})]})}),(0,s.jsx)("div",{className:"column-2 setting-block",children:(0,s.jsx)("div",{className:"mb-2",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"Viewed"}),P.map(((e,d)=>(0,s.jsx)("td",{className:"p-1",children:0===d?"Today":e},`${d.toString()} ${e}`)))]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),t.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),i.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),v.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{}),t.map(((e,d)=>{var n,l,r;return(0,s.jsx)("td",{children:(null!==(n=t[d])&&void 0!==n?n:0)+(null!==(l=i[d])&&void 0!==l?l:0)+(null!==(r=v[d])&&void 0!==r?r:0)},`total-${P[d]}-${d.toString()}`)}))]})]})]})})})]}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between mb-2",children:[(0,s.jsx)("div",{className:"column-1 text-end",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"lastView"}),(0,s.jsx)("td",{className:"p-1",children:"new"}),(0,s.jsx)("td",{className:"p-1",children:"mean"}),(0,s.jsx)("td",{className:"p-1",children:"q0"}),(0,s.jsx)("td",{className:"p-1",children:"q1"}),(0,s.jsx)("td",{className:"p-1",children:"q2"}),(0,s.jsx)("td",{className:"p-1",children:"q3"}),(0,s.jsx)("td",{className:"p-1",children:"q4"})]})}),(0,s.jsxs)("tbody",{children:[w.range>0&&(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),(0,s.jsx)("td",{children:w.unPlayed}),(0,s.jsx)("td",{children:w.mean.toFixed(1)}),(0,s.jsx)("td",{children:w.min}),(0,s.jsx)("td",{children:w.q1}),(0,s.jsx)("td",{children:w.q2}),(0,s.jsx)("td",{children:w.q3}),(0,s.jsx)("td",{children:w.max})]}),y.range>0&&(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),(0,s.jsx)("td",{children:y.unPlayed}),(0,s.jsx)("td",{children:y.mean.toFixed(1)}),(0,s.jsx)("td",{children:y.min}),(0,s.jsx)("td",{children:y.q1}),(0,s.jsx)("td",{children:y.q2}),(0,s.jsx)("td",{children:y.q3}),(0,s.jsx)("td",{children:y.max})]}),f.range>0&&(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),(0,s.jsx)("td",{children:f.unPlayed}),(0,s.jsx)("td",{children:f.mean.toFixed(1)}),(0,s.jsx)("td",{children:f.min}),(0,s.jsx)("td",{children:f.q1}),(0,s.jsx)("td",{children:f.q2}),(0,s.jsx)("td",{children:f.q3}),(0,s.jsx)("td",{children:f.max})]})]})]})}),(0,s.jsx)("div",{className:"column-2 setting-block"})]}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between mb-2",children:[(0,s.jsx)("div",{className:"column-1 text-end",children:(0,s.jsxs)("table",{className:"w-50",children:[(0,s.jsx)("thead",{children:(0,s.jsxs)("tr",{children:[(0,s.jsx)("th",{children:"difficultyP"}),(0,s.jsx)("td",{className:"p-1",children:"0"}),(0,s.jsx)("td",{className:"p-1",children:"11"}),(0,s.jsx)("td",{className:"p-1",children:"21"}),(0,s.jsx)("td",{className:"p-1",children:"31"}),(0,s.jsx)("td",{className:"p-1",children:"41"}),(0,s.jsx)("td",{className:"p-1",children:"51"}),(0,s.jsx)("td",{className:"p-1",children:"61"}),(0,s.jsx)("td",{className:"p-1",children:"71"}),(0,s.jsx)("td",{className:"p-1",children:"81"}),(0,s.jsx)("td",{className:"p-1",children:"91"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Phrases:"}),k.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Vocabulary:"}),q.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]}),(0,s.jsxs)("tr",{children:[(0,s.jsx)("td",{children:"Kanji:"}),$.map(((e,d)=>(0,s.jsx)("td",{children:e},`${d.toString()} ${e}`)))]})]})]})}),(0,s.jsx)("div",{className:"column-2 setting-block"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)(l.Suspense,{fallback:(0,s.jsx)(r.n,{addlStyle:"failed-spacerep-view"}),children:(0,s.jsx)(u,{})}),(0,s.jsx)(l.Suspense,{fallback:(0,s.jsx)(r.n,{addlStyle:"failed-furigana-view"}),children:(0,s.jsx)(p,{})})]})]})}}}]);