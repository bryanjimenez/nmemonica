(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["232"],{36230:function(e,s,n){},58572:function(e,s,n){},21191:function(e,s,n){},52355:function(e,s,n){"use strict";n.r(s),n.d(s,{CookieOptions:function(){return f},default:function(){return j}});var t=n("10327"),i=n("58093"),a=n("49620"),r=n.n(a),l=n("83169"),o=n("40432"),c=n("37654"),d=n("3252"),u=n("5441"),h=n("10776"),m=n("68130"),p=n("9871"),x=n("68844");function f(){let e=(0,o.useDispatch)(),{cookies:s}=(0,m.useConnectSetting)(),[n,a]=(0,l.useState)(!1);return(0,t.jsx)(i.FormControl,{children:(0,t.jsxs)(i.RadioGroup,{"aria-labelledby":"Cookie consent response",children:[(0,t.jsx)(i.FormControlLabel,{className:"m-0",value:"Accept Cookies",control:(0,t.jsx)(i.Radio,{checked:s,onChange:()=>{e((0,p.toggleCookies)(!0)),(0,u.setCookie)(u.cookieAcceptance,new Date().toJSON())}}),label:(0,t.jsxs)("span",{children:[(0,t.jsx)("span",{children:"Accept"}),(0,t.jsx)("span",{className:r({invisible:!s}),children:"ed"})]})}),(0,t.jsx)(i.FormControlLabel,{className:"m-0",value:"Reject Cookies",control:(0,t.jsx)(i.Radio,{checked:!s&&n,onChange:()=>{e((0,p.toggleCookies)(!1)),(0,u.deleteCookie)(u.cookieAcceptance),a(!0)}}),label:(0,t.jsxs)("span",{children:[(0,t.jsx)("span",{children:"Reject"}),(0,t.jsx)("span",{className:r({invisible:s||!n}),children:"ed"})]})})]})})}function j(){let e=(0,o.useDispatch)(),{cookies:s,memory:n}=(0,m.useConnectSetting)();return(0,l.useEffect)(()=>{e((0,p.getMemoryStorageStatus)())},[e]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"mt-3 mb-1",children:"Cookies"}),(0,t.jsx)("div",{className:"text-end",children:(0,t.jsxs)("p",{children:["Read our ",(0,t.jsx)(c.Link,{to:x.CookiePolicyMeta.location,children:"Cookie Policy"}),"."]})}),(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsx)("div",{className:"column-1 mb-2 me-sm-2",children:(0,t.jsxs)("div",{className:"ps-2 mt-2 mb-2",children:[(0,t.jsx)("p",{children:(0,t.jsx)("span",{children:"We use cookies."})}),(0,t.jsx)("p",{className:r({invisible:s}),children:"But you've opted out."}),(0,t.jsx)("p",{className:r({invisible:s,"disabled-color":!s}),children:(0,t.jsx)("strong",{children:"Only basic functionality enabled."})})]})}),(0,t.jsx)("div",{className:"column-2",children:(0,t.jsx)("div",{className:"ps-2 d-flex flex-column align-items-end",children:(0,t.jsx)(f,{})})})]})]}),(0,t.jsxs)("div",{className:r({"disabled-color":!s}),children:[(0,t.jsx)("h3",{className:"mt-3 mb-1",children:"Persistent Storage"}),(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsx)("div",{className:"column-1 mb-2 me-sm-2",children:(0,t.jsx)("div",{className:"ps-2 mt-2 mb-2",children:(0,t.jsx)("p",{className:"mw-75",children:(0,t.jsxs)("span",{children:["For native-app-like experience, enable"," ",(0,t.jsx)("strong",{children:"Persistent Storage"}),". It lets the browser know you'd like to prioritize the storage of this app's data. Data storage lifetime depends on your browser's implementation. See Persistent Storage under our"," ",(0,t.jsx)(c.Link,{to:x.CookiePolicyMeta.location,children:"Cookie Policy"})," for more details."]})})})}),(0,t.jsxs)("div",{className:"column-2",children:[(0,t.jsx)("div",{className:"pt-4 text-end",children:(0,t.jsx)("p",{children:n.persistent?(0,t.jsx)(t.Fragment,{children:"Enabled"}):(0,t.jsx)("strong",{children:"Disabled"})})}),(0,t.jsx)("div",{className:"ps-2 d-flex flex-column align-items-end",children:(0,t.jsx)(d.default,{active:n.persistent,action:(0,h.buildAction)(e,p.setPersistentStorage),disabled:!s||n.persistent,color:"default",statusText:""})}),(0,t.jsx)("div",{className:"pt-3",children:(0,t.jsx)("p",{className:"text-nowrap text-end",children:n.persistent&&(0,t.jsx)(t.Fragment,{children:`${~~(n.usage/1024/1024)}
                        /
                        ${~~(n.quota/1024/1024)}
                        MB`})})}),(0,t.jsx)("div",{})]})]})]})]})}},39679:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return f}});var t=n("10327"),i=n("78615"),a=n("83169"),r=n("40432"),l=n("42565"),o=n("480"),c=n("58800"),d=n("93197"),u=n("80161"),h=n("16332"),m=n("72530"),p=n("93781"),x=n("97389");function f(){let e=(0,r.useDispatch)(),[s,n]=(0,a.useState)(!1),{vocabList:f,repetition:j}=(0,u.useConnectVocabulary)(),{phraseList:g,repetition:v}=(0,d.useConnectPhrase)(),{kanjiList:b,repetition:y}=(0,c.useConnectKanji)(),{keys:N,list:w}=(0,a.useMemo)(()=>(0,o.getStaleSpaceRepKeys)(j,f,"[Stale Vocabulary]"),[f,j]),{keys:k,list:S}=(0,a.useMemo)(()=>(0,o.getStaleSpaceRepKeys)(v,g,"[Stale Phrase]"),[g,v]),{keys:C,list:P}=(0,a.useMemo)(()=>(0,o.getStaleSpaceRepKeys)(y,b,"[Stale Kanji]"),[b,y]),T=(0,a.useMemo)(()=>new Set([...N,...k,...C]),[N,k,C]),E=(0,a.useMemo)(()=>(function(e){return e.reduce((s,n,i)=>{let a=(0,t.jsx)("hr",{},`stale-meta-${n.uid}`),r=(0,t.jsxs)("div",{className:"row",children:[(0,t.jsx)("span",{className:"col p-0",children:n.key}),(0,t.jsx)("span",{className:"col p-0",children:n.english}),(0,t.jsx)("span",{className:"col p-0 app-sm-fs-xx-small",children:(0,t.jsx)("div",{children:n.uid})})]},n.uid);return s.length>0&&i<e.length?[...s,a,r]:[...s,r]},[])})([...w,...S,...P]),[w,S,P]),M=(0,a.useMemo)(()=>P.reduce((e,s)=>"uid"===s.key?[...e,s.uid]:e,[]),[P]),R=(0,a.useMemo)(()=>S.reduce((e,s)=>"uid"===s.key?[...e,s.uid]:e,[]),[S]),L=(0,a.useMemo)(()=>w.reduce((e,s)=>"uid"===s.key?[...e,s.uid]:e,[]),[w]),D=(0,a.useCallback)(()=>{R.length>0&&e((0,m.deleteMetaPhrase)(R))},[e,R]),A=(0,a.useCallback)(()=>{L.length>0&&e((0,p.deleteMetaVocab)(L))},[e,L]),G=(0,a.useCallback)(()=>{M.length>0&&e((0,h.deleteMetaKanji)(M))},[e,M]),I=(0,t.jsxs)(t.Fragment,{children:[(R.length>0||L.length>0||M.length>0)&&(0,t.jsxs)("div",{className:"mb-4",children:[(0,t.jsx)("h5",{children:"Stale Metadata UID"}),(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsx)("div",{className:"column-1"}),(0,t.jsx)("div",{className:"column-2",children:(0,t.jsxs)("div",{className:"setting-block",children:[R.length>0&&(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsxs)("span",{children:["Phrase: ",R.length]}),(0,t.jsx)("div",{className:"ps-4",onClick:D,children:(0,t.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]}),L.length>0&&(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsxs)("span",{children:["Vocabulary: ",L.length]}),(0,t.jsx)("div",{className:"ps-4",onClick:A,children:(0,t.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]}),M.length>0&&(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsxs)("span",{children:["Kanji: ",M.length]}),(0,t.jsx)("div",{className:"ps-4",onClick:G,children:(0,t.jsx)(i.TrashIcon,{className:"clickable",size:"small","aria-label":"delete"})})]})]})})]})]}),(0,t.jsxs)("div",{className:"mb-2",children:[(0,t.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,t.jsx)("h5",{children:"Stale Space Repetition"}),(0,x.collapseExpandToggler)(s,n)]}),(0,t.jsxs)("div",{children:[R.length>0&&(0,t.jsxs)("div",{onClick:D,children:["Stale Phrase Metadata: ",R.length]}),L.length>0&&(0,t.jsxs)("div",{onClick:A,children:["Stale Vocab Metadata: ",L.length]}),M.length>0&&(0,t.jsxs)("div",{onClick:G,children:["Stale Kanji Metadata: ",M.length]})]}),(0,t.jsx)("div",{className:"px-4",children:(0,t.jsx)("span",{children:"keys: "+JSON.stringify(Array.from(T))})}),s&&(0,t.jsx)(a.Suspense,{fallback:(0,t.jsx)(l.NotReady,{addlStyle:"failed-spacerep-view"}),children:(0,t.jsx)("div",{className:"failed-spacerep-view container mt-2 p-0",children:E})})]})]});return I}},3252:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return d}});var t=n("10327"),i=n("58093"),a=n("49620"),r=n.n(a),l=n("21331"),o=n.n(l);function c(e){let s={disabled:!!e.disabled||void 0};return(0,t.jsxs)("div",{className:"settings-switch-root",children:[(0,t.jsx)("p",{className:r({"disabled-color":s.disabled}),children:e.statusText}),(0,t.jsx)(i.Switch,{...s,checked:e.active,onChange:()=>e.action(),color:e.color||"primary",inputProps:{"aria-label":e.statusText+" checkbox"}})]})}n("83169"),n("58572"),c.propTypes={active:o.bool,action:o.func.isRequired,statusText:o.string.isRequired,color:o.string,disabled:o.bool};var d=c},97389:function(e,s,n){"use strict";n.r(s),n.d(s,{collapseExpandToggler:function(){return I},default:function(){return z},SettingsMeta:function(){return D}});var t=n("10327"),i=n("78615"),a=n("49620"),r=n.n(a),l=n("83169"),o=n("40432"),c=n("37654"),d=n("5441"),u=n("10776"),h=n("480"),m=n("22839"),p=n("68130"),x=n("75621"),f=n("9871"),j=n("72530"),g=n("40665"),v=n("93781"),b=n("42565"),y=n("52355"),N=n("3252");n("36230"),n("21191");var w=n("28303"),k=n("91646");let S=(0,l.lazy)(()=>n.el("92404").then(n.bind(n,"92404"))),C=(0,l.lazy)(()=>n.el("49840").then(n.bind(n,"49840"))),P=(0,l.lazy)(()=>n.el("78135").then(n.bind(n,"78135"))),T=(0,l.lazy)(()=>n.el("49557").then(n.bind(n,"49557"))),E=(0,l.lazy)(()=>n.el("35706").then(n.bind(n,"35706"))),M=(0,l.lazy)(()=>n.el("77507").then(n.bind(n,"77507"))),R=(0,l.lazy)(()=>n.el("74616").then(n.bind(n,"74616"))),L=(0,l.lazy)(()=>n.el("33424").then(n.bind(n,"33424"))),D={location:"/settings/",label:"Settings"};function A(e,s){let n=s.cause;switch(e((0,f.debugToggled)(g.DebugLevel.DEBUG)),n?.code){case"StaleVocabActiveGrp":{let t=n.value;e((0,f.logger)("Error: "+s.message,g.DebugLevel.ERROR)),e((0,f.logger)("Group "+JSON.stringify(t)+" Removed",g.DebugLevel.ERROR)),e((0,v.toggleVocabularyActiveGrp)(t))}break;case"StalePhraseActiveGrp":{let t=n.value;e((0,f.logger)("Error: "+s.message,g.DebugLevel.ERROR)),e((0,f.logger)("Group "+JSON.stringify(t)+" Removed",g.DebugLevel.ERROR)),e((0,j.togglePhraseActiveGrp)(t))}break;case"DeviceMotionEvent":e((0,f.logger)("Error: "+s.message,g.DebugLevel.ERROR)),e((0,f.setMotionThreshold)(0))}}function G(e,s,n){return function(t){try{(0,h.motionThresholdCondition)(t,s,e=>{n(Number(e.toFixed(2))),setTimeout(()=>{n(void 0)},300)})}catch(s){s instanceof Error&&A(e,s)}}}function I(e,s,n){let a=e?(0,t.jsx)(i.XCircleIcon,{className:"clickable",size:"medium","aria-label":"collapse"}):(0,t.jsx)(i.PlusCircleIcon,{className:"clickable",size:"medium","aria-label":"expand"});return(0,t.jsx)("h2",{onClick:!0===n?()=>s(e=>!e):void 0,children:a})}let _=r({"mb-5":!0});function z(){let e=(0,o.useDispatch)(),s=(0,l.useRef)(void 0),{cookies:n,darkMode:a,swipeThreshold:j,motionThreshold:g}=(0,p.useConnectSetting)(),[v,D]=(0,l.useState)(!1),[z,F]=(0,l.useState)(!1),[O,q]=(0,l.useState)(!1),[V,U]=(0,l.useState)(!1),[B,H]=(0,l.useState)(!1),[K,W]=(0,l.useState)(!1),[Y,J]=(0,l.useState)(!1),[$,Q]=(0,l.useState)(!1),[X,Z]=(0,l.useState)(!1),[ee,es]=(0,l.useState)(""),[en,et]=(0,l.useState)(""),[ei,ea]=(0,l.useState)(""),[er,el]=(0,l.useState)(0);(0,l.useEffect)(()=>((0,m.swMessageSubscribe)(eo),(0,m.swMessageGetVersions)(),()=>{(0,m.swMessageUnsubscribe)(eo),s.current&&window.removeEventListener("devicemotion",s.current)}),[]),(0,l.useEffect)(()=>{g>0&&void 0===s.current?(s.current=G(e,g,el),(0,h.getDeviceMotionEventPermission)(()=>{s.current&&window.addEventListener("devicemotion",s.current)},s=>A(e,s))):0===g&&void 0!==s.current?(window.removeEventListener("devicemotion",s.current),s.current=void 0):0===g&&void 0===s.current||(s.current&&window.removeEventListener("devicemotion",s.current),s.current=G(e,g,el),(0,h.getDeviceMotionEventPermission)(()=>{s.current&&window.addEventListener("devicemotion",s.current)},s=>A(e,s)))},[e,g]);let eo=(0,x.useSWMessageVersionEventHandler)(es,et,ea),ec=""!==ee?"."+ee.slice(-3)+en.slice(-3)+ei.slice(-3):"",ed=r({"d-flex justify-content-between":!0,"disabled-color":!n}),eu=!(0,l.useMemo)(d.allowedCookies,[]),eh=(0,t.jsxs)("div",{className:r({"mb-5":!eu,"mb-2":eu}),children:[(0,t.jsxs)("div",{className:"d-flex justify-content-between",children:[(0,t.jsxs)("h2",{children:[(0,t.jsx)(i.InfoIcon,{size:20,className:"pb-2"}),"Guidelines"]}),!eu&&I(v,D,!0)]}),(eu||v)&&(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"mt-3 mb-1",children:"Terms and Conditions"}),(0,t.jsx)("div",{className:"text-end",children:(0,t.jsxs)("p",{children:["Read our"," ",(0,t.jsx)(c.Link,{to:k.TermsAndConditionsMeta.location,children:"Terms and Conditions"}),"."]})})]}),(eu||v)&&(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"mt-3 mb-1",children:"Privacy Policy"}),(0,t.jsx)("div",{className:"text-end",children:(0,t.jsxs)("p",{children:["Read our"," ",(0,t.jsx)(c.Link,{to:w.PrivacyPolicyMeta.location,children:"Privacy Policy"}),"."]})})]}),(eu||v)&&(0,t.jsx)(y.default,{})]});return(0,t.jsx)("div",{className:"settings",children:(0,t.jsxs)("div",{className:"d-flex flex-column justify-content-between px-3",children:[eu&&eh,(0,t.jsxs)("div",{className:_,children:[(0,t.jsx)("div",{className:r({"pt-5":!0,"d-flex justify-content-between":!0,"disabled-color":!n})}),(0,t.jsx)("div",{children:(0,t.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,t.jsxs)("div",{className:"column-1 d-flex flex-column justify-content-end",children:[(0,t.jsxs)("div",{className:r({"w-25 d-flex flex-row justify-content-between":!0,invisible:0===j}),children:[(0,t.jsx)("div",{className:"clickable px-2 pb-2",onClick:()=>{j-1<=0?e((0,f.setSwipeThreshold)(0)):e((0,f.setSwipeThreshold)(j-1))},children:"-"}),(0,t.jsx)("div",{className:"px-2",children:j}),(0,t.jsx)("div",{className:"clickable px-2",onClick:()=>e((0,f.setSwipeThreshold)(j+1)),children:"+"})]}),(0,t.jsxs)("div",{className:r({"w-25 d-flex flex-row justify-content-between":!0,invisible:0===g}),children:[(0,t.jsx)("div",{className:"clickable px-2 pb-2",onClick:()=>{g-.5<=0?e((0,f.setMotionThreshold)(0)):e((0,f.setMotionThreshold)(g-.5))},children:"-"}),(0,t.jsx)("div",{className:r({"px-2":!0,"correct-color":er&&er>g&&er<=g+1,"question-color":er&&er>g+1&&er<=g+2,"incorrect-color":er&&er>g+2}),children:er??g}),(0,t.jsx)("div",{className:"clickable px-2",onClick:()=>{e((0,f.setMotionThreshold)(g+.5))},children:"+"})]})]}),(0,t.jsxs)("div",{className:"column-2",children:[(0,t.jsx)("div",{className:"setting-block",children:(0,t.jsx)(N.default,{disabled:!n,active:a,action:(0,u.buildAction)(e,f.toggleDarkMode),statusText:(a?"Dark":"Light")+" Mode"})}),(0,t.jsx)("div",{className:"setting-block",children:(0,t.jsx)(N.default,{disabled:!n,active:j>0,action:()=>{j>0?e((0,f.setSwipeThreshold)(0)):e((0,f.setSwipeThreshold)(1))},statusText:"Touch Swipes"})}),(0,t.jsx)("div",{className:"setting-block",children:(0,t.jsx)(N.default,{disabled:!n,active:g>0,action:()=>{0===g?e((0,f.setMotionThreshold)(6)):e((0,f.setMotionThreshold)(0))},statusText:"Accelerometer"})})]})]})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Phrases"}),I(V,U,n)]}),V&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"phrases-settings",text:"Loading..."}),children:(0,t.jsx)(C,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Vocabulary"}),I(O,q,n)]}),O&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"vocabulary-settings",text:"Loading..."}),children:(0,t.jsx)(P,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Kanji"}),I(z,F,n)]}),n&&z&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"kanji-settings",text:"Loading..."}),children:(0,t.jsx)(S,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Opposites Game"}),I(B,H,n)]}),n&&B&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"opposites-settings",text:"Loading..."}),children:(0,t.jsx)(T,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Kana Game"}),I(K,W,n)]}),n&&K&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"kana-settings",text:"Loading..."}),children:(0,t.jsx)(E,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Kanji Game"}),I(Y,J,n)]}),n&&Y&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"kanji-game-settings",text:"Loading..."}),children:(0,t.jsx)(M,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Particles Game"}),I($,Q,n)]}),n&&$&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"particle-settings",text:"Loading..."}),children:(0,t.jsx)(R,{})})]}),(0,t.jsxs)("div",{className:_,children:[(0,t.jsxs)("div",{className:ed,children:[(0,t.jsx)("h2",{children:"Study Stats"}),I(X,Z,n)]}),n&&X&&(0,t.jsx)(l.Suspense,{fallback:(0,t.jsx)(b.NotReady,{addlStyle:"stats-settings",text:"Loading..."}),children:(0,t.jsx)(L,{})})]}),!eu&&eh,(0,t.jsxs)("div",{className:_,children:[(0,t.jsx)("div",{className:ed,children:(0,t.jsx)("h2",{children:"About Nmemonica"})}),(0,t.jsx)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:(0,t.jsx)("div",{className:"column-1",children:(0,t.jsx)("div",{className:"setting-block mb-2 mt-2",children:(0,t.jsxs)("div",{className:"d-flex flex-row w-50 w-sm-100 justify-content-between clickable",onClick:()=>{es(""),et(""),ea(""),setTimeout(()=>{(0,m.swMessageGetVersions)()},1e3)},children:[(0,t.jsx)("div",{className:"pe-2",children:(0,t.jsx)("div",{children:"Version:"})}),(0,t.jsx)("div",{children:(0,t.jsx)("div",{children:"1.0.0"+ec})})]})})})})]})]})})}},68844:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return o},CookiePolicyMeta:function(){return l}});var t=n("10327"),i=n("83169"),a=n.n(i),r=n("5441");let l={location:"/cookies/",label:"CookiePolicy"};function o(){return(0,t.jsx)(a.Fragment,{children:(0,t.jsx)("div",{className:"cookie-policy main-panel h-100",children:(0,t.jsx)("div",{className:"d-flex justify-content-between h-100 px-2",children:(0,t.jsxs)("div",{className:"py-3",children:[(0,t.jsx)("h1",{children:"Cookie Policy"}),(0,t.jsx)("h2",{className:"py-2",children:"What are cookies?"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"A cookie (and cookie technologies for example: browser cookies, local storage, and IndexedDB storage) is a file that is stored on your device that contains information which identifies you to a website. Websites use cookies to personalize your web experience based on your preferences and also for personalized ads."}),(0,t.jsxs)("p",{className:"m-0 ps-2 pt-2",children:["To learn more about browser storage technologies see"," ",(0,t.jsx)("a",{href:"https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#what_technologies_store_data_in_the_browser",target:"_blank",rel:"noreferrer",children:"MDN Storage_API"}),"."]}),(0,t.jsx)("h2",{className:"py-2",children:"How do we use cookies?"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"This application does not collect personal information, analyze user browsing behavior, display targeted ads, nor does it share any of your data with third parties."}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"This application uses cookie technologies to:"}),(0,t.jsxs)("ul",{children:[(0,t.jsx)("li",{children:"Identify you as a user."}),(0,t.jsx)("li",{children:"Store user app data (language datasets)."}),(0,t.jsx)("li",{children:"Store user app media (language pronunciations)."}),(0,t.jsx)("li",{children:"Enable offline app use by utilizing stored data and media."})]}),(0,t.jsx)("h2",{className:"py-2",children:"Opting out of cookies"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"Please note that blocking cookies will impact the functionality of the application and only minimal features will remain."}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"Instructions on deleting cookies for commonly used browsers:"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:(0,t.jsx)("a",{href:"https://support.google.com/chrome/answer/95647?hl=en",target:"_blank",rel:"noreferrer",children:"Chrome"})}),(0,t.jsx)("p",{className:"m-0 ps-2",children:(0,t.jsx)("a",{href:"https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored",target:"_blank",rel:"noreferrer",children:"Firefox"})}),(0,t.jsx)("p",{className:"m-0 ps-2",children:(0,t.jsx)("a",{href:"https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies",target:"_blank",rel:"noreferrer",children:"Microsoft Edge"})}),(0,t.jsx)("h2",{className:"py-2",children:"Cookie usage"}),(0,t.jsx)("h3",{className:"py-2",children:"Technical Cookies"}),(0,t.jsx)("div",{className:"pb-5",children:(0,t.jsxs)("table",{className:"border",children:[(0,t.jsx)("thead",{className:"border",children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{className:"p-2",children:"Name"}),(0,t.jsx)("th",{className:"p-2",children:"Purpose"}),(0,t.jsx)("th",{className:"p-2",children:"Cookie type and duration"})]})}),(0,t.jsx)("tbody",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{className:"p-2",children:r.cookieAcceptance}),(0,t.jsx)("td",{className:"p-2",children:"Stores your cookie preferences (date agreed)"}),(0,t.jsx)("td",{className:"p-2",children:"First party persistent cookie"})]})})]})}),(0,t.jsx)("h3",{className:"py-2",children:"Local storage"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"Local storage is used to store the user's app settings. This is nearly permanent storage that enables app functionality when offline."}),(0,t.jsx)("h3",{className:"py-2",children:"IndexedDB"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"IndexedDB is used to store the user's app data set. This is nearly permanent storage that enables app functionality when offline."}),(0,t.jsx)("h3",{className:"py-2",children:"Persistent Storage"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"Persistent Storage is a setting you can enable to prevent the browser from deleting data from this application (without being asked) in the event storage quota nears it's limit. Storage can always be cleared with explicit user action."}),(0,t.jsxs)("p",{className:"m-0 ps-2 pt-2",children:["To learn more, see"," ",(0,t.jsx)("a",{href:"https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#does_browser-stored_data_persist",target:"_blank",rel:"noreferrer",children:"Does browser-stored data persist?"})]})]})})})})}},28303:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return c},PrivacyPolicyMeta:function(){return o}});var t=n("10327"),i=n("83169"),a=n.n(i),r=n("37654"),l=n("68844");let o={location:"/privacy/",label:"PrivacyPolicy"};function c(){return(0,t.jsx)(a.Fragment,{children:(0,t.jsx)("div",{className:"privacy-policy main-panel h-100",children:(0,t.jsx)("div",{className:"d-flex justify-content-between h-100 px-2",children:(0,t.jsxs)("div",{className:"py-3",children:[(0,t.jsx)("h1",{children:"Privacy Policy"}),(0,t.jsx)("h2",{className:"py-2",children:"Type of information collected"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:'We do not collect personal information. However, when you use our website or app the user is encouraged to enter free form information ("user generated content", "UGC", or "user created study material"). This UGC is not publicly available. Each user\'s study material is private from other users and available only to them.'}),(0,t.jsx)("h2",{className:"py-2",children:"Method of information collection"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:'We do not collect personal information. However, a basic function of the application is to allow the user to add study material (UGC) with the purpose of using it in study sessions. This UGC can be entered in the application (via the "Edit" data sheets page). You are responsible for the UGC entered into the application.'}),(0,t.jsx)("h2",{className:"py-2",children:"Personal information handling"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"We do not collect personal information. The user generated content's purpose is self consumption in the form of study material. Our app uses Google's translate service to generate audio pronunciations. Aside from the text to be translated and the target language no other user information is provided to the google translate service."}),(0,t.jsx)("h2",{className:"py-2",children:"Cookies"}),(0,t.jsxs)("p",{className:"m-0 ps-2",children:["Please refer to our"," ",(0,t.jsx)(r.Link,{to:l.CookiePolicyMeta.location,children:"Cookie Policy"}),"."]}),(0,t.jsx)("h2",{className:"py-2",children:"Opting out"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"We hope this application is useful to you. However, at any time you can withdraw your consent and delete the application to clear all application data."}),(0,t.jsx)("h2",{className:"py-2",children:"Privacy Policy updates"}),(0,t.jsxs)("p",{className:"m-0 ps-2",children:["The latest Privacy Policy will be accessible here. Previous versions will be archived on the"," ",(0,t.jsx)(r.Link,{to:"https://github.com/bryanjimenez/nmemonica/commits/main/src/components/Terms/PrivacyPolicy.tsx",target:"_blank",rel:"noreferer",children:"Github"})," ","repository."]}),(0,t.jsx)("h2",{className:"py-2",children:"Questions?"}),(0,t.jsxs)("p",{className:"m-0 ps-2",children:["Questions on how our app works? See our project's"," ",(0,t.jsx)(r.Link,{to:"https://github.com/bryanjimenez/nmemonica/blob/main/README.md",target:"_blank",rel:"noreferer",children:"README"})," ","Page."]}),(0,t.jsxs)("p",{className:"m-0 ps-2",children:["For now you can contact us via"," ",(0,t.jsx)(r.Link,{to:"https://github.com/bryanjimenez/nmemonica",target:"_blank",rel:"noreferer",children:"Github"}),"."]})]})})})})}},91646:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return l},TermsAndConditionsMeta:function(){return r}});var t=n("10327"),i=n("83169"),a=n.n(i);let r={location:"/terms/",label:"TermsAndConditions"};function l(){return(0,t.jsx)(a.Fragment,{children:(0,t.jsx)("div",{className:"terms-and-conditions main-panel h-100",children:(0,t.jsx)("div",{className:"d-flex justify-content-between h-100 px-2",children:(0,t.jsxs)("div",{className:"py-3",children:[(0,t.jsx)("h1",{children:"Terms and Conditions"}),(0,t.jsx)("p",{children:"Definitions"}),(0,t.jsxs)("ul",{children:[(0,t.jsx)("li",{children:'"Contributor": Individuals that creates or owns Covered Software.'}),(0,t.jsx)("li",{children:'"Covered Software": Nmemonica; The website or application.'}),(0,t.jsx)("li",{children:'"You": Individual using or executing Covered Software.'})]}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"The following disclaimers apply to any user (You) who may use Nmemonica (Covered Software). Usage of the Covered Software implies agreement between the user and the Contributors of the Covered Software on the following:"}),(0,t.jsx)("h2",{className:"py-2",children:"Disclaimer of Warranty"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:'Covered Software is provided on an "as is" basis, without warranty of any kind, either expressed, implied, or statutory, including, without limitation, warranties that the Covered Software is free of defects, merchantable, fit for a particular purpose or non-infringing. The entire risk as to the quality and performance of the Covered Software is with You. Should any Covered Software prove defective in any respect, You (not any Contributor) assume the cost of any necessary servicing, repair, or correction. This disclaimer of warranty constitutes an essential part of this License. No use of any Covered Software is authorized under this License except under this disclaimer.'}),(0,t.jsx)("h2",{className:"py-2",children:"Limitation of Liability"}),(0,t.jsx)("p",{className:"m-0 ps-2",children:"Under no circumstances and under no legal theory, whether tort (including negligence), contract, or otherwise, shall any Contributor, or anyone who distributes Covered Software as permitted above, be liable to You for any direct, indirect, special, incidental, or consequential damages of any character including, without limitation, damages for lost profits, loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses, even if such party shall have been informed of the possibility of such damages. This limitation of liability shall not apply to liability for death or personal injury resulting from such party's negligence to the extent applicable law prohibits such limitation. Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so this exclusion and limitation may not apply to You."})]})})})})}},480:function(e,s,n){"use strict";n.r(s),n.d(s,{play:function(){return u},getTermUID:function(){return h},getTerm:function(){return m},termFilterByType:function(){return p},getStaleGroups:function(){return f},getStaleSpaceRepKeys:function(){return j},minimumTimeForSpaceRepUpdate:function(){return g},minimumTimeForTimedPlay:function(){return v},labelOptions:function(){return b},toggleOptions:function(){return y},japaneseLabel:function(){return N},englishLabel:function(){return w},labelPlacementHelper:function(){return k},getEnglishHint:function(){return S},getJapaneseHint:function(){return C},getCacheUID:function(){return P},toggleFuriganaSettingHelper:function(){return T},pause:function(){return E},loopN:function(){return function e(s,n,t,{signal:i}){let a=new Promise((a,r)=>{let l=()=>{clearTimeout(o);let e=Error("User interrupted loop.",{cause:{code:"UserAborted"}});r(e)},o=setTimeout(()=>{s>0?n().then(()=>e(s-1,n,t,{signal:i}).then(()=>{i?.removeEventListener("abort",l),a()})).catch(e=>{r(e)}):(i?.removeEventListener("abort",l),a())},t);i?.aborted&&l(),i?.addEventListener("abort",l)});return a}},motionThresholdCondition:function(){return M},getDeviceMotionEventPermission:function(){return R}});var t=n("10327"),i=n("49620"),a=n.n(i);n("83169");var r=n("80325"),l=n("85299"),o=n("34989"),c=n("15541"),d=n("40665");function u(e,s,n,t,i,a,l,o){if(s!==d.TermFilterBy.FREQUENCY&&e&&Math.random()<1/3&&n.length>0){let e=n.filter(e=>{let s=i[e]?.lastView;return s&&(0,r.minsSince)(s)>n.length}),s=e.length,o=Math.floor(Math.random()*(s-0)+0),c=t.find(s=>e[o]===s.uid);if(c&&a!==c.uid){l(c.uid);return}}o()}function h(e,s,n){let t;if(n){let i=n[e];t=s[i]}else t=s[e];if(!t)throw Error("No term found");return t.uid}function m(e,s,n){let t=s.find(s=>e===s.uid);if(!t&&n&&(t=n.find(s=>e===s.uid)),!t)throw Error("No term found");return t}function p(e,s,n=[],t,i){let a=s;if(e===d.TermFilterBy.FREQUENCY){if(!n)throw TypeError("Filter type requires frequencyList");n.length>0?a=t.length>0?s.filter(e=>n.includes(e.uid)&&x(t,e)):s.filter(e=>n.includes(e.uid)):"function"==typeof i&&i(d.TermFilterBy.GROUP)}else e===d.TermFilterBy.TAGS?t.length>0&&(a=s.filter(e=>e.tags.some(e=>t.includes(e)))):t.length>0&&(a=s.filter(e=>x(t,e)));return a}function x(e,s){return void 0!==s.grp&&(e.includes(s.grp)||void 0!==s.subGrp&&e.includes(`${s.grp}.${s.subGrp}`))||void 0===s.grp&&(e.includes("undefined")||void 0!==s.subGrp&&e.includes(`undefined.${s.subGrp}`))}function f(e,s){let n=Object.keys(e).reduce((s,n)=>s=[...s,n,...e[n].map(e=>n+"."+e)],[]),t=s.reduce((e,s)=>(!n.includes(s)&&(e=[...e,s]),e),[]);return t}function j(e,s,n){if(0===s.length||0===Object.keys(e).length)return{keys:new Set,list:[]};let t=new Set(["lastView","vC","f","rein","pron","tpPc","tpAcc","tpCAvg","lastReview","consecutiveRight","difficultyP","accuracyP","daysBetweenReviews"]),i=new Set,a=[];return Object.keys(e).forEach(r=>{let l;let o=e[r];try{l=m(r,s),void 0!==o&&Object.keys(o).forEach(e=>{let s;!t.has(e)&&(s={key:e,uid:r,english:l.english}),void 0!==s&&(i.add(e),a=[...a,s])})}catch(s){let e={key:"uid",uid:r,english:(l={english:n}).english};a=[...a,e]}}),{keys:i,list:a}}function g(e){return~~(Date.now()-e)>1500}function v(e){return~~(Date.now()-e)>300}function b(e,s){return s[e]}function y(e,s){let n=s.length;return e+1<n?e+1:0}function N(e,s,n,i,r){let o,c;let d=!e,u=[],h=!1,m=!1;s.constructor.name===l.JapaneseVerb.name&&"isExceptionVerb"in s&&(h=s.isExceptionVerb()||3===s.getVerbClass(),m=s.isIntransitive(),o=s.getTransitivePair()??s.getIntransitivePair());let p=s.isNaAdj(),x=s.isSlang(),f=s.isKeigo(),j=r?.inverse;if(d&&(m||o)){let e;if(void 0!==o&&"function"==typeof i){let s=o;e=()=>{i(s)}}u=[...u,(0,t.jsx)("span",{className:a({clickable:o,"question-color":o}),onClick:e,children:m?"intr":"trans"},u.length+1)]}if(d&&x&&(u=[...u,(0,t.jsx)("span",{children:"slang"},u.length+1)]),d&&f&&(u=[...u,(0,t.jsx)("span",{children:"keigo"},u.length+1)]),h&&u.length>0&&(u=[(0,t.jsx)("span",{children:"*"},u.length+1),...u]),d&&void 0!==j){let e;"function"==typeof i&&(e=()=>{i(j)}),u=[...u,(0,t.jsx)("span",{className:a({clickable:j,"question-color":j}),onClick:e,children:"inv"},u.length+1)]}return c=u.length>0?(0,t.jsxs)("span",{children:[n,p&&(0,t.jsxs)("span",{className:"opacity-25",children:[" ","な"]}),(0,t.jsxs)("span",{className:"fs-5",children:[(0,t.jsx)("span",{children:" ("}),u.reduce((e,s,n)=>{if(!(n>0)||!(n<u.length))return[...e,s];{let i=(0,t.jsx)("span",{children:", "},u.length+n);return[...e,i,s]}},[]),(0,t.jsx)("span",{children:")"})]})]}):h?(0,t.jsxs)("span",{children:[n,(0,t.jsxs)("span",{children:[" ","*"]})]}):p?(0,t.jsxs)("span",{children:[n,(0,t.jsxs)("span",{className:"opacity-25",children:[" ","な"]})]}):n}function w(e,s,n,i,r){let o,c;let d=[],u=!1;s.constructor.name===l.JapaneseVerb.name&&"isExceptionVerb"in s&&(u=s.isIntransitive(),o=s.getTransitivePair()??s.getIntransitivePair());let h=s.isSlang(),m=s.isKeigo();if(e&&(u||o)){let e;if(void 0!==o&&"function"==typeof i){let s=o;e=()=>{i(s)}}d=[...d,(0,t.jsx)("span",{className:a({clickable:o,"question-color":o}),onClick:e,children:u?"intr":"trans"},d.length+1)]}e&&h&&(d=[...d,(0,t.jsx)("span",{children:"slang"},d.length+1)]),e&&m&&(d=[...d,(0,t.jsx)("span",{children:"keigo"},d.length+1)]);let p=r?.inverse,x=r?.polite;if(e&&void 0!==p){let e;"function"==typeof i&&(e=()=>{i(p)}),d=[...d,(0,t.jsx)("span",{className:a({clickable:p,"question-color":p}),onClick:e,children:"inv"},d.length+1)]}return e&&x&&(d=[...d,(0,t.jsx)("span",{children:"polite"},d.length+1)]),c=d.length>0?(0,t.jsxs)("span",{children:[n,(0,t.jsxs)("span",{className:"fs-5",children:[(0,t.jsx)("span",{children:" ("}),d.reduce((e,s,n)=>{if(!(n>0)||!(n<d.length))return[...e,s];{let i=(0,t.jsx)("span",{children:", "},d.length+n);return[...e,i,s]}},[]),(0,t.jsx)("span",{children:")"})]})]}):n}function k(e,s,n,t,i){let a,r,l,o;return e?(a=s,r=n,l=t,o=i):(a=n,r=s,l=i,o=t),{topValue:a,topLabel:l,bottomValue:r,bottomLabel:o}}function S(e){return e.grp&&""!==e.grp?(0,t.jsx)("span",{className:"hint",children:e.grp+(e.subGrp?", "+e.subGrp:"")}):void 0}function C(e){let s;let n=e.getPronunciation().slice(1,2);return s=(0,o.isYoon)(n)?e.getHint(o.kanaHintBuilder,c.furiganaHintBuilder,3,2):e.getHint(o.kanaHintBuilder,c.furiganaHintBuilder,3,1)}function P(e){let{uid:s}=e;if(!s)throw console.warn(JSON.stringify(e)),Error("Missing uid");return e.form&&(s+="dictionary"!==e.form?e.form.replace("-","."):""),s}function T(e,s,n,t){let i=s?.[e]?.f!==!1;return{furigana:{show:i,toggle:!1===n&&"function"==typeof t?t:void 0}}}function E(e,{signal:s},n){return new Promise((t,i)=>{let a=()=>{clearTimeout(l),clearInterval(r),i(Error("Aborted"))},r="function"==typeof n?setInterval(n,200,200,e):-1,l=setTimeout(()=>{s?.removeEventListener("abort",a),clearInterval(r),t()},e);s?.aborted&&a(),s?.addEventListener("abort",a)})}function M(e,s,n){let t=e.acceleration?.y,i=e.acceleration?.z;if(null==t||null==i)throw Error("Device does not support DeviceMotionEvent",{cause:{code:"DeviceMotionEvent"}});{let e=Math.sqrt(t*t+i*i);e>s&&"function"==typeof n&&n(e)}}function R(e,s){"DeviceMotionEvent"in window&&"requestPermission"in DeviceMotionEvent&&"function"==typeof DeviceMotionEvent.requestPermission?DeviceMotionEvent.requestPermission().then(s=>{"granted"===s&&e()}).catch(s):e()}},10776:function(e,s,n){"use strict";function t(e,s){return function(){if(s||"function"==typeof s){e(s);return}}}function i(e,s,n){return function(t){if(n){e(s(n));return}if(t instanceof Object&&"_reactName"in t){e(s());return}if(void 0!==t){e(s(t));return}e(s())}}n.r(s),n.d(s,{setStateFunction:function(){return t},buildAction:function(){return i}})},68130:function(e,s,n){"use strict";n.r(s),n.d(s,{useConnectSetting:function(){return i}});var t=n("40432");function i(){let[e,s,n,i,a]=(0,t.useSelector)(({global:e})=>{let{cookies:s,darkMode:n,swipeThreshold:t,motionThreshold:i,debug:a}=e;return[s,n,t,i,a]},t.shallowEqual),r=(0,t.useSelector)(({global:e})=>{let{memory:s}=e;return s},(e,s)=>e.usage===s.usage),[l,o,c]=(0,t.useSelector)(({opposite:e})=>{let{qRomaji:s,aRomaji:n,fadeInAnswers:t}=e;return[s,n,t]},t.shallowEqual),[d,u]=(0,t.useSelector)(({particle:e})=>{let{aRomaji:s,fadeInAnswers:n}=e.setting;return[s,n]},t.shallowEqual);return{cookies:e,darkMode:s,swipeThreshold:n,motionThreshold:i,memory:r,debug:a,oppositesQRomaji:l,oppositesARomaji:o,oppositeFadeInAnswers:c,particlesARomaji:d,particleFadeInAnswer:u}}},75621:function(e,s,n){"use strict";n.r(s),n.d(s,{useSWMessageVersionEventHandler:function(){return a}});var t=n("83169"),i=n("22839");function a(e,s,n){let a=(0,t.useCallback)(t=>{let{type:a}=t.data;if(a===i.SWMsgOutgoing.SW_GET_VERSIONS){let{swVersion:i,jsVersion:a,bundleVersion:r}=t.data;e(i),s(a),n(r)}},[e,s,n]);return a}}}]);