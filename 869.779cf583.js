(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["869"],{56640:function(e,t,l){},75985:function(e,t,l){"use strict";l.r(t),l.d(t,{default:function(){return N}});var i=l("73909"),s=l("76164"),a=l("2195"),r=l.n(a),n=l("28697"),c=l("43549"),o=l("25148"),d=l("77397"),u=l("62942"),m=l("59940"),b=l("31959"),x=l("1518"),h=l("30858"),v=l("72834"),j=l("98190"),g=l("35225"),f=l("72176"),y=l("40868"),p=l("9446");function N(){let e=(0,c.useDispatch)(),{vocabList:t,vocabGroups:l,sortMethod:a,romajiEnabled:N,bareKanji:T,hintEnabled:A,activeGroup:C,autoVerbView:V,verbColSplit:F,filterType:S,difficultyThreshold:w,repetition:R,spaRepMaxReviewItem:E,reinforce:k,verbFormsOrder:L,includeNew:G,includeReviewed:B}=(0,j.useConnectVocabulary)(),I=S.current,M=a.current,O=k.current,q=A.current;0===Object.keys(l).length&&e((0,f.getVocabulary)());let U=(0,n.useMemo)(()=>Object.keys(R).filter(e=>R[e]?.rein===!0),[R]),[z,D]=(0,n.useMemo)(()=>{let e=f.vocabularyInitState.setting.verbFormsOrder,t=L.reduce((t,l)=>(e.includes(l)&&(t=[...t,l]),t),[]),l=e.reduce((e,l)=>(!t.includes(l)&&(e=[...e,l]),e),[]);return[t,l]},[L]);if(t.length<1||Object.keys(l).length<1)return(0,i.jsx)(o.NotReady,{addlStyle:"vocabulary-settings"});let K=(0,v.getStaleGroups)(l,C);if(K.length>0){let e=Error("Stale vocabulary active group",{cause:{code:"StaleVocabActiveGrp",value:K}});throw e}let Q=(0,i.jsx)("div",{className:"outer",children:(0,i.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,i.jsxs)("div",{className:"column-1",children:[(0,i.jsx)(m.default,{flip:!0,title:"Filter by:",options:["Word Group","Frequency List"],initial:I,onChange:(0,h.buildAction)(e,f.toggleVocabularyFilter)}),I===g.TermFilterBy.GROUP&&(0,i.jsx)(p.SetTermGList,{termsGroups:l,termsActive:C,toggleTermActiveGrp:(0,h.buildAction)(e,f.toggleVocabularyActiveGrp)}),I===g.TermFilterBy.FREQUENCY&&0===U.length&&(0,i.jsx)("div",{className:"fst-italic",children:"No words have been chosen"}),I===g.TermFilterBy.FREQUENCY&&U.length>0&&(0,i.jsx)(y.SetTermGFList,{termsActive:C,termsFreq:U,terms:t,removeFrequencyTerm:(0,h.buildAction)(e,f.removeFrequencyWord),toggleTermActiveGrp:(0,h.buildAction)(e,f.toggleVocabularyActiveGrp)})]}),(0,i.jsxs)("div",{className:"column-2 setting-block",children:[(0,i.jsx)(m.default,{title:"Sort by:",options:g.TermSortByLabel,initial:M,onChange:t=>(g.TermSortBy.RECALL===t&&e((0,f.toggleVocabularyReinforcement)(!1)),(0,h.buildAction)(e,f.toggleVocabularyOrdering)(t))}),(0,i.jsx)("div",{className:"d-flex justify-content-end",children:(0,i.jsx)(b.ThresholdFilterSlider,{threshold:w,setThreshold:(0,h.buildAction)(e,f.setMemorizedThreshold)})}),M===g.TermSortBy.RECALL&&(0,i.jsx)(d.default,{label:"Max review items ",value:E,onChange:t=>{e((0,f.setSpaRepMaxItemReview)(t))}}),M===g.TermSortBy.VIEW_DATE&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:G,action:(0,h.buildAction)(e,f.toggleIncludeNew),statusText:"Staleness +New"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:B,action:(0,h.buildAction)(e,f.toggleIncludeReviewed),statusText:"Staleness +Reviewed"})})]}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:O,action:(0,h.buildAction)(e,f.toggleVocabularyReinforcement),disabled:I===g.TermFilterBy.FREQUENCY||M===g.TermSortBy.RECALL,statusText:"Reinforcement"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:N,action:(0,h.buildAction)(e,f.toggleVocabularyRomaji),statusText:"Romaji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:T,action:(0,h.buildAction)(e,f.toggleVocabularyBareKanji),statusText:"English+Kanji"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:q,action:(0,h.buildAction)(e,f.toggleVocabularyHint),statusText:"Hint"})}),(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)(u.default,{active:V,action:(0,h.buildAction)(e,f.toggleAutoVerbView),statusText:"Auto Verb View"})}),V&&(0,i.jsx)("div",{className:"mb-2",children:(0,i.jsx)("div",{className:"d-flex flex-row justify-content-end",children:(0,i.jsx)("div",{children:[z.map((t,l)=>(0,i.jsxs)("div",{className:r({"d-flex justify-content-between":!0,"pt-2":l===z.length-F,"pb-2":l===z.length-1&&0===F}),children:[(0,i.jsx)("div",{className:r({"me-3":!0,"disabled-color":0===l}),onClick:()=>{if(l>0){let t=z.slice(0,l-1),i=z[l-1],s=z[l],a=z.slice(l+1);e((0,f.setVerbFormsOrder)([...t,s,i,...a]))}},children:(0,i.jsx)(s.ChevronUpIcon,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start",children:t}),(0,i.jsx)("div",{onClick:()=>{if(z.length>1){let t=[...z.slice(0,l),...z.slice(l+1)];e((0,f.setVerbFormsOrder)(t))}},children:(0,i.jsx)(s.XCircleIcon,{className:r({"mt-1 ms-3":!0,"incorrect-color":z.length>1,"disabled-color":1===z.length}),size:"small","aria-label":"remove"})})]},t)),D.map((t,l)=>(0,i.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,i.jsx)("div",{className:"me-3 invisible",children:(0,i.jsx)(s.ChevronUpIcon,{className:"mt-1",size:"small","aria-label":"move up"})}),(0,i.jsx)("span",{className:"w-100 text-start disabled-color",children:t}),(0,i.jsx)("div",{onClick:(0,h.buildAction)(e,f.setVerbFormsOrder,[...z,D[l]]),children:(0,i.jsx)(s.PlusCircleIcon,{className:"mt-1 ms-3",size:"small","aria-label":"add"})})]},t))]})})}),V&&(0,i.jsx)("div",{children:(0,i.jsx)("div",{className:"d-flex justify-content-end p-2",children:(0,i.jsx)(x.default,{initial:z.length-F,setChoiceN:t=>{e((0,f.updateVerbColSplit)(z.length-t))},max:L.length,statusText:"Column layout"})})})]})]})});return Q}},1518:function(e,t,l){"use strict";l.r(t),l.d(t,{default:function(){return c}});var i=l("73909"),s=l("5951"),a=l("73959"),r=l.n(a),n=l("28697");function c(e){var t;let[l]=(0,n.useState)(e.initial),a=Math.min(e.max,l),r=e.max,c=[],o={};for(let e=0;e<r+1;e++){let t=(e-0)/(r-0)*100;c=[...c,{value:t,raw:e}],o["r"+t]=e,o["s"+e]=t}let d=e=>o["r"+e],u=e=>{let t=d(e),l=Math.trunc(r/2),i="",s=l+Math.abs(l-t);return r%2!=0&&t<=l&&(i=String(++s)),r%2==0&&t===l||(i=t<l+1?s+" "+(r-s):r-s+" "+s),i},m=t=>{let l=d(t);l!==a&&e.setChoiceN(l)};return(0,i.jsxs)("div",{className:"verb-form-slider-root",children:[(0,i.jsx)(s.Typography,{id:"discrete-slider-restrict",gutterBottom:!0,children:e.statusText}),(0,i.jsx)(s.Slider,{defaultValue:(t=a,o["s"+t]),valueLabelFormat:u,getAriaValueText:u,"aria-labelledby":"discrete-slider-restrict",track:!1,step:null,valueLabelDisplay:"auto",marks:c,onChangeCommitted:(e,t)=>{"number"==typeof t&&m(t)}})]})}l("56640"),c.propTypes={statusText:r.string,initial:r.number.isRequired,max:r.number.isRequired,setChoiceN:r.func.isRequired}}}]);