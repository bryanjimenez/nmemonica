(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["418"],{90306:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return f}});var a=n("73909"),i=n("43549"),s=n("33370"),c=n("62942"),l=n("30858"),u=n("72834"),o=n("46726"),d=n("22868"),r=n("35225");function f(){let e=(0,i.useDispatch)(),{charSet:t,easyMode:n,wideMode:f,choiceN:x}=(0,o.useConnectKana)(),h=(0,a.jsx)("div",{className:"outer",children:(0,a.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,a.jsx)("div",{className:"column-1"}),(0,a.jsxs)("div",{className:"column-2 setting-block",children:[(0,a.jsx)("div",{children:(0,a.jsx)(c.default,{active:t===r.KanaType.HIRAGANA,action:(0,l.buildAction)(e,d.toggleKana),statusText:(0,u.labelOptions)(t,["Hiragana","Katakana","Mixed"])})}),(0,a.jsx)("div",{className:"d-flex justify-content-end p-2",children:(0,a.jsx)(s.default,{initial:x,setChoiceN:(0,l.buildAction)(e,d.setKanaBtnN),wideMode:f,wideN:31,toggleWide:(0,l.buildAction)(e,d.toggleKanaGameWideMode)})}),(0,a.jsx)("div",{children:(0,a.jsx)(c.default,{active:n,action:(0,l.buildAction)(e,d.toggleKanaEasyMode),statusText:"Kana Hints"})})]})]})});return h}},46726:function(e,t,n){"use strict";n.r(t),n.d(t,{useConnectKana:function(){return i}});var a=n("43549");function i(){let e=(0,a.useSelector)(({global:e})=>e.debug),[t,n,i,s,c]=(0,a.useSelector)(({kana:e})=>{let{hiragana:t,katakana:n,vowels:a,consonants:i,sounds:s}=e;return[t,n,a,i,s]},()=>!0),[l,u,o,d]=(0,a.useSelector)(({kana:e})=>{let{wideMode:t,easyMode:n,charSet:a,choiceN:i}=e.setting;return[t,n,a,i]},a.shallowEqual);return{debug:e,hiragana:t,katakana:n,vowels:i,consonants:s,sounds:c,choiceN:l?31:d,wideMode:l,easyMode:u,charSet:o}}}}]);