"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[995],{2409:(t,e,n)=>{n.d(e,{x7:()=>j,YF:()=>_});var o=n(8301);function r(t){var e;return(null==(e=t.ownerDocument)?void 0:e.defaultView)||window}function i(t){return r(t).getComputedStyle(t)}function l(t){return t instanceof r(t).Node}function c(t){return l(t)?(t.nodeName||"").toLowerCase():""}let s;function a(){if(s)return s;const t=navigator.userAgentData;return t&&Array.isArray(t.brands)?(s=t.brands.map((t=>t.brand+"/"+t.version)).join(" "),s):navigator.userAgent}function f(t){return t instanceof r(t).HTMLElement}function u(t){return t instanceof r(t).Element}function d(t){return"undefined"!=typeof ShadowRoot&&(t instanceof r(t).ShadowRoot||t instanceof ShadowRoot)}function y(t){const{overflow:e,overflowX:n,overflowY:o,display:r}=i(t);return/auto|scroll|overlay|hidden|clip/.test(e+o+n)&&!["inline","contents"].includes(r)}function g(t){return["table","td","th"].includes(c(t))}function m(t){const e=/firefox/i.test(a()),n=i(t),o=n.backdropFilter||n.WebkitBackdropFilter;return"none"!==n.transform||"none"!==n.perspective||!!o&&"none"!==o||e&&"filter"===n.willChange||e&&!!n.filter&&"none"!==n.filter||["transform","perspective"].some((t=>n.willChange.includes(t)))||["paint","layout","strict","content"].some((t=>{const e=n.contain;return null!=e&&e.includes(t)}))}function p(){return/^((?!chrome|android).)*safari/i.test(a())}function h(t){return["html","body","#document"].includes(c(t))}const x=Math.min,w=Math.max,b=Math.round;function v(t){const e=i(t);let n=parseFloat(e.width),o=parseFloat(e.height);const r=f(t),l=r?t.offsetWidth:n,c=r?t.offsetHeight:o,s=b(n)!==l||b(o)!==c;return s&&(n=l,o=c),{width:n,height:o,fallback:s}}function R(t){return u(t)?t:t.contextElement}const L={x:1,y:1};function T(t){const e=R(t);if(!f(e))return L;const n=e.getBoundingClientRect(),{width:o,height:r,fallback:i}=v(e);let l=(i?b(n.width):n.width)/o,c=(i?b(n.height):n.height)/r;return l&&Number.isFinite(l)||(l=1),c&&Number.isFinite(c)||(c=1),{x:l,y:c}}function E(t,e,n,i){var l,c;void 0===e&&(e=!1),void 0===n&&(n=!1);const s=t.getBoundingClientRect(),a=R(t);let f=L;e&&(i?u(i)&&(f=T(i)):f=T(t));const d=a?r(a):window,y=p()&&n;let g=(s.left+(y&&(null==(l=d.visualViewport)?void 0:l.offsetLeft)||0))/f.x,m=(s.top+(y&&(null==(c=d.visualViewport)?void 0:c.offsetTop)||0))/f.y,h=s.width/f.x,x=s.height/f.y;if(a){const t=r(a),e=i&&u(i)?r(i):i;let n=t.frameElement;for(;n&&i&&e!==t;){const t=T(n),e=n.getBoundingClientRect(),o=getComputedStyle(n);e.x+=(n.clientLeft+parseFloat(o.paddingLeft))*t.x,e.y+=(n.clientTop+parseFloat(o.paddingTop))*t.y,g*=t.x,m*=t.y,h*=t.x,x*=t.y,g+=e.x,m+=e.y,n=r(n).frameElement}}return(0,o.JB)({width:h,height:x,x:g,y:m})}function A(t){return((l(t)?t.ownerDocument:t.document)||window.document).documentElement}function P(t){return u(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.pageXOffset,scrollTop:t.pageYOffset}}function k(t){return E(A(t)).left+P(t).scrollLeft}function C(t){if("html"===c(t))return t;const e=t.assignedSlot||t.parentNode||d(t)&&t.host||A(t);return d(e)?e.host:e}function O(t){const e=C(t);return h(e)?e.ownerDocument.body:f(e)&&y(e)?e:O(e)}function S(t,e){var n;void 0===e&&(e=[]);const o=O(t),i=o===(null==(n=t.ownerDocument)?void 0:n.body),l=r(o);return i?e.concat(l,l.visualViewport||[],y(o)?o:[]):e.concat(o,S(o))}function D(t,e,n){let l;if("viewport"===e)l=function(t,e){const n=r(t),o=A(t),i=n.visualViewport;let l=o.clientWidth,c=o.clientHeight,s=0,a=0;if(i){l=i.width,c=i.height;const t=p();(!t||t&&"fixed"===e)&&(s=i.offsetLeft,a=i.offsetTop)}return{width:l,height:c,x:s,y:a}}(t,n);else if("document"===e)l=function(t){const e=A(t),n=P(t),o=t.ownerDocument.body,r=w(e.scrollWidth,e.clientWidth,o.scrollWidth,o.clientWidth),l=w(e.scrollHeight,e.clientHeight,o.scrollHeight,o.clientHeight);let c=-n.scrollLeft+k(t);const s=-n.scrollTop;return"rtl"===i(o).direction&&(c+=w(e.clientWidth,o.clientWidth)-r),{width:r,height:l,x:c,y:s}}(A(t));else if(u(e))l=function(t,e){const n=E(t,!0,"fixed"===e),o=n.top+t.clientTop,r=n.left+t.clientLeft,i=f(t)?T(t):{x:1,y:1};return{width:t.clientWidth*i.x,height:t.clientHeight*i.y,x:r*i.x,y:o*i.y}}(e,n);else{const n={...e};if(p()){var c,s;const e=r(t);n.x-=(null==(c=e.visualViewport)?void 0:c.offsetLeft)||0,n.y-=(null==(s=e.visualViewport)?void 0:s.offsetTop)||0}l=n}return(0,o.JB)(l)}function B(t,e){return f(t)&&"fixed"!==i(t).position?e?e(t):t.offsetParent:null}function M(t,e){const n=r(t);if(!f(t))return n;let o=B(t,e);for(;o&&g(o)&&"static"===i(o).position;)o=B(o,e);return o&&("html"===c(o)||"body"===c(o)&&"static"===i(o).position&&!m(o))?n:o||function(t){let e=C(t);for(;f(e)&&!h(e);){if(m(e))return e;e=C(e)}return null}(t)||n}function W(t,e,n){const o=f(e),r=A(e),i=E(t,!0,"fixed"===n,e);let l={scrollLeft:0,scrollTop:0};const s={x:0,y:0};if(o||!o&&"fixed"!==n)if(("body"!==c(e)||y(r))&&(l=P(e)),f(e)){const t=E(e,!0);s.x=t.x+e.clientLeft,s.y=t.y+e.clientTop}else r&&(s.x=k(r));return{x:i.left+l.scrollLeft-s.x,y:i.top+l.scrollTop-s.y,width:i.width,height:i.height}}const F={getClippingRect:function(t){let{element:e,boundary:n,rootBoundary:o,strategy:r}=t;const l="clippingAncestors"===n?function(t,e){const n=e.get(t);if(n)return n;let o=S(t).filter((t=>u(t)&&"body"!==c(t))),r=null;const l="fixed"===i(t).position;let s=l?C(t):t;for(;u(s)&&!h(s);){const t=i(s),e=m(s);"fixed"===t.position?r=null:(l?e||r:e||"static"!==t.position||!r||!["absolute","fixed"].includes(r.position))?r=t:o=o.filter((t=>t!==s)),s=C(s)}return e.set(t,o),o}(e,this._c):[].concat(n),s=[...l,o],a=s[0],f=s.reduce(((t,n)=>{const o=D(e,n,r);return t.top=w(o.top,t.top),t.right=x(o.right,t.right),t.bottom=x(o.bottom,t.bottom),t.left=w(o.left,t.left),t}),D(e,a,r));return{width:f.right-f.left,height:f.bottom-f.top,x:f.left,y:f.top}},convertOffsetParentRelativeRectToViewportRelativeRect:function(t){let{rect:e,offsetParent:n,strategy:o}=t;const r=f(n),i=A(n);if(n===i)return e;let l={scrollLeft:0,scrollTop:0},s={x:1,y:1};const a={x:0,y:0};if((r||!r&&"fixed"!==o)&&(("body"!==c(n)||y(i))&&(l=P(n)),f(n))){const t=E(n);s=T(n),a.x=t.x+n.clientLeft,a.y=t.y+n.clientTop}return{width:e.width*s.x,height:e.height*s.y,x:e.x*s.x-l.scrollLeft*s.x+a.x,y:e.y*s.y-l.scrollTop*s.y+a.y}},isElement:u,getDimensions:function(t){return v(t)},getOffsetParent:M,getDocumentElement:A,getScale:T,async getElementRects(t){let{reference:e,floating:n,strategy:o}=t;const r=this.getOffsetParent||M,i=this.getDimensions;return{reference:W(e,await r(n),o),floating:{x:0,y:0,...await i(n)}}},getClientRects:t=>Array.from(t.getClientRects()),isRTL:t=>"rtl"===i(t).direction};var V=n(7294),H=n(3935);const j=t=>{const{element:e,padding:n}=t;return{name:"arrow",options:t,fn(t){return r=e,Object.prototype.hasOwnProperty.call(r,"current")?null!=e.current?(0,o.x7)({element:e.current,padding:n}).fn(t):{}:e?(0,o.x7)({element:e,padding:n}).fn(t):{};var r}}};var N="undefined"!=typeof document?V.useLayoutEffect:V.useEffect;function Y(t,e){if(t===e)return!0;if(typeof t!=typeof e)return!1;if("function"==typeof t&&t.toString()===e.toString())return!0;let n,o,r;if(t&&e&&"object"==typeof t){if(Array.isArray(t)){if(n=t.length,n!=e.length)return!1;for(o=n;0!=o--;)if(!Y(t[o],e[o]))return!1;return!0}if(r=Object.keys(t),n=r.length,n!==Object.keys(e).length)return!1;for(o=n;0!=o--;)if(!Object.prototype.hasOwnProperty.call(e,r[o]))return!1;for(o=n;0!=o--;){const n=r[o];if(!("_owner"===n&&t.$$typeof||Y(t[n],e[n])))return!1}return!0}return t!=t&&e!=e}function J(t){const e=V.useRef(t);return N((()=>{e.current=t})),e}function _(t){void 0===t&&(t={});const{placement:e="bottom",strategy:n="absolute",middleware:r=[],platform:i,whileElementsMounted:l,open:c}=t,[s,a]=V.useState({x:null,y:null,strategy:n,placement:e,middlewareData:{},isPositioned:!1}),[f,u]=V.useState(r);Y(f,r)||u(r);const d=V.useRef(null),y=V.useRef(null),g=V.useRef(s),m=J(l),p=J(i),[h,x]=V.useState(null),[w,b]=V.useState(null),v=V.useCallback((t=>{d.current!==t&&(d.current=t,x(t))}),[]),R=V.useCallback((t=>{y.current!==t&&(y.current=t,b(t))}),[]),L=V.useCallback((()=>{if(!d.current||!y.current)return;const t={placement:e,strategy:n,middleware:f};p.current&&(t.platform=p.current),((t,e,n)=>{const r=new Map,i={platform:F,...n},l={...i.platform,_c:r};return(0,o.oo)(t,e,{...i,platform:l})})(d.current,y.current,t).then((t=>{const e={...t,isPositioned:!0};T.current&&!Y(g.current,e)&&(g.current=e,H.flushSync((()=>{a(e)})))}))}),[f,e,n,p]);N((()=>{!1===c&&g.current.isPositioned&&(g.current.isPositioned=!1,a((t=>({...t,isPositioned:!1}))))}),[c]);const T=V.useRef(!1);N((()=>(T.current=!0,()=>{T.current=!1})),[]),N((()=>{if(h&&w){if(m.current)return m.current(h,w,L);L()}}),[h,w,L,m]);const E=V.useMemo((()=>({reference:d,floating:y,setReference:v,setFloating:R})),[v,R]),A=V.useMemo((()=>({reference:h,floating:w})),[h,w]);return V.useMemo((()=>({...s,update:L,refs:E,elements:A,reference:v,floating:R})),[s,L,E,A,v,R])}},8301:(t,e,n)=>{function o(t){return t.split("-")[1]}function r(t){return"y"===t?"height":"width"}function i(t){return t.split("-")[0]}function l(t){return["top","bottom"].includes(i(t))?"x":"y"}function c(t,e,n){let{reference:c,floating:s}=t;const a=c.x+c.width/2-s.width/2,f=c.y+c.height/2-s.height/2,u=l(e),d=r(u),y=c[d]/2-s[d]/2,g="x"===u;let m;switch(i(e)){case"top":m={x:a,y:c.y-s.height};break;case"bottom":m={x:a,y:c.y+c.height};break;case"right":m={x:c.x+c.width,y:f};break;case"left":m={x:c.x-s.width,y:f};break;default:m={x:c.x,y:c.y}}switch(o(e)){case"start":m[u]-=y*(n&&g?-1:1);break;case"end":m[u]+=y*(n&&g?-1:1)}return m}n.d(e,{JB:()=>f,cv:()=>p,oo:()=>s,uY:()=>h,x7:()=>m});const s=async(t,e,n)=>{const{placement:o="bottom",strategy:r="absolute",middleware:i=[],platform:l}=n,s=i.filter(Boolean),a=await(null==l.isRTL?void 0:l.isRTL(e));let f=await l.getElementRects({reference:t,floating:e,strategy:r}),{x:u,y:d}=c(f,o,a),y=o,g={},m=0;for(let n=0;n<s.length;n++){const{name:i,fn:p}=s[n],{x:h,y:x,data:w,reset:b}=await p({x:u,y:d,initialPlacement:o,placement:y,strategy:r,middlewareData:g,rects:f,platform:l,elements:{reference:t,floating:e}});u=null!=h?h:u,d=null!=x?x:d,g={...g,[i]:{...g[i],...w}},b&&m<=50&&(m++,"object"==typeof b&&(b.placement&&(y=b.placement),b.rects&&(f=!0===b.rects?await l.getElementRects({reference:t,floating:e,strategy:r}):b.rects),({x:u,y:d}=c(f,y,a))),n=-1)}return{x:u,y:d,placement:y,strategy:r,middlewareData:g}};function a(t){return"number"!=typeof t?function(t){return{top:0,right:0,bottom:0,left:0,...t}}(t):{top:t,right:t,bottom:t,left:t}}function f(t){return{...t,top:t.y,left:t.x,right:t.x+t.width,bottom:t.y+t.height}}async function u(t,e){var n;void 0===e&&(e={});const{x:o,y:r,platform:i,rects:l,elements:c,strategy:s}=t,{boundary:u="clippingAncestors",rootBoundary:d="viewport",elementContext:y="floating",altBoundary:g=!1,padding:m=0}=e,p=a(m),h=c[g?"floating"===y?"reference":"floating":y],x=f(await i.getClippingRect({element:null==(n=await(null==i.isElement?void 0:i.isElement(h)))||n?h:h.contextElement||await(null==i.getDocumentElement?void 0:i.getDocumentElement(c.floating)),boundary:u,rootBoundary:d,strategy:s})),w="floating"===y?{...l.floating,x:o,y:r}:l.reference,b=await(null==i.getOffsetParent?void 0:i.getOffsetParent(c.floating)),v=await(null==i.isElement?void 0:i.isElement(b))&&await(null==i.getScale?void 0:i.getScale(b))||{x:1,y:1},R=f(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({rect:w,offsetParent:b,strategy:s}):w);return{top:(x.top-R.top+p.top)/v.y,bottom:(R.bottom-x.bottom+p.bottom)/v.y,left:(x.left-R.left+p.left)/v.x,right:(R.right-x.right+p.right)/v.x}}const d=Math.min,y=Math.max;function g(t,e,n){return y(t,d(e,n))}const m=t=>({name:"arrow",options:t,async fn(e){const{element:n,padding:i=0}=t||{},{x:c,y:s,placement:f,rects:u,platform:d,elements:y}=e;if(null==n)return{};const m=a(i),p={x:c,y:s},h=l(f),x=r(h),w=await d.getDimensions(n),b="y"===h,v=b?"top":"left",R=b?"bottom":"right",L=b?"clientHeight":"clientWidth",T=u.reference[x]+u.reference[h]-p[h]-u.floating[x],E=p[h]-u.reference[h],A=await(null==d.getOffsetParent?void 0:d.getOffsetParent(n));let P=A?A[L]:0;P&&await(null==d.isElement?void 0:d.isElement(A))||(P=y.floating[L]||u.floating[x]);const k=T/2-E/2,C=m[v],O=P-w[x]-m[R],S=P/2-w[x]/2+k,D=g(C,S,O),B=null!=o(f)&&S!=D&&u.reference[x]/2-(S<C?m[v]:m[R])-w[x]/2<0;return{[h]:p[h]-(B?S<C?C-S:O-S:0),data:{[h]:D,centerOffset:S-D}}}});["top","right","bottom","left"].reduce(((t,e)=>t.concat(e,e+"-start",e+"-end")),[]);const p=function(t){return void 0===t&&(t=0),{name:"offset",options:t,async fn(e){const{x:n,y:r}=e,c=await async function(t,e){const{placement:n,platform:r,elements:c}=t,s=await(null==r.isRTL?void 0:r.isRTL(c.floating)),a=i(n),f=o(n),u="x"===l(n),d=["left","top"].includes(a)?-1:1,y=s&&u?-1:1,g="function"==typeof e?e(t):e;let{mainAxis:m,crossAxis:p,alignmentAxis:h}="number"==typeof g?{mainAxis:g,crossAxis:0,alignmentAxis:null}:{mainAxis:0,crossAxis:0,alignmentAxis:null,...g};return f&&"number"==typeof h&&(p="end"===f?-1*h:h),u?{x:p*y,y:m*d}:{x:m*d,y:p*y}}(e,t);return{x:n+c.x,y:r+c.y,data:c}}}};const h=function(t){return void 0===t&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:o,placement:r}=e,{mainAxis:c=!0,crossAxis:s=!1,limiter:a={fn:t=>{let{x:e,y:n}=t;return{x:e,y:n}}},...f}=t,d={x:n,y:o},y=await u(e,f),m=l(i(r)),p=function(t){return"x"===t?"y":"x"}(m);let h=d[m],x=d[p];if(c){const t="y"===m?"bottom":"right";h=g(h+y["y"===m?"top":"left"],h,h-y[t])}if(s){const t="y"===p?"bottom":"right";x=g(x+y["y"===p?"top":"left"],x,x-y[t])}const w=a.fn({...e,[m]:h,[p]:x});return{...w,data:{x:w.x-n,y:w.y-o}}}}}}}]);