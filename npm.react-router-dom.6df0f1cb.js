/*! For license information please see npm.react-router-dom.6df0f1cb.js.LICENSE.txt */
"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[216],{9655:(e,t,n)=>{n.d(t,{UT:()=>c,rU:()=>f});var r=n(7294),o=n(6335),a=n(2599);function l(){return l=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},l.apply(this,arguments)}const i=["onClick","relative","reloadDocument","replace","state","target","to","preventScrollReset"];function c(e){let{basename:t,children:n,future:l,window:i}=e,c=r.useRef();null==c.current&&(c.current=(0,a.q_)({window:i,v5Compat:!0}));let s=c.current,[u,f]=r.useState({action:s.action,location:s.location}),{v7_startTransition:p}=l||{},v=r.useCallback((e=>{p&&o.XS?(0,o.XS)((()=>f(e))):f(e)}),[f,p]);return r.useLayoutEffect((()=>s.listen(v)),[s,v]),r.createElement(o.F0,{basename:t,children:n,location:u.location,navigationType:u.action,navigator:s})}const s="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,u=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,f=r.forwardRef((function(e,t){let n,{onClick:c,relative:f,reloadDocument:p,replace:v,state:d,target:h,to:m,preventScrollReset:w}=e,b=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,i),{basename:g}=r.useContext(o.Us),R=!1;if("string"==typeof m&&u.test(m)&&(n=m,s))try{let e=new URL(window.location.href),t=m.startsWith("//")?new URL(e.protocol+m):new URL(m),n=(0,a.Zn)(t.pathname,g);t.origin===e.origin&&null!=n?m=n+t.search+t.hash:R=!0}catch(e){}let S=(0,o.oQ)(m,{relative:f}),y=function(e,t){let{target:n,replace:l,state:i,preventScrollReset:c,relative:s}=void 0===t?{}:t,u=(0,o.s0)(),f=(0,o.TH)(),p=(0,o.WU)(e,{relative:s});return r.useCallback((t=>{if(function(e,t){return!(0!==e.button||t&&"_self"!==t||function(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}(e))}(t,n)){t.preventDefault();let n=void 0!==l?l:(0,a.Ep)(f)===(0,a.Ep)(p);u(e,{replace:n,state:i,preventScrollReset:c,relative:s})}}),[f,u,p,l,i,n,e,c,s])}(m,{replace:v,state:d,target:h,preventScrollReset:w,relative:f});return r.createElement("a",l({},b,{href:n||S,onClick:R||p?c:function(e){c&&c(e),e.defaultPrevented||y(e)},ref:t,target:h}))}));var p,v;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmitImpl="useSubmitImpl",e.UseFetcher="useFetcher"})(p||(p={})),function(e){e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"}(v||(v={}))}}]);