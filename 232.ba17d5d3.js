(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["232"],{36230:function(e,t,n){},58572:function(e,t,n){},21191:function(e,t,n){},39679:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return g}});var s=n("10327"),i=n("78615"),l=n("83169"),r=n("40432"),a=n("42565"),c=n("480"),o=n("58800"),d=n("93197"),u=n("80161"),h=n("16332"),f=n("72530"),x=n("93781"),v=n("97389");function g(){let e=(0,r.useDispatch)(),[t,n]=(0,l.useState)(!1),{vocabList:g,repetition:p}=(0,u.useConnectVocabulary)(),{phraseList:j,repetition:m}=(0,d.useConnectPhrase)(),{kanjiList:b,repetition:y}=(0,o.useConnectKanji)(),{keys:S,list:N}=(0,l.useMemo)(()=>(0,c.getStaleSpaceRepKeys)(p,g,"[Stale Vocabulary]"),[g,p]),{keys:w,list:k}=(0,l.useMemo)(()=>(0,c.getStaleSpaceRepKeys)(m,j,"[Stale Phrase]"),[j,m]),{keys:E,list:R}=(0,l.useMemo)(()=>(0,c.getStaleSpaceRepKeys)(y,b,"[Stale Kanji]"),[b,y]),T=(0,l.useMemo)(()=>new Set([...S,...w,...E]),[S,w,E]),M=(0,l.useMemo)(()=>(function(e){return e.reduce((t,n,i)=>{let l=(0,s.jsx)("hr",{},`stale-meta-${n.uid}`),r=(0,s.jsxs)("div",{className:"row",children:[(0,s.jsx)("span",{className:"col p-0",children:n.key}),(0,s.jsx)("span",{className:"col p-0",children:n.english}),(0,s.jsx)("span",{className:"col p-0 app-sm-fs-xx-small",children:(0,s.jsx)("div",{children:n.uid})})]},n.uid);return t.length>0&&i<e.length?[...t,l,r]:[...t,r]},[])})([...N,...k,...R]),[N,k,R]),C=(0,l.useMemo)(()=>R.reduce((e,t)=>"uid"===t.key?[...e,t.uid]:e,[]),[R]),P=(0,l.useMemo)(()=>k.reduce((e,t)=>"uid"===t.key?[...e,t.uid]:e,[]),[k]),L=(0,l.useMemo)(()=>N.reduce((e,t)=>"uid"===t.key?[...e,t.uid]:e,[]),[N]),D=(0,l.useCallback)(()=>{P.length>0&&e((0,f.deleteMetaPhrase)(P))},[e,P]),V=(0,l.useCallback)(()=>{L.length>0&&e((0,x.deleteMetaVocab)(L))},[e,L]),O=(0,l.useCallback)(()=>{C.length>0&&e((0,h.deleteMetaKanji)(C))},[e,C]),G=(0,s.jsxs)(s.Fragment,{children:[(P.length>0||L.length>0||C.length>0)&&(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsx)("h5",{children:"Stale Metadata UID"}),(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1"}),(0,s.jsx)("div",{className:"column-2",children:(0,s.jsxs)("div",{className:"setting-block",children:[P.length>0&&(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsxs)("span",{children:["Phrase: ",P.length]}),(0,s.jsx)("div",{className:"ps-4",onClick:D,children:(0,s.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]}),L.length>0&&(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsxs)("span",{children:["Vocabulary: ",L.length]}),(0,s.jsx)("div",{className:"ps-4",onClick:V,children:(0,s.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]}),C.length>0&&(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsxs)("span",{children:["Kanji: ",C.length]}),(0,s.jsx)("div",{className:"ps-4",onClick:O,children:(0,s.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]})]})})]})]}),(0,s.jsxs)("div",{className:"mb-2",children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h5",{children:"Stale Space Repetition"}),(0,v.collapseExpandToggler)(t,n)]}),(0,s.jsxs)("div",{children:[P.length>0&&(0,s.jsxs)("div",{onClick:D,children:["Stale Phrase Metadata: ",P.length]}),L.length>0&&(0,s.jsxs)("div",{onClick:V,children:["Stale Vocab Metadata: ",L.length]}),C.length>0&&(0,s.jsxs)("div",{onClick:O,children:["Stale Kanji Metadata: ",C.length]})]}),(0,s.jsx)("div",{className:"px-4",children:(0,s.jsx)("span",{children:"keys: "+JSON.stringify(Array.from(T))})}),t&&(0,s.jsx)(l.Suspense,{fallback:(0,s.jsx)(a.NotReady,{addlStyle:"failed-spacerep-view"}),children:(0,s.jsx)("div",{className:"failed-spacerep-view container mt-2 p-0",children:M})})]})]});return G}},3252:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return d}});var s=n("10327"),i=n("58093"),l=n("82511"),r=n.n(l),a=n("21331"),c=n.n(a);function o(e){let t={disabled:!!e.disabled||void 0};return(0,s.jsxs)("div",{className:"settings-switch-root",children:[(0,s.jsx)("p",{className:r({"disabled-color":t.disabled}),children:e.statusText}),(0,s.jsx)(i.Switch,{...t,checked:e.active,onChange:()=>e.action(),color:e.color||"primary",inputProps:{"aria-label":e.statusText+" checkbox"}})]})}n("83169"),n("58572"),o.propTypes={active:c.bool,action:c.func.isRequired,statusText:c.string.isRequired,color:c.string,disabled:c.bool};var d=o},97389:function(e,t,n){"use strict";n.r(t),n.d(t,{collapseExpandToggler:function(){return I},default:function(){return H},SettingsMeta:function(){return G}});var s=n("10327"),i=n("58093"),l=n("78615"),r=n("82511"),a=n.n(r),c=n("83169"),o=n("40432"),d=n("37654"),u=n("80130"),h=n("10776"),f=n("480"),x=n("22839"),v=n("87890"),g=n("68130"),p=n("80486"),j=n("9871"),m=n("16332"),b=n("34616"),y=n("38354"),S=n("72530"),N=n("40665"),w=n("84193"),k=n("93781"),E=n("42565"),R=n("3252");n("36230"),n("21191");let T=(0,c.lazy)(()=>n.el("92404").then(n.bind(n,"92404"))),M=(0,c.lazy)(()=>n.el("49840").then(n.bind(n,"49840"))),C=(0,c.lazy)(()=>n.el("78135").then(n.bind(n,"78135"))),P=(0,c.lazy)(()=>n.el("49557").then(n.bind(n,"49557"))),L=(0,c.lazy)(()=>n.el("35706").then(n.bind(n,"35706"))),D=(0,c.lazy)(()=>n.el("77507").then(n.bind(n,"77507"))),V=(0,c.lazy)(()=>n.el("74616").then(n.bind(n,"74616"))),O=(0,c.lazy)(()=>n.el("33424").then(n.bind(n,"33424"))),G={location:"/settings/",label:"Settings"};function A(e,t){let n=t.cause;switch(e((0,j.debugToggled)(N.DebugLevel.DEBUG)),n?.code){case"StaleVocabActiveGrp":{let s=n.value;e((0,j.logger)("Error: "+t.message,N.DebugLevel.ERROR)),e((0,j.logger)("Group "+JSON.stringify(s)+" Removed",N.DebugLevel.ERROR)),e((0,k.toggleVocabularyActiveGrp)(s))}break;case"StalePhraseActiveGrp":{let s=n.value;e((0,j.logger)("Error: "+t.message,N.DebugLevel.ERROR)),e((0,j.logger)("Group "+JSON.stringify(s)+" Removed",N.DebugLevel.ERROR)),e((0,S.togglePhraseActiveGrp)(s))}break;case"DeviceMotionEvent":e((0,j.logger)("Error: "+t.message,N.DebugLevel.ERROR)),e((0,j.setMotionThreshold)(0))}}function z(e,t,n){return function(s){try{(0,f.motionThresholdCondition)(s,t,e=>{n(Number(e.toFixed(2))),setTimeout(()=>{n(void 0)},300)})}catch(t){t instanceof Error&&A(e,t)}}}function I(e,t){let n=e?(0,s.jsx)(l.XCircleIcon,{className:"clickable",size:"medium","aria-label":"collapse"}):(0,s.jsx)(l.PlusCircleIcon,{className:"clickable",size:"medium","aria-label":"expand"});return(0,s.jsx)("h2",{onClick:()=>t(e=>!e),children:n})}let F=a({"mb-5":!0});function H(){let e=(0,o.useDispatch)(),t=(0,c.useRef)(void 0),{darkMode:n,swipeThreshold:r,motionThreshold:G,memory:H,debug:K}=(0,g.useConnectSetting)(),q=(0,o.useSelector)(({global:e})=>e.localServiceURL),[B,U]=(0,c.useState)(!1),[J,W]=(0,c.useState)(!1),[$,_]=(0,c.useState)(!1),[Y,Q]=(0,c.useState)(!1),[X,Z]=(0,c.useState)(!1),[ee,et]=(0,c.useState)(!1),[en,es]=(0,c.useState)(!1),[ei,el]=(0,c.useState)(!1),[er,ea]=(0,c.useState)(!1),[ec,eo]=(0,c.useState)(""),[ed,eu]=(0,c.useState)(""),[eh,ef]=(0,c.useState)(""),[ex,ev]=(0,c.useState)(!1),[eg,ep]=(0,c.useState)(0),[ej,em]=(0,c.useState)(!1),eb=(0,c.useRef)(q),{registerCB:ey}=(0,p.useSubscribe)(e,eb);(0,c.useEffect)(()=>(e((0,j.getMemoryStorageStatus)()),(0,x.swMessageSubscribe)(eS),(0,x.swMessageGetVersions)(),()=>{(0,x.swMessageUnsubscribe)(eS),t.current&&window.removeEventListener("devicemotion",t.current)}),[]),(0,c.useEffect)(()=>{G>0&&void 0===t.current?(t.current=z(e,G,ep),(0,f.getDeviceMotionEventPermission)(()=>{t.current&&window.addEventListener("devicemotion",t.current)},t=>A(e,t))):0===G&&void 0!==t.current?(window.removeEventListener("devicemotion",t.current),t.current=void 0):0===G&&void 0===t.current||(t.current&&window.removeEventListener("devicemotion",t.current),t.current=z(e,G,ep),(0,f.getDeviceMotionEventPermission)(()=>{t.current&&window.addEventListener("devicemotion",t.current)},t=>A(e,t)))},[e,G]);let eS=(0,v.useSWMessageVersionEventHandler)(e,U,ev,eo,eu,ef);return(0,s.jsx)("div",{className:"settings",children:(0,s.jsxs)("div",{className:"d-flex flex-column justify-content-between px-3",children:[(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Global"}),(0,s.jsx)("h2",{})]}),(0,s.jsx)("div",{children:(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsxs)("div",{className:"column-1 d-flex flex-column justify-content-end",children:[(0,s.jsxs)("div",{className:a({"w-25 d-flex flex-row justify-content-between":!0,invisible:0===r}),children:[(0,s.jsx)("div",{className:"clickable px-2 pb-2",onClick:()=>{r-1<=0?e((0,j.setSwipeThreshold)(0)):e((0,j.setSwipeThreshold)(r-1))},children:"-"}),(0,s.jsx)("div",{className:"px-2",children:r}),(0,s.jsx)("div",{className:"clickable px-2",onClick:()=>e((0,j.setSwipeThreshold)(r+1)),children:"+"})]}),(0,s.jsxs)("div",{className:a({"w-25 d-flex flex-row justify-content-between":!0,invisible:0===G}),children:[(0,s.jsx)("div",{className:"clickable px-2 pb-2",onClick:()=>{G-.5<=0?e((0,j.setMotionThreshold)(0)):e((0,j.setMotionThreshold)(G-.5))},children:"-"}),(0,s.jsx)("div",{className:a({"px-2":!0,"correct-color":eg&&eg>G&&eg<=G+1,"question-color":eg&&eg>G+1&&eg<=G+2,"incorrect-color":eg&&eg>G+2}),children:eg??G}),(0,s.jsx)("div",{className:"clickable px-2",onClick:()=>{e((0,j.setMotionThreshold)(G+.5))},children:"+"})]})]}),(0,s.jsxs)("div",{className:"column-2",children:[(0,s.jsx)("div",{className:"setting-block",children:(0,s.jsx)(R.default,{active:n,action:(0,h.buildAction)(e,j.toggleDarkMode),statusText:(n?"Dark":"Light")+" Mode"})}),(0,s.jsx)("div",{className:"setting-block",children:(0,s.jsx)(R.default,{active:r>0,action:()=>{r>0?e((0,j.setSwipeThreshold)(0)):e((0,j.setSwipeThreshold)(1))},statusText:"Touch Swipes"})}),(0,s.jsx)("div",{className:"setting-block",children:(0,s.jsx)(R.default,{active:G>0,action:()=>{0===G?e((0,j.setMotionThreshold)(6)):e((0,j.setMotionThreshold)(0))},statusText:"Accelerometer"})})]})]})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Phrases"}),I(Y,Q)]}),Y&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"phrases-settings",text:"Loading..."}),children:(0,s.jsx)(M,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Vocabulary"}),I($,_)]}),$&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"vocabulary-settings",text:"Loading..."}),children:(0,s.jsx)(C,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Kanji"}),I(J,W)]}),J&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"kanji-settings",text:"Loading..."}),children:(0,s.jsx)(T,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Opposites Game"}),I(X,Z)]}),X&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"opposites-settings",text:"Loading..."}),children:(0,s.jsx)(P,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Kana Game"}),I(ee,et)]}),ee&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"kana-settings",text:"Loading..."}),children:(0,s.jsx)(L,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Kanji Game"}),I(en,es)]}),en&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"kanji-game-settings",text:"Loading..."}),children:(0,s.jsx)(D,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Particles Game"}),I(ei,el)]}),ei&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"particle-settings",text:"Loading..."}),children:(0,s.jsx)(V,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,s.jsx)("h2",{children:"Study Stats"}),I(er,ea)]}),er&&(0,s.jsx)(c.Suspense,{fallback:(0,s.jsx)(E.NotReady,{addlStyle:"stats-settings",text:"Loading..."}),children:(0,s.jsx)(O,{})})]}),(0,s.jsxs)("div",{className:F,children:[(0,s.jsx)("div",{className:"d-flex justify-content-between",children:(0,s.jsx)("h2",{children:"Application"})}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1",children:(0,s.jsx)("div",{className:"setting-block mb-2 mt-2",children:(0,s.jsxs)("div",{className:"d-flex flex-row w-50 w-sm-100 justify-content-between clickable",onClick:()=>{eo(""),eu(""),ef(""),setTimeout(()=>{(0,x.swMessageGetVersions)()},1e3)},children:[(0,s.jsxs)("div",{className:"pe-2",children:[(0,s.jsx)("div",{children:"swVersion:"}),(0,s.jsx)("div",{children:"jsVersion:"}),(0,s.jsx)("div",{children:"bundleVersion:"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{children:ec}),(0,s.jsx)("div",{children:ed}),(0,s.jsx)("div",{children:eh})]})]})})}),(0,s.jsxs)("div",{className:"column-2",children:[(0,s.jsx)("div",{className:"setting-block mb-2",children:(0,s.jsx)(R.default,{active:K>N.DebugLevel.OFF,action:(0,h.buildAction)(e,j.debugToggled),color:"default",statusText:(0,f.labelOptions)(K,["Debug","Debug Error","Debug Warn","Debug"])})}),(0,s.jsxs)("div",{className:a({"d-flex justify-content-end mb-2":!0,"disabled-color":ex}),children:[(0,s.jsx)("p",{id:"hard-refresh",className:"text-right",children:"Hard Refresh"}),(0,s.jsx)("div",{className:a({"spin-a-bit":B}),style:{height:"24px"},"aria-labelledby":"hard-refresh",onClick:()=>{U(!0),ev(!1),setTimeout(()=>{B&&(U(!1),ev(!0))},3e3),(0,x.swMessageDoHardRefresh)()},children:(0,s.jsx)(l.SyncIcon,{className:"clickable",size:24,"aria-label":"Hard Refresh"})})]}),(0,s.jsx)("div",{className:"setting-block mb-2",children:(0,s.jsx)(R.default,{active:H.persistent,action:(0,h.buildAction)(e,j.setPersistentStorage),disabled:H.persistent,color:"default",statusText:H.persistent?`Persistent ${~~(H.usage/1024/1024)}
                        /
                        ${~~(H.quota/1024/1024)}
                        MB`:"Persistent off"})}),(0,s.jsxs)("div",{className:"setting-block mb-2",children:[(0,s.jsx)("div",{className:"d-flex flex-row p-2",children:(0,s.jsx)(i.TextField,{error:ej,size:"small",label:"Service Endpoint Override",variant:"outlined",defaultValue:q,onChange:e=>{eb.current=e.target.value},onBlur:t=>{let n=t.target.value,s=!0;(!n.toLowerCase().startsWith("https://")||!new RegExp(/:\d{1,5}$/).test(n)||n.length>35||n.length<13)&&(s=!1);let i={data:n+u.dataServicePath,media:n+u.audioServicePath};""===n&&(s=!0,i.data=u.dataServiceEndpoint,i.media=u.pronounceEndoint),s&&((0,x.swMessageSetLocalServiceEndpoint)(i).then(()=>{e((0,w.clearVersions)()),e((0,w.getVersions)())}),e((0,k.clearVocabulary)()),e((0,S.clearPhrases)()),e((0,m.clearKanji)()),e((0,y.clearParticleGame)()),e((0,b.clearOpposites)()),e((0,j.setLocalServiceURL)(n))),em(!s)}})}),(0,s.jsxs)("div",{className:"d-flex flex-row p-2",children:[(0,s.jsx)("div",{className:"px-1",children:(0,s.jsx)(i.Button,{variant:"outlined",size:"small",disabled:ej,children:"Update"})}),(0,s.jsx)("div",{className:"px-1",children:(0,s.jsx)(i.Button,{variant:"outlined",onClick:ey,size:"small",disabled:ej,children:"Subscribe"})}),(0,s.jsx)("div",{className:"px-1",children:(0,s.jsx)(i.Button,{variant:"contained",size:"small",disabled:ej,children:(0,s.jsxs)(d.Link,{to:"/sheet",className:"text-decoration-none",children:["Sheets ",(0,s.jsx)(l.UndoIcon,{})]})})})]})]})]})]})]})]})})}},480:function(e,t,n){"use strict";n.r(t),n.d(t,{play:function(){return u},getTermUID:function(){return h},getTerm:function(){return f},termFilterByType:function(){return x},getStaleGroups:function(){return g},getStaleSpaceRepKeys:function(){return p},minimumTimeForSpaceRepUpdate:function(){return j},minimumTimeForTimedPlay:function(){return m},labelOptions:function(){return b},toggleOptions:function(){return y},japaneseLabel:function(){return S},englishLabel:function(){return N},labelPlacementHelper:function(){return w},getEnglishHint:function(){return k},getJapaneseHint:function(){return E},getCacheUID:function(){return R},toggleFuriganaSettingHelper:function(){return T},pause:function(){return M},loopN:function(){return function e(t,n,s,{signal:i}){let l=new Promise((l,r)=>{let a=()=>{clearTimeout(c);let e=Error("User interrupted loop.",{cause:{code:"UserAborted"}});r(e)},c=setTimeout(()=>{t>0?n().then(()=>e(t-1,n,s,{signal:i}).then(()=>{i?.removeEventListener("abort",a),l()})).catch(e=>{r(e)}):(i?.removeEventListener("abort",a),l())},s);i?.aborted&&a(),i?.addEventListener("abort",a)});return l}},motionThresholdCondition:function(){return C},getDeviceMotionEventPermission:function(){return P}});var s=n("10327"),i=n("82511"),l=n.n(i);n("83169");var r=n("80325"),a=n("85299"),c=n("34989"),o=n("15541"),d=n("40665");function u(e,t,n,s,i,l,a,c){if(t!==d.TermFilterBy.FREQUENCY&&e&&Math.random()<1/3&&n.length>0){let e=n.filter(e=>{let t=i[e]?.lastView;return t&&(0,r.minsSince)(t)>n.length}),t=e.length,c=Math.floor(Math.random()*(t-0)+0),o=s.find(t=>e[c]===t.uid);if(o&&l!==o.uid){a(o.uid);return}}c()}function h(e,t,n){let s;if(n){let i=n[e];s=t[i]}else s=t[e];if(!s)throw Error("No term found");return s.uid}function f(e,t,n){let s=t.find(t=>e===t.uid);if(!s&&n&&(s=n.find(t=>e===t.uid)),!s)throw Error("No term found");return s}function x(e,t,n=[],s,i){let l=t;if(e===d.TermFilterBy.FREQUENCY){if(!n)throw TypeError("Filter type requires frequencyList");n.length>0?l=s.length>0?t.filter(e=>n.includes(e.uid)&&v(s,e)):t.filter(e=>n.includes(e.uid)):"function"==typeof i&&i(d.TermFilterBy.GROUP)}else e===d.TermFilterBy.TAGS?s.length>0&&(l=t.filter(e=>e.tags.some(e=>s.includes(e)))):s.length>0&&(l=t.filter(e=>v(s,e)));return l}function v(e,t){return void 0!==t.grp&&(e.includes(t.grp)||void 0!==t.subGrp&&e.includes(`${t.grp}.${t.subGrp}`))||void 0===t.grp&&(e.includes("undefined")||void 0!==t.subGrp&&e.includes(`undefined.${t.subGrp}`))}function g(e,t){let n=Object.keys(e).reduce((t,n)=>t=[...t,n,...e[n].map(e=>n+"."+e)],[]),s=t.reduce((e,t)=>(!n.includes(t)&&(e=[...e,t]),e),[]);return s}function p(e,t,n){if(0===t.length||0===Object.keys(e).length)return{keys:new Set,list:[]};let s=new Set(["lastView","vC","f","rein","pron","tpPc","tpAcc","tpCAvg","lastReview","consecutiveRight","difficultyP","accuracyP","daysBetweenReviews"]),i=new Set,l=[];return Object.keys(e).forEach(r=>{let a;let c=e[r];try{a=f(r,t),void 0!==c&&Object.keys(c).forEach(e=>{let t;!s.has(e)&&(t={key:e,uid:r,english:a.english}),void 0!==t&&(i.add(e),l=[...l,t])})}catch(t){let e={key:"uid",uid:r,english:(a={english:n}).english};l=[...l,e]}}),{keys:i,list:l}}function j(e){return~~(Date.now()-e)>1500}function m(e){return~~(Date.now()-e)>300}function b(e,t){return t[e]}function y(e,t){let n=t.length;return e+1<n?e+1:0}function S(e,t,n,i,r){let c,o;let d=!e,u=[],h=!1,f=!1;t.constructor.name===a.JapaneseVerb.name&&"isExceptionVerb"in t&&(h=t.isExceptionVerb()||3===t.getVerbClass(),f=t.isIntransitive(),c=t.getTransitivePair()??t.getIntransitivePair());let x=t.isNaAdj(),v=t.isSlang(),g=t.isKeigo(),p=r?.inverse;if(d&&(f||c)){let e;if(void 0!==c&&"function"==typeof i){let t=c;e=()=>{i(t)}}u=[...u,(0,s.jsx)("span",{className:l({clickable:c,"question-color":c}),onClick:e,children:f?"intr":"trans"},u.length+1)]}if(d&&v&&(u=[...u,(0,s.jsx)("span",{children:"slang"},u.length+1)]),d&&g&&(u=[...u,(0,s.jsx)("span",{children:"keigo"},u.length+1)]),h&&u.length>0&&(u=[(0,s.jsx)("span",{children:"*"},u.length+1),...u]),d&&void 0!==p){let e;"function"==typeof i&&(e=()=>{i(p)}),u=[...u,(0,s.jsx)("span",{className:l({clickable:p,"question-color":p}),onClick:e,children:"inv"},u.length+1)]}return o=u.length>0?(0,s.jsxs)("span",{children:[n,x&&(0,s.jsxs)("span",{className:"opacity-25",children:[" ","な"]}),(0,s.jsxs)("span",{className:"fs-5",children:[(0,s.jsx)("span",{children:" ("}),u.reduce((e,t,n)=>{if(!(n>0)||!(n<u.length))return[...e,t];{let i=(0,s.jsx)("span",{children:", "},u.length+n);return[...e,i,t]}},[]),(0,s.jsx)("span",{children:")"})]})]}):h?(0,s.jsxs)("span",{children:[n,(0,s.jsxs)("span",{children:[" ","*"]})]}):x?(0,s.jsxs)("span",{children:[n,(0,s.jsxs)("span",{className:"opacity-25",children:[" ","な"]})]}):n}function N(e,t,n,i,r){let c,o;let d=[],u=!1;t.constructor.name===a.JapaneseVerb.name&&"isExceptionVerb"in t&&(u=t.isIntransitive(),c=t.getTransitivePair()??t.getIntransitivePair());let h=t.isSlang(),f=t.isKeigo();if(e&&(u||c)){let e;if(void 0!==c&&"function"==typeof i){let t=c;e=()=>{i(t)}}d=[...d,(0,s.jsx)("span",{className:l({clickable:c,"question-color":c}),onClick:e,children:u?"intr":"trans"},d.length+1)]}e&&h&&(d=[...d,(0,s.jsx)("span",{children:"slang"},d.length+1)]),e&&f&&(d=[...d,(0,s.jsx)("span",{children:"keigo"},d.length+1)]);let x=r?.inverse,v=r?.polite;if(e&&void 0!==x){let e;"function"==typeof i&&(e=()=>{i(x)}),d=[...d,(0,s.jsx)("span",{className:l({clickable:x,"question-color":x}),onClick:e,children:"inv"},d.length+1)]}return e&&v&&(d=[...d,(0,s.jsx)("span",{children:"polite"},d.length+1)]),o=d.length>0?(0,s.jsxs)("span",{children:[n,(0,s.jsxs)("span",{className:"fs-5",children:[(0,s.jsx)("span",{children:" ("}),d.reduce((e,t,n)=>{if(!(n>0)||!(n<d.length))return[...e,t];{let i=(0,s.jsx)("span",{children:", "},d.length+n);return[...e,i,t]}},[]),(0,s.jsx)("span",{children:")"})]})]}):n}function w(e,t,n,s,i){let l,r,a,c;return e?(l=t,r=n,a=s,c=i):(l=n,r=t,a=i,c=s),{topValue:l,topLabel:a,bottomValue:r,bottomLabel:c}}function k(e){return e.grp&&""!==e.grp?(0,s.jsx)("span",{className:"hint",children:e.grp+(e.subGrp?", "+e.subGrp:"")}):void 0}function E(e){let t;let n=e.getPronunciation().slice(1,2);return t=(0,c.isYoon)(n)?e.getHint(c.kanaHintBuilder,o.furiganaHintBuilder,3,2):e.getHint(c.kanaHintBuilder,o.furiganaHintBuilder,3,1)}function R(e){let{uid:t}=e;if(!t)throw console.warn(JSON.stringify(e)),Error("Missing uid");return e.form&&(t+="dictionary"!==e.form?e.form.replace("-","."):""),t}function T(e,t,n,s){let i=t?.[e]?.f!==!1;return{furigana:{show:i,toggle:!1===n&&"function"==typeof s?s:void 0}}}function M(e,{signal:t},n){return new Promise((s,i)=>{let l=()=>{clearTimeout(a),clearInterval(r),i(Error("Aborted"))},r="function"==typeof n?setInterval(n,200,200,e):-1,a=setTimeout(()=>{t?.removeEventListener("abort",l),clearInterval(r),s()},e);t?.aborted&&l(),t?.addEventListener("abort",l)})}function C(e,t,n){let s=e.acceleration?.y,i=e.acceleration?.z;if(null==s||null==i)throw Error("Device does not support DeviceMotionEvent",{cause:{code:"DeviceMotionEvent"}});{let e=Math.sqrt(s*s+i*i);e>t&&"function"==typeof n&&n(e)}}function P(e,t){window.DeviceMotionEvent&&"function"==typeof window.DeviceMotionEvent.requestPermission?DeviceMotionEvent.requestPermission().then(t=>{"granted"===t&&e()}).catch(t):e()}},10776:function(e,t,n){"use strict";function s(e,t){return function(){if(t||"function"==typeof t){e(t);return}}}function i(e,t,n){return function(s){if(n){e(t(n));return}if(s instanceof Object&&"_reactName"in s){e(t());return}if(void 0!==s){e(t(s));return}e(t())}}n.r(t),n.d(t,{setStateFunction:function(){return s},buildAction:function(){return i}})},87890:function(e,t,n){"use strict";n.r(t),n.d(t,{useSWMessageVersionEventHandler:function(){return a}});var s=n("83169"),i=n("22839"),l=n("9871"),r=n("40665");function a(e,t,n,a,c,o){let d=(0,s.useCallback)(s=>{let{type:d,error:u}=s.data;if(d===i.SWMsgOutgoing.DO_HARD_REFRESH)u&&e((0,l.logger)(u,r.DebugLevel.ERROR)),setTimeout(()=>{t(!1),n(!0)},2e3);else if(d===i.SWMsgOutgoing.SW_VERSION){let{swVersion:e,jsVersion:t,bundleVersion:n}=s.data;a(e),c(t),o(n)}},[e,t,n,a,c,o]);return d}},68130:function(e,t,n){"use strict";n.r(t),n.d(t,{useConnectSetting:function(){return i}});var s=n("40432");function i(){let[e,t,n,i]=(0,s.useSelector)(({global:e})=>{let{darkMode:t,swipeThreshold:n,motionThreshold:s,debug:i}=e;return[t,n,s,i]},s.shallowEqual),l=(0,s.useSelector)(({global:e})=>{let{memory:t}=e;return t},(e,t)=>e.usage===t.usage),[r,a,c]=(0,s.useSelector)(({opposite:e})=>{let{qRomaji:t,aRomaji:n,fadeInAnswers:s}=e;return[t,n,s]},s.shallowEqual),[o,d]=(0,s.useSelector)(({particle:e})=>{let{aRomaji:t,fadeInAnswers:n}=e.setting;return[t,n]},s.shallowEqual);return{darkMode:e,swipeThreshold:t,motionThreshold:n,memory:l,debug:i,oppositesQRomaji:r,oppositesARomaji:a,oppositeFadeInAnswers:c,particlesARomaji:o,particleFadeInAnswer:d}}},80486:function(e,t,n){"use strict";n.r(t),n.d(t,{useSubscribe:function(){return a}});var s=n("83169"),i=n("80130"),l=n("9871"),r=n("40665");function a(e,t){let n=(0,s.useCallback)(()=>{let n=t.current;navigator.serviceWorker.ready.then(t=>{t.pushManager.getSubscription().then(async e=>{if(e)return e;let s=await fetch(n+i.pushServicePubKeyPath),l=await s.text(),r=function(e){for(var t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),s=window.atob(n),i=new Uint8Array(s.length),l=0;l<s.length;++l)i[l]=s.charCodeAt(l);return i}(l);return t.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:r})}).then(e=>{fetch(n+i.pushServiceRegisterClientPath,{method:"post",headers:{"Content-type":"application/json"},body:JSON.stringify({subscription:e})})}).catch(t=>{e((0,l.logger)("Push API: "+t.message,r.DebugLevel.ERROR))})})},[e,t]);return{registerCB:n}}},84193:function(e,t,n){"use strict";n.r(t),n.d(t,{getVersions:function(){return l},clearVersions:function(){return a},setVersion:function(){return c},default:function(){return o}});var s=n("71387"),i=n("80130");let l=(0,s.createAsyncThunk)("version/getVersions",async()=>fetch(i.dataServiceEndpoint+"/cache.json").then(e=>e.json())),r=(0,s.createSlice)({name:"version",initialState:{vocabulary:void 0,phrases:void 0,kanji:void 0,opposites:void 0,particles:void 0,suffixes:void 0},reducers:{clearVersions(e){e.vocabulary=void 0,e.phrases=void 0,e.kanji=void 0,e.opposites=void 0,e.particles=void 0,e.suffixes=void 0},setVersion(e,t){let{name:n,hash:s}=t.payload;e[n]=s}},extraReducers:e=>{e.addCase(l.fulfilled,(e,t)=>{let{vocabulary:n,kanji:s,phrases:i,opposites:l,particles:r,suffixes:a}=t.payload;e.kanji=s,e.vocabulary=n,e.phrases=i,e.opposites=l,e.particles=r,e.suffixes=a})}}),{clearVersions:a,setVersion:c}=r.actions;var o=r.reducer}}]);