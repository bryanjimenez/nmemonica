(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["657"],{92635:function(e,t,r){e.exports=function(e,t,r,n){for(var l=-1,s=null==e?0:e.length;++l<s;){var i=e[l];t(n,i,r(i),e)}return n}},83184:function(e,t,r){var n=r("65587");e.exports=function(e,t,r,l){return n(e,function(e,n,s){t(l,e,r(e),s)}),l}},50954:function(e,t,r){var n=r("92635"),l=r("83184"),s=r("87320"),i=r("85885");e.exports=function(e,t){return function(r,a){var c=i(r)?n:l,o=t?t():{};return c(r,e,s(a,2),o)}}},69725:function(e,t,r){var n=r("50954")(function(e,t,r){e[r?0:1].push(t)},function(){return[[],[]]});e.exports=n},2155:function(e,t,r){"use strict";r.r(t),r.d(t,{GroupItem:function(){return o}});var n=r("10327"),l=r("82511"),s=r.n(l),i=r("21331"),a=r.n(i),c=r("78615");function o(e){let t=s({[""+e.addlStyle]:!!e.addlStyle,"p-0 px-2":!0,"font-weight-bold":e.active});return(0,n.jsxs)("div",{className:t,onClick:e.onClick,children:[(0,n.jsx)("span",{className:"p-1",children:e.active?(0,n.jsx)(c.XCircleIcon,{className:"clickable incorrect-color",size:"small","aria-label":"remove"}):(0,n.jsx)(c.PlusCircleIcon,{className:"clickable",size:"small","aria-label":"add"})}),(0,n.jsx)("span",{className:"p-1",children:e.children})]})}r("83169"),o.propTypes={addlStyle:a.string,active:a.bool,onClick:a.func,children:a.string}},44727:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var n=r("10327"),l=r("82511"),s=r.n(l),i=r("21331"),a=r.n(i);function c(e){let{label:t,value:r}=e;return(0,n.jsxs)("div",{className:s({"mb-3 d-flex flex-row justify-content-end":!0}),children:[(0,n.jsx)("div",{children:t}),(0,n.jsx)("div",{className:"clickable px-2",onClick:()=>{e.onChange(r-1)},children:"-"}),(0,n.jsx)("div",{className:s({"px-2":!0}),children:r}),(0,n.jsx)("div",{className:"clickable px-2",onClick:()=>{e.onChange(r+1)},children:"+"})]})}c.propTypes={value:a.number}},92404:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return j}});var n=r("10327"),l=r("40432"),s=r("42565"),i=r("44727"),a=r("3252"),c=r("22719"),o=r("2497"),u=r("10776"),d=r("480"),m=r("58800"),p=r("80161"),h=r("16332"),f=r("40665"),v=r("93781"),x=r("37488"),b=r("8770");function j(){let e=(0,l.useDispatch)(),{vocabList:t}=(0,p.useConnectVocabulary)(),{filterType:r,orderType:j,difficultyThreshold:g,reinforce:T,activeTags:y,kanjiList:N,repetition:S,kanjiTagObj:C,spaRepMaxReviewItem:k,includeNew:I,includeReviewed:w}=(0,m.useConnectKanji)(),A=r.current,F=j.current;if(0===t.length&&e((0,v.getVocabulary)()),0===Object.keys(C).length&&e((0,h.getKanji)()),N.length<1||Object.keys(C).length<1)return(0,n.jsx)(s.NotReady,{addlStyle:"vocabulary-settings"});let E=Object.values(N).filter(e=>e.tags.some(e=>y.includes(e))),L=E.map(e=>e.uid),R=Object.keys(S).filter(e=>S[e]?.rein===!0),q=R.filter(e=>!L.includes(e)),D=(0,n.jsx)("div",{className:"outer",children:(0,n.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,n.jsxs)("div",{className:"column-1",children:[(0,n.jsx)("h4",{children:(0,d.labelOptions)(A,["Kanji Group","Frequency List","Tags"])}),(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(a.default,{active:A%2==0,action:(0,u.buildAction)(e,h.toggleKanjiFilter),color:"default",statusText:"Filter by"})}),A===f.TermFilterBy.FREQUENCY&&0===R.length&&(0,n.jsx)("div",{className:"fst-italic",children:"No words have been chosen"}),A===f.TermFilterBy.TAGS&&(0,n.jsx)(b.SetTermTagList,{selectedCount:0===E.length?Object.values(N).length:E.length,termsTags:C,termsActive:y,toggleTermActive:(0,u.buildAction)(e,h.toggleKanjiActiveTag)}),A===f.TermFilterBy.FREQUENCY&&R.length>0&&(0,n.jsx)(x.SetTermGFList,{termsActive:y,termsFreq:R,terms:N,removeFrequencyTerm:(0,u.buildAction)(e,h.removeFrequencyKanji),toggleTermActiveGrp:(0,u.buildAction)(e,h.toggleKanjiActiveGrp)})]}),(0,n.jsxs)("div",{className:"column-2 setting-block",children:[(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(c.default,{title:"Sort by:",options:f.TermSortByLabel,allowed:[f.TermSortBy.DIFFICULTY,f.TermSortBy.RANDOM,f.TermSortBy.VIEW_DATE,f.TermSortBy.RECALL],initial:F,onChange:t=>(f.TermSortBy.RECALL===t&&e((0,h.toggleKanjiReinforcement)(!1)),(0,u.buildAction)(e,h.toggleKanjiOrdering)(t))})}),F===f.TermSortBy.RECALL&&(0,n.jsx)(i.default,{label:"Max review items ",value:k,onChange:t=>{e((0,h.setSpaRepMaxItemReview)(t))}}),(0,n.jsx)("div",{className:"d-flex justify-content-end",children:(0,n.jsx)(o.ThresholdFilterSlider,{threshold:g,setThreshold:(0,u.buildAction)(e,h.setMemorizedThreshold)})}),F===f.TermSortBy.VIEW_DATE&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(a.default,{active:I,action:(0,u.buildAction)(e,h.toggleIncludeNew),statusText:"Staleness +New"})}),(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(a.default,{active:w,action:(0,u.buildAction)(e,h.toggleIncludeReviewed),statusText:"Staleness +Reviewed"})})]}),(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(a.default,{active:T.current,action:(0,u.buildAction)(e,h.toggleKanjiReinforcement),disabled:A===f.TermFilterBy.FREQUENCY||F===f.TermSortBy.RECALL,statusText:(T?`(+${q.length} ) `:"")+"Reinforcement"})})]})]})});return D}},22719:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return d}});var n=r("10327"),l=r("58093"),s=r("78615"),i=r("82511"),a=r.n(i),c=r("21331"),o=r.n(c),u=r("83169");function d(e){let[t,r]=(0,u.useState)(null),[i,c]=(0,u.useState)(e.initial),o=(0,u.useRef)(e.options),d=(0,u.useRef)(e.allowed??e.options.map((e,t)=>t)),m=o.current,p=d.current;(0,u.useEffect)(()=>{c(e.initial)},[e.initial]);let h=!!t,f=e=>{r(e.currentTarget)},v=(t,n)=>{c(n),r(null),e.onChange(n)};return(0,n.jsxs)("div",{className:a({clickable:!0!==e.disabled,"d-flex":!0,"flex-row-reverse":!0===e.flip||void 0,"justify-content-end":!0}),children:[(0,n.jsx)(l.List,{component:"nav",disablePadding:!0,children:(0,n.jsx)(l.ListItemButton,{disableGutters:!0,disabled:!0===e.disabled,id:"filter-button","aria-haspopup":"listbox","aria-controls":"filter-menu","aria-expanded":h?"true":void 0,onClick:f,children:(0,n.jsx)(l.ListItemText,{primary:e.title,secondary:m[i],secondaryTypographyProps:{color:"unset"}})})}),(0,n.jsx)(l.Menu,{id:"filter-menu",anchorEl:t,open:h,onClose:()=>{r(null)},MenuListProps:{"aria-labelledby":"filter-button",role:"listbox"},children:m.map((e,t)=>(0,n.jsx)(l.MenuItem,{selected:t===i,onClick:e=>{p.includes(t)&&v(e,t)},children:p.includes(t)?e:(0,n.jsx)("span",{className:"disabled-color",children:e})},e))}),(0,n.jsx)(l.IconButton,{"aria-labelledby":"filter-button",sx:{color:"unset",minWidth:"55px"},"aria-haspopup":"listbox",disabled:!0===e.disabled,onClick:f,children:(0,n.jsx)(s.KebabHorizontalIcon,{size:"medium",className:a({"rotate-transition":!0,"rotate-90":h})})})]})}d.propTypes={disabled:o.bool,flip:o.bool,title:o.string,options:o.arrayOf(o.string),initial:o.number,onChange:o.func}},2497:function(e,t,r){"use strict";r.r(t),r.d(t,{ThresholdFilterSlider:function(){return d}});var n=r("10327"),l=r("58093"),s=r("78615"),i=r("21331"),a=r.n(i),c=r("83169"),o=r("75010"),u=r("67402");function d(e){let{threshold:t,setThreshold:r}=e,[i]=(0,c.useState)(Math.abs(t)),a=(0,o.heatMap)(Math.abs(t)/100,.75),d=[{value:u.MEMORIZED_THRLD},{value:u.DIFFICULTY_THRLD}],m=(0,c.useCallback)(()=>{r(-1*t)},[r,t]);return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"position-relative text-nowrap w-0 fs-x-small",style:{top:"-15px"},children:`Difficulty filter: ${t}`}),(0,n.jsx)(l.Slider,{sx:{color:a},defaultValue:i,marks:d,track:t<0?void 0:"inverted",onChangeCommitted:(e,n)=>{let l=t<0?-1:1;"number"==typeof n&&(0===n?r(Number(l)):r(l*n))},valueLabelDisplay:"auto"}),(0,n.jsx)("div",{className:"mt-2 ms-3 ",onClick:m,children:t<0?(0,n.jsx)(s.SortAscIcon,{}):(0,n.jsx)(s.SortDescIcon,{})})]})}d.propTypes={threshold:a.number,setThreshold:a.func}},37488:function(e,t,r){"use strict";r.r(t),r.d(t,{SetTermGFList:function(){return u}});var n=r("10327");r("83169");var l=r("21331"),s=r.n(l),i=r("78615"),a=r("82511"),c=r.n(a);function o(e,t,r,l,s){return(0,n.jsxs)("div",{className:c({"p-0 px-2":!0,clickable:e}),onClick:()=>{e&&s(r)},children:[(0,n.jsxs)("span",{className:"p-1",children:[e&&(0,n.jsx)(i.XCircleIcon,{className:"incorrect-color",size:"small","aria-label":"remove"}),!e&&(0,n.jsx)(i.IssueDraftIcon,{size:"small","aria-label":"inactive"})]}),(0,n.jsx)("span",{className:"p-1",children:l})]},t)}function u(e){let t=[],r=e.termsFreq.reduce((r,n)=>{let l=e.terms.find(e=>e.uid===n);return l?r=[...r,l]:t=[...t,n],r},[]),l=r.reduce((e,t)=>{let r=t.grp?t.grp:"undefined";return e[r]?e[r]=[...e[r],t]:e[r]=[t],e},{});return(0,n.jsxs)("div",{children:[(0,n.jsx)("h5",{children:"Frequency"},0),(0,n.jsx)("div",{children:Object.keys(l).map((t,r)=>{let s=e.termsActive.includes(t);return(0,n.jsxs)("div",{className:"mb-2",children:[(0,n.jsx)("span",{className:c({"font-weight-bold":s}),onClick:()=>e.toggleTermActiveGrp(t),children:t}),(0,n.jsx)("div",{children:l[t].map((t,r)=>o(s,r,t.uid,t.english,e.removeFrequencyTerm))})]},t)})},1),t.length>0&&(0,n.jsxs)("div",{className:"mt-5 text-break",children:[(0,n.jsx)("span",{className:"font-weight-bold",children:"Manual cleanup"}),t.map((t,r)=>o(!0,r,t,t,e.removeFrequencyTerm))]})]})}u.propTypes={termsActive:s.array,termsFreq:s.array,terms:s.array,removeFrequencyTerm:s.func,toggleTermActiveGrp:s.func}},8770:function(e,t,r){"use strict";r.r(t),r.d(t,{isGroupLevel:function(){return m},SetTermTagList:function(){return p}});var n=r("10327"),l=r("56596"),s=r.n(l),i=r("69725"),a=r.n(i),c=r("21331"),o=r.n(c),u=r("83169"),d=r("2155");function m(e){return e.includes("_")&&Number.isInteger(parseInt(e.split("_")[1],10))}function p(e){let{termsActive:t,termsTags:r,toggleTermActive:l,selectedCount:i}=e;(0,u.useEffect)(()=>{t.forEach(e=>{!r.includes(e)&&l(e)})},[t,r,l]);let[c,o]=a(r,e=>m(e)),p=Object.values(c.reduce((e,t)=>{let r=t.split("_")[0];return e[r]?e[r]=[...e[r],t]:e[r]=[t],e},{})),h=[...s(o),...p.reduce((e,t)=>{let r=s(t,e=>{let[,t]=e.split("_");return Number.isInteger(parseInt(t,10))?parseInt(t,10):e});return[...e,...r]},[])];return(0,n.jsxs)("div",{children:[(0,n.jsxs)("h5",{children:["Tag List ",i&&i>0&&"("+i+")"||""]},0),h.map((e,r)=>(0,n.jsx)("div",{children:(0,n.jsx)(d.GroupItem,{active:t.includes(e),onClick:()=>{l(e)},children:e},r)},r+1))]})}p.propTypes={termsTags:o.array,termsActive:o.array,toggleTermActive:o.func,selectedCount:o.number}},75010:function(e,t,r){"use strict";r.r(t),r.d(t,{heatMap:function(){return l}});var n=r("40503");function l(e,t=.25){let[r,l,s]=[13,110,256],i=[r,(0,n.lerp)(l,255,e),(0,n.lerp)(s,0,e)],a=[(0,n.lerp)(0,255,e),255,0],c=[255,(0,n.lerp)(255,0,e),0],o=[(0,n.lerp)(i[0],a[0],e),(0,n.lerp)(i[1],a[1],e),(0,n.lerp)(i[2],a[2],e)],u=[(0,n.lerp)(a[0],c[0],e),(0,n.lerp)(a[1],c[1],e),(0,n.lerp)(a[2],c[2],e)],d=[(0,n.lerp)(o[0],u[0],e),(0,n.lerp)(o[1],u[1],e),(0,n.lerp)(o[2],u[2],e)],[m,p,h]=d.map(e=>Math.floor(e)),f=`rgb(${m},${p},${h},${t})`;return f}},58800:function(e,t,r){"use strict";r.r(t),r.d(t,{useConnectKanji:function(){return s}});var n=r("83169"),l=r("40432");function s(){let e=(0,l.useSelector)(({global:e})=>e.swipeThreshold),{value:t}=(0,l.useSelector)(({kanji:e})=>e,(e,t)=>e.version===t.version),r=(0,l.useSelector)(({kanji:e})=>e.tagObj,l.shallowEqual),{repetition:s}=(0,l.useSelector)(({kanji:e})=>e.setting,(e,t)=>e.repTID===t.repTID),[i,a,c,o,u,d,m,p,h]=(0,l.useSelector)(({kanji:e})=>{let{reinforce:t,filter:r,ordered:n,difficultyThreshold:l,choiceN:s,fadeInAnswers:i,spaRepMaxReviewItem:a,includeNew:c,includeReviewed:o}=e.setting;return[t,r,n,l,s,i,a,c,o]},l.shallowEqual),f=(0,l.useSelector)(({kanji:e})=>{let{activeTags:t}=e.setting;return t},l.shallowEqual),v=(0,n.useRef)(i);v.current=i;let x=(0,n.useRef)(a);x.current=a;let b=(0,n.useRef)(c);return b.current=c,{repetition:s,swipeThreshold:e,difficultyThreshold:o,kanjiList:t,kanjiTagObj:r,activeTags:f,choiceN:u,fadeInAnswers:d,spaRepMaxReviewItem:m,includeNew:p,includeReviewed:h,reinforce:v,filterType:x,orderType:b}}},80161:function(e,t,r){"use strict";r.r(t),r.d(t,{useConnectVocabulary:function(){return s}});var n=r("83169"),l=r("40432");function s(){let[e,t,r]=(0,l.useSelector)(({global:e})=>[e.debug,e.swipeThreshold,e.motionThreshold],l.shallowEqual),{value:s,grpObj:i}=(0,l.useSelector)(({vocabulary:e})=>e,(e,t)=>e.version===t.version),{repetition:a}=(0,l.useSelector)(({vocabulary:e})=>e.setting,(e,t)=>e.repTID===t.repTID),[c,o,u,d,m,p]=(0,l.useSelector)(({vocabulary:e})=>{let{englishSideUp:t,autoVerbView:r,spaRepMaxReviewItem:n,includeNew:l,includeReviewed:s}=e.setting,{verbForm:i}=e;return[t,r,i,n,l,s]},l.shallowEqual),[h,f,v,x,b,j,g,T]=(0,l.useSelector)(({vocabulary:e})=>{let{difficultyThreshold:t,reinforce:r,filter:n,hintEnabled:l,romaji:s,bareKanji:i,verbColSplit:a,ordered:c}=e.setting;return[t,r,n,l,s,i,a,c]},l.shallowEqual),y=(0,l.useSelector)(({vocabulary:e})=>{let{verbFormsOrder:t}=e.setting;return t},l.shallowEqual),N=(0,l.useSelector)(({vocabulary:e})=>{let{activeGroup:t}=e.setting;return t},l.shallowEqual),S=(0,n.useRef)(f);S.current=f;let C=(0,n.useRef)(v);C.current=v;let k=(0,n.useRef)(x);k.current=x;let I=(0,n.useRef)(T);return I.current=T,{englishSideUp:c,autoVerbView:o,verbForm:u,repetition:a,difficultyThreshold:h,debugLevel:e,swipeThreshold:t,motionThreshold:r,vocabList:s,vocabGroups:i,romajiEnabled:b,bareKanji:j,verbFormsOrder:y,verbColSplit:g,activeGroup:N,spaRepMaxReviewItem:d,includeNew:m,includeReviewed:p,reinforce:S,hintEnabled:k,filterType:C,sortMethod:I}}}}]);