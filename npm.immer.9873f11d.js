"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[183],{2902:(t,e,r)=>{function n(t){for(var e=arguments.length,r=Array(e>1?e-1:0),n=1;n<e;n++)r[n-1]=arguments[n];throw Error("[Immer] minified error nr: "+t+(r.length?" "+r.map((function(t){return"'"+t+"'"})).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function o(t){return!!t&&!!t[X]}function i(t){var e;return!!t&&(function(t){if(!t||"object"!=typeof t)return!1;var e=Object.getPrototypeOf(t);if(null===e)return!0;var r=Object.hasOwnProperty.call(e,"constructor")&&e.constructor;return r===Object||"function"==typeof r&&Function.toString.call(r)===Z}(t)||Array.isArray(t)||!!t[V]||!!(null===(e=t.constructor)||void 0===e?void 0:e[V])||s(t)||v(t))}function u(t,e,r){void 0===r&&(r=!1),0===f(t)?(r?Object.keys:q)(t).forEach((function(n){r&&"symbol"==typeof n||e(n,t[n],t)})):t.forEach((function(r,n){return e(n,r,t)}))}function f(t){var e=t[X];return e?e.i>3?e.i-4:e.i:Array.isArray(t)?1:s(t)?2:v(t)?3:0}function c(t,e){return 2===f(t)?t.has(e):Object.prototype.hasOwnProperty.call(t,e)}function a(t,e,r){var n=f(t);2===n?t.set(e,r):3===n?t.add(r):t[e]=r}function l(t,e){return t===e?0!==t||1/t==1/e:t!=t&&e!=e}function s(t){return $&&t instanceof Map}function v(t){return U&&t instanceof Set}function p(t){return t.o||t.t}function y(t){if(Array.isArray(t))return Array.prototype.slice.call(t);var e=B(t);delete e[X];for(var r=q(e),n=0;n<r.length;n++){var o=r[n],i=e[o];!1===i.writable&&(i.writable=!0,i.configurable=!0),(i.get||i.set)&&(e[o]={configurable:!0,writable:!0,enumerable:i.enumerable,value:t[o]})}return Object.create(Object.getPrototypeOf(t),e)}function h(t,e){return void 0===e&&(e=!1),b(t)||o(t)||!i(t)||(f(t)>1&&(t.set=t.add=t.clear=t.delete=d),Object.freeze(t),e&&u(t,(function(t,e){return h(e,!0)}),!0)),t}function d(){n(2)}function b(t){return null==t||"object"!=typeof t||Object.isFrozen(t)}function g(t){var e=G[t];return e||n(18,t),e}function P(){return C}function m(t,e){e&&(g("Patches"),t.u=[],t.s=[],t.v=e)}function O(t){j(t),t.p.forEach(A),t.p=null}function j(t){t===C&&(C=t.l)}function w(t){return C={p:[],l:C,h:t,m:!0,_:0}}function A(t){var e=t[X];0===e.i||1===e.i?e.j():e.O=!0}function S(t,e){e._=e.p.length;var r=e.p[0],o=void 0!==t&&t!==r;return e.h.g||g("ES5").S(e,t,o),o?(r[X].P&&(O(e),n(4)),i(t)&&(t=k(e,t),e.l||R(e,t)),e.u&&g("Patches").M(r[X].t,t,e.u,e.s)):t=k(e,r,[]),O(e),e.u&&e.v(e.u,e.s),t!==T?t:void 0}function k(t,e,r){if(b(e))return e;var n=e[X];if(!n)return u(e,(function(o,i){return D(t,n,e,o,i,r)}),!0),e;if(n.A!==t)return e;if(!n.P)return R(t,n.t,!0),n.t;if(!n.I){n.I=!0,n.A._--;var o=4===n.i||5===n.i?n.o=y(n.k):n.o,i=o,f=!1;3===n.i&&(i=new Set(o),o.clear(),f=!0),u(i,(function(e,i){return D(t,n,o,e,i,r,f)})),R(t,o,!1),r&&t.u&&g("Patches").N(n,r,t.u,t.s)}return n.o}function D(t,e,r,n,u,f,l){if(o(u)){var s=k(t,u,f&&e&&3!==e.i&&!c(e.R,n)?f.concat(n):void 0);if(a(r,n,s),!o(s))return;t.m=!1}else l&&r.add(u);if(i(u)&&!b(u)){if(!t.h.D&&t._<1)return;k(t,u),e&&e.A.l||R(t,u)}}function R(t,e,r){void 0===r&&(r=!1),t.h.D&&t.m&&h(e,r)}function x(t,e){var r=t[X];return(r?p(r):t)[e]}function E(t,e){if(e in t)for(var r=Object.getPrototypeOf(t);r;){var n=Object.getOwnPropertyDescriptor(r,e);if(n)return n;r=Object.getPrototypeOf(r)}}function _(t){t.P||(t.P=!0,t.l&&_(t.l))}function F(t){t.o||(t.o=y(t.t))}function N(t,e,r){var n=s(e)?g("MapSet").F(e,r):v(e)?g("MapSet").T(e,r):t.g?function(t,e){var r=Array.isArray(t),n={i:r?1:0,A:e?e.A:P(),P:!1,I:!1,R:{},l:e,t,k:null,o:null,j:null,C:!1},o=n,i=H;r&&(o=[n],i=L);var u=Proxy.revocable(o,i),f=u.revoke,c=u.proxy;return n.k=c,n.j=f,c}(e,r):g("ES5").J(e,r);return(r?r.A:P()).p.push(n),n}function I(t){return o(t)||n(22,t),function t(e){if(!i(e))return e;var r,n=e[X],o=f(e);if(n){if(!n.P&&(n.i<4||!g("ES5").K(n)))return n.t;n.I=!0,r=M(e,o),n.I=!1}else r=M(e,o);return u(r,(function(e,o){n&&function(t,e){return 2===f(t)?t.get(e):t[e]}(n.t,e)===o||a(r,e,t(o))})),3===o?new Set(r):r}(t)}function M(t,e){switch(e){case 2:return new Map(t);case 3:return Array.from(t)}return y(t)}function z(){function t(t,e){var r=i[t];return r?r.enumerable=e:i[t]=r={configurable:!0,enumerable:e,get:function(){var e=this[X];return H.get(e,t)},set:function(e){var r=this[X];H.set(r,t,e)}},r}function e(t){for(var e=t.length-1;e>=0;e--){var o=t[e][X];if(!o.P)switch(o.i){case 5:n(o)&&_(o);break;case 4:r(o)&&_(o)}}}function r(t){for(var e=t.t,r=t.k,n=q(r),o=n.length-1;o>=0;o--){var i=n[o];if(i!==X){var u=e[i];if(void 0===u&&!c(e,i))return!0;var f=r[i],a=f&&f[X];if(a?a.t!==u:!l(f,u))return!0}}var s=!!e[X];return n.length!==q(e).length+(s?0:1)}function n(t){var e=t.k;if(e.length!==t.t.length)return!0;var r=Object.getOwnPropertyDescriptor(e,e.length-1);if(r&&!r.get)return!0;for(var n=0;n<e.length;n++)if(!e.hasOwnProperty(n))return!0;return!1}var i={};!function(t,e){G[t]||(G[t]=e)}("ES5",{J:function(e,r){var n=Array.isArray(e),o=function(e,r){if(e){for(var n=Array(r.length),o=0;o<r.length;o++)Object.defineProperty(n,""+o,t(o,!0));return n}var i=B(r);delete i[X];for(var u=q(i),f=0;f<u.length;f++){var c=u[f];i[c]=t(c,e||!!i[c].enumerable)}return Object.create(Object.getPrototypeOf(r),i)}(n,e),i={i:n?5:4,A:r?r.A:P(),P:!1,I:!1,R:{},l:r,t:e,k:o,o:null,O:!1,C:!1};return Object.defineProperty(o,X,{value:i,writable:!0}),o},S:function(t,r,i){i?o(r)&&r[X].A===t&&e(t.p):(t.u&&function t(e){if(e&&"object"==typeof e){var r=e[X];if(r){var o=r.t,i=r.k,f=r.R,a=r.i;if(4===a)u(i,(function(e){e!==X&&(void 0!==o[e]||c(o,e)?f[e]||t(i[e]):(f[e]=!0,_(r)))})),u(o,(function(t){void 0!==i[t]||c(i,t)||(f[t]=!1,_(r))}));else if(5===a){if(n(r)&&(_(r),f.length=!0),i.length<o.length)for(var l=i.length;l<o.length;l++)f[l]=!1;else for(var s=o.length;s<i.length;s++)f[s]=!0;for(var v=Math.min(i.length,o.length),p=0;p<v;p++)i.hasOwnProperty(p)||(f[p]=!0),void 0===f[p]&&t(i[p])}}}}(t.p[0]),e(t.p))},K:function(t){return 4===t.i?r(t):n(t)}})}r.d(e,{ZP:()=>et,mv:()=>o,o$:()=>i,pV:()=>z});var K,C,W="undefined"!=typeof Symbol&&"symbol"==typeof Symbol("x"),$="undefined"!=typeof Map,U="undefined"!=typeof Set,J="undefined"!=typeof Proxy&&void 0!==Proxy.revocable&&"undefined"!=typeof Reflect,T=W?Symbol.for("immer-nothing"):((K={})["immer-nothing"]=!0,K),V=W?Symbol.for("immer-draftable"):"__$immer_draftable",X=W?Symbol.for("immer-state"):"__$immer_state",Z=("undefined"!=typeof Symbol&&Symbol.iterator,""+Object.prototype.constructor),q="undefined"!=typeof Reflect&&Reflect.ownKeys?Reflect.ownKeys:void 0!==Object.getOwnPropertySymbols?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:Object.getOwnPropertyNames,B=Object.getOwnPropertyDescriptors||function(t){var e={};return q(t).forEach((function(r){e[r]=Object.getOwnPropertyDescriptor(t,r)})),e},G={},H={get:function(t,e){if(e===X)return t;var r=p(t);if(!c(r,e))return function(t,e,r){var n,o=E(e,r);return o?"value"in o?o.value:null===(n=o.get)||void 0===n?void 0:n.call(t.k):void 0}(t,r,e);var n=r[e];return t.I||!i(n)?n:n===x(t.t,e)?(F(t),t.o[e]=N(t.A.h,n,t)):n},has:function(t,e){return e in p(t)},ownKeys:function(t){return Reflect.ownKeys(p(t))},set:function(t,e,r){var n=E(p(t),e);if(null==n?void 0:n.set)return n.set.call(t.k,r),!0;if(!t.P){var o=x(p(t),e),i=null==o?void 0:o[X];if(i&&i.t===r)return t.o[e]=r,t.R[e]=!1,!0;if(l(r,o)&&(void 0!==r||c(t.t,e)))return!0;F(t),_(t)}return t.o[e]===r&&(void 0!==r||e in t.o)||Number.isNaN(r)&&Number.isNaN(t.o[e])||(t.o[e]=r,t.R[e]=!0),!0},deleteProperty:function(t,e){return void 0!==x(t.t,e)||e in t.t?(t.R[e]=!1,F(t),_(t)):delete t.R[e],t.o&&delete t.o[e],!0},getOwnPropertyDescriptor:function(t,e){var r=p(t),n=Reflect.getOwnPropertyDescriptor(r,e);return n?{writable:!0,configurable:1!==t.i||"length"!==e,enumerable:n.enumerable,value:r[e]}:n},defineProperty:function(){n(11)},getPrototypeOf:function(t){return Object.getPrototypeOf(t.t)},setPrototypeOf:function(){n(12)}},L={};u(H,(function(t,e){L[t]=function(){return arguments[0]=arguments[0][0],e.apply(this,arguments)}})),L.deleteProperty=function(t,e){return L.set.call(this,t,e,void 0)},L.set=function(t,e,r){return H.set.call(this,t[0],e,r,t[0])};var Q=function(){function t(t){var e=this;this.g=J,this.D=!0,this.produce=function(t,r,o){if("function"==typeof t&&"function"!=typeof r){var u=r;r=t;var f=e;return function(t){var e=this;void 0===t&&(t=u);for(var n=arguments.length,o=Array(n>1?n-1:0),i=1;i<n;i++)o[i-1]=arguments[i];return f.produce(t,(function(t){var n;return(n=r).call.apply(n,[e,t].concat(o))}))}}var c;if("function"!=typeof r&&n(6),void 0!==o&&"function"!=typeof o&&n(7),i(t)){var a=w(e),l=N(e,t,void 0),s=!0;try{c=r(l),s=!1}finally{s?O(a):j(a)}return"undefined"!=typeof Promise&&c instanceof Promise?c.then((function(t){return m(a,o),S(t,a)}),(function(t){throw O(a),t})):(m(a,o),S(c,a))}if(!t||"object"!=typeof t){if(void 0===(c=r(t))&&(c=t),c===T&&(c=void 0),e.D&&h(c,!0),o){var v=[],p=[];g("Patches").M(t,c,v,p),o(v,p)}return c}n(21,t)},this.produceWithPatches=function(t,r){if("function"==typeof t)return function(r){for(var n=arguments.length,o=Array(n>1?n-1:0),i=1;i<n;i++)o[i-1]=arguments[i];return e.produceWithPatches(r,(function(e){return t.apply(void 0,[e].concat(o))}))};var n,o,i=e.produce(t,r,(function(t,e){n=t,o=e}));return"undefined"!=typeof Promise&&i instanceof Promise?i.then((function(t){return[t,n,o]})):[i,n,o]},"boolean"==typeof(null==t?void 0:t.useProxies)&&this.setUseProxies(t.useProxies),"boolean"==typeof(null==t?void 0:t.autoFreeze)&&this.setAutoFreeze(t.autoFreeze)}var e=t.prototype;return e.createDraft=function(t){i(t)||n(8),o(t)&&(t=I(t));var e=w(this),r=N(this,t,void 0);return r[X].C=!0,j(e),r},e.finishDraft=function(t,e){var r=(t&&t[X]).A;return m(r,e),S(void 0,r)},e.setAutoFreeze=function(t){this.D=t},e.setUseProxies=function(t){t&&!J&&n(20),this.g=t},e.applyPatches=function(t,e){var r;for(r=e.length-1;r>=0;r--){var n=e[r];if(0===n.path.length&&"replace"===n.op){t=n.value;break}}r>-1&&(e=e.slice(r+1));var i=g("Patches").$;return o(t)?i(t,e):this.produce(t,(function(t){return i(t,e)}))},t}(),Y=new Q,tt=Y.produce;Y.produceWithPatches.bind(Y),Y.setAutoFreeze.bind(Y),Y.setUseProxies.bind(Y),Y.applyPatches.bind(Y),Y.createDraft.bind(Y),Y.finishDraft.bind(Y);const et=tt}}]);