(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["716"],{24184:function(e,t,n){"use strict";var r,a,o,i;function u(){return(u=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e}).apply(this,arguments)}n.r(t),n.d(t,{Action:function(){return r},UNSAFE_getPathContributingMatches:function(){return x},UNSAFE_invariant:function(){return c},createHashHistory:function(){return s},createPath:function(){return d},isRouteErrorResponse:function(){return A},joinPaths:function(){return C},matchPath:function(){return b},matchRoutes:function(){return v},parsePath:function(){return m},resolveTo:function(){return R},stripBasename:function(){return E}}),(o=r||(r={})).Pop="POP",o.Push="PUSH",o.Replace="REPLACE";let l="popstate";function s(e){return void 0===e&&(e={}),function(e,t,n,a){void 0===a&&(a={});let{window:o=document.defaultView,v5Compat:i=!1}=a,s=o.history,h=r.Pop,m=null,v=g();function g(){return(s.state||{idx:null}).idx}function y(){h=r.Pop;let e=g(),t=null==e?null:e-v;v=e,m&&m({action:h,location:E.location,delta:t})}null==v&&(v=0,s.replaceState(u({},s.state,{idx:v}),""));function b(e){let t="null"!==o.location.origin?o.location.origin:o.location.href,n="string"==typeof e?e:d(e);return c(t,"No window.location.(origin|href) available to create URL for href: "+n),new URL(n,t)}let E={get action(){return h},get location(){return e(o,s)},listen(e){if(m)throw Error("A history only accepts one active listener");return o.addEventListener(l,y),m=e,()=>{o.removeEventListener(l,y),m=null}},createHref:e=>t(o,e),createURL:b,encodeLocation(e){let t=b(e);return{pathname:t.pathname,search:t.search,hash:t.hash}},push:function(e,t){h=r.Push;let a=f(E.location,e,t);n&&n(a,e);let u=p(a,v=g()+1),l=E.createHref(a);try{s.pushState(u,"",l)}catch(e){if(e instanceof DOMException&&"DataCloneError"===e.name)throw e;o.location.assign(l)}i&&m&&m({action:h,location:E.location,delta:1})},replace:function(e,t){h=r.Replace;let a=f(E.location,e,t);n&&n(a,e);let o=p(a,v=g()),u=E.createHref(a);s.replaceState(o,"",u),i&&m&&m({action:h,location:E.location,delta:0})},go:e=>s.go(e)};return E}(function(e,t){let{pathname:n="/",search:r="",hash:a=""}=m(e.location.hash.substr(1));return!n.startsWith("/")&&!n.startsWith(".")&&(n="/"+n),f("",{pathname:n,search:r,hash:a},t.state&&t.state.usr||null,t.state&&t.state.key||"default")},function(e,t){let n=e.document.querySelector("base"),r="";if(n&&n.getAttribute("href")){let t=e.location.href,n=t.indexOf("#");r=-1===n?t:t.slice(0,n)}return r+"#"+("string"==typeof t?t:d(t))},function(e,t){h("/"===e.pathname.charAt(0),"relative pathnames are not supported in hash history.push("+JSON.stringify(t)+")")},e)}function c(e,t){if(!1===e||null==e)throw Error(t)}function h(e,t){if(!e){"undefined"!=typeof console&&console.warn(t);try{throw Error(t)}catch(e){}}}function p(e,t){return{usr:e.state,key:e.key,idx:t}}function f(e,t,n,r){return void 0===n&&(n=null),u({pathname:"string"==typeof e?e:e.pathname,search:"",hash:""},"string"==typeof t?m(t):t,{state:n,key:t&&t.key||r||Math.random().toString(36).substr(2,8)})}function d(e){let{pathname:t="/",search:n="",hash:r=""}=e;return n&&"?"!==n&&(t+="?"===n.charAt(0)?n:"?"+n),r&&"#"!==r&&(t+="#"===r.charAt(0)?r:"#"+r),t}function m(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substr(n),e=e.substr(0,n));let r=e.indexOf("?");r>=0&&(t.search=e.substr(r),e=e.substr(0,r)),e&&(t.pathname=e)}return t}function v(e,t,n){void 0===n&&(n="/");let r=E(("string"==typeof t?m(t):t).pathname||"/",n);if(null==r)return null;let a=function e(t,n,r,a){void 0===n&&(n=[]),void 0===r&&(r=[]),void 0===a&&(a="");let o=(t,o,i)=>{let u={relativePath:void 0===i?t.path||"":i,caseSensitive:!0===t.caseSensitive,childrenIndex:o,route:t};u.relativePath.startsWith("/")&&(c(u.relativePath.startsWith(a),'Absolute route path "'+u.relativePath+'" nested under path '+('"'+a)+'" is not valid. An absolute child route path must start with the combined path of all its parent routes.'),u.relativePath=u.relativePath.slice(a.length));let l=C([a,u.relativePath]),s=r.concat(u);t.children&&t.children.length>0&&(c(!0!==t.index,'Index routes must not have child routes. Please remove all child routes from route path "'+l+'".'),e(t.children,n,s,l)),(null!=t.path||t.index)&&n.push({path:l,score:function(e,t){let n=e.split("/"),r=n.length;return n.some(y)&&(r+=-2),t&&(r+=2),n.filter(e=>!y(e)).reduce((e,t)=>e+(g.test(t)?3:""===t?1:10),r)}(l,t.index),routesMeta:s})};return t.forEach((e,t)=>{var n;if(""!==e.path&&null!=(n=e.path)&&n.includes("?"))for(let n of function e(t){let n=t.split("/");if(0===n.length)return[];let[r,...a]=n,o=r.endsWith("?"),i=r.replace(/\?$/,"");if(0===a.length)return o?[i,""]:[i];let u=e(a.join("/")),l=[];return l.push(...u.map(e=>""===e?i:[i,e].join("/"))),o&&l.push(...u),l.map(e=>t.startsWith("/")&&""===e?"/":e)}(e.path))o(e,t,n);else o(e,t)}),n}(e);(function(e){e.sort((e,t)=>e.score!==t.score?t.score-e.score:function(e,t){return e.length===t.length&&e.slice(0,-1).every((e,n)=>e===t[n])?e[e.length-1]-t[t.length-1]:0}(e.routesMeta.map(e=>e.childrenIndex),t.routesMeta.map(e=>e.childrenIndex)))})(a);let o=null;for(let e=0;null==o&&e<a.length;++e)o=function(e,t){let{routesMeta:n}=e,r={},a="/",o=[];for(let e=0;e<n.length;++e){let i=n[e],u=e===n.length-1,l="/"===a?t:t.slice(a.length)||"/",s=b({path:i.relativePath,caseSensitive:i.caseSensitive,end:u},l);if(!s)return null;Object.assign(r,s.params);let c=i.route;o.push({params:r,pathname:C([a,s.pathname]),pathnameBase:U(C([a,s.pathnameBase])),route:c}),"/"!==s.pathnameBase&&(a=C([a,s.pathnameBase]))}return o}(a[e],function(e){try{return decodeURI(e)}catch(t){return h(!1,'The URL path "'+e+'" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent '+("encoding ("+t)+")."),e}}(r));return o}(i=a||(a={})).data="data",i.deferred="deferred",i.redirect="redirect",i.error="error";let g=/^:\w+$/,y=e=>"*"===e;function b(e,t){"string"==typeof e&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=function(e,t,n){void 0===t&&(t=!1),void 0===n&&(n=!0),h("*"===e||!e.endsWith("*")||e.endsWith("/*"),'Route path "'+e+'" will be treated as if it were '+('"'+e.replace(/\*$/,"/*"))+'" because the `*` character must always follow a `/` in the pattern. To get rid of this warning, '+('please change the route path to "'+e.replace(/\*$/,"/*"))+'".');let r=[],a="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:(\w+)(\?)?/g,(e,t,n)=>(r.push({paramName:t,isOptional:null!=n}),n?"/?([^\\/]+)?":"/([^\\/]+)"));return e.endsWith("*")?(r.push({paramName:"*"}),a+="*"===e||"/*"===e?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?a+="\\/*$":""!==e&&"/"!==e&&(a+="(?:(?=\\/|$))"),[new RegExp(a,t?void 0:"i"),r]}(e.path,e.caseSensitive,e.end),a=t.match(n);if(!a)return null;let o=a[0],i=o.replace(/(.)\/+$/,"$1"),u=a.slice(1);return{params:r.reduce((e,t,n)=>{let{paramName:r,isOptional:a}=t;if("*"===r){let e=u[n]||"";i=o.slice(0,o.length-e.length).replace(/(.)\/+$/,"$1")}let l=u[n];return a&&!l?e[r]=void 0:e[r]=function(e,t){try{return decodeURIComponent(e)}catch(n){return h(!1,'The value for the URL param "'+t+'" will not be decoded because'+(' the string "'+e)+'" is a malformed URL segment. This is probably'+(" due to a bad percent encoding ("+n)+")."),e}}(l||"",r),e},{}),pathname:o,pathnameBase:i,pattern:e}}function E(e,t){if("/"===t)return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,r=e.charAt(n);return r&&"/"!==r?null:e.slice(n)||"/"}function S(e,t,n,r){return"Cannot include a '"+e+"' character in a manually specified "+("`to."+t+"` field ["+JSON.stringify(r))+"].  Please separate it out to the "+("`to."+n)+'` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.'}function x(e){return e.filter((e,t)=>0===t||e.route.path&&e.route.path.length>0)}function R(e,t,n,r){let a,o;void 0===r&&(r=!1),"string"==typeof e?a=m(e):(c(!(a=u({},e)).pathname||!a.pathname.includes("?"),S("?","pathname","search",a)),c(!a.pathname||!a.pathname.includes("#"),S("#","pathname","hash",a)),c(!a.search||!a.search.includes("#"),S("#","search","hash",a)));let i=""===e||""===a.pathname,l=i?"/":a.pathname;if(null==l)o=n;else if(r){let e=t[t.length-1].replace(/^\//,"").split("/");if(l.startsWith("..")){let t=l.split("/");for(;".."===t[0];)t.shift(),e.pop();a.pathname=t.join("/")}o="/"+e.join("/")}else{let e=t.length-1;if(l.startsWith("..")){let t=l.split("/");for(;".."===t[0];)t.shift(),e-=1;a.pathname=t.join("/")}o=e>=0?t[e]:"/"}let s=function(e,t){void 0===t&&(t="/");let{pathname:n,search:r="",hash:a=""}="string"==typeof e?m(e):e;return{pathname:n?n.startsWith("/")?n:function(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(e=>{".."===e?n.length>1&&n.pop():"."!==e&&n.push(e)}),n.length>1?n.join("/"):"/"}(n,t):t,search:w(r),hash:P(a)}}(a,o),h=l&&"/"!==l&&l.endsWith("/"),p=(i||"."===l)&&n.endsWith("/");return!s.pathname.endsWith("/")&&(h||p)&&(s.pathname+="/"),s}let C=e=>e.join("/").replace(/\/\/+/g,"/"),U=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),w=e=>e&&"?"!==e?e.startsWith("?")?e:"?"+e:"",P=e=>e&&"#"!==e?e.startsWith("#")?e:"#"+e:"";function A(e){return null!=e&&"number"==typeof e.status&&"string"==typeof e.statusText&&"boolean"==typeof e.internal&&"data"in e}Symbol("deferred")},82450:function(e,t,n){var r={utf8:{stringToBytes:function(e){return r.bin.stringToBytes(unescape(encodeURIComponent(e)))},bytesToString:function(e){return decodeURIComponent(escape(r.bin.bytesToString(e)))}},bin:{stringToBytes:function(e){for(var t=[],n=0;n<e.length;n++)t.push(255&e.charCodeAt(n));return t},bytesToString:function(e){for(var t=[],n=0;n<e.length;n++)t.push(String.fromCharCode(e[n]));return t.join("")}}};e.exports=r},27028:function(e,t,n){var r,a;r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",a={rotl:function(e,t){return e<<t|e>>>32-t},rotr:function(e,t){return e<<32-t|e>>>t},endian:function(e){if(e.constructor==Number)return 16711935&a.rotl(e,8)|4278255360&a.rotl(e,24);for(var t=0;t<e.length;t++)e[t]=a.endian(e[t]);return e},randomBytes:function(e){for(var t=[];e>0;e--)t.push(Math.floor(256*Math.random()));return t},bytesToWords:function(e){for(var t=[],n=0,r=0;n<e.length;n++,r+=8)t[r>>>5]|=e[n]<<24-r%32;return t},wordsToBytes:function(e){for(var t=[],n=0;n<32*e.length;n+=8)t.push(e[n>>>5]>>>24-n%32&255);return t},bytesToHex:function(e){for(var t=[],n=0;n<e.length;n++)t.push((e[n]>>>4).toString(16)),t.push((15&e[n]).toString(16));return t.join("")},hexToBytes:function(e){for(var t=[],n=0;n<e.length;n+=2)t.push(parseInt(e.substr(n,2),16));return t},bytesToBase64:function(e){for(var t=[],n=0;n<e.length;n+=3){for(var a=e[n]<<16|e[n+1]<<8|e[n+2],o=0;o<4;o++)8*n+6*o<=8*e.length?t.push(r.charAt(a>>>6*(3-o)&63)):t.push("=")}return t.join("")},base64ToBytes:function(e){e=e.replace(/[^A-Z0-9+\/]/ig,"");for(var t=[],n=0,a=0;n<e.length;a=++n%4)0!=a&&t.push((r.indexOf(e.charAt(n-1))&Math.pow(2,-2*a+8)-1)<<2*a|r.indexOf(e.charAt(n))>>>6-2*a);return t}},e.exports=a},18796:function(e,t,n){function r(e){return!!e.constructor&&"function"==typeof e.constructor.isBuffer&&e.constructor.isBuffer(e)}e.exports=function(e){return null!=e&&(r(e)||function(e){return"function"==typeof e.readFloatLE&&"function"==typeof e.slice&&r(e.slice(0,0))}(e)||!!e._isBuffer)}},80335:function(e,t,n){var r,a,o,i,u;r=n("27028"),a=n("82450").utf8,o=n("18796"),i=n("82450").bin,(u=function(e,t){e.constructor==String?e=t&&"binary"===t.encoding?i.stringToBytes(e):a.stringToBytes(e):o(e)?e=Array.prototype.slice.call(e,0):!Array.isArray(e)&&e.constructor!==Uint8Array&&(e=e.toString());for(var n=r.bytesToWords(e),l=8*e.length,s=1732584193,c=-271733879,h=-1732584194,p=271733878,f=0;f<n.length;f++)n[f]=(n[f]<<8|n[f]>>>24)&16711935|(n[f]<<24|n[f]>>>8)&4278255360;n[l>>>5]|=128<<l%32,n[(l+64>>>9<<4)+14]=l;for(var d=u._ff,m=u._gg,v=u._hh,g=u._ii,f=0;f<n.length;f+=16){var y=s,b=c,E=h,S=p;s=d(s,c,h,p,n[f+0],7,-680876936),p=d(p,s,c,h,n[f+1],12,-389564586),h=d(h,p,s,c,n[f+2],17,606105819),c=d(c,h,p,s,n[f+3],22,-1044525330),s=d(s,c,h,p,n[f+4],7,-176418897),p=d(p,s,c,h,n[f+5],12,1200080426),h=d(h,p,s,c,n[f+6],17,-1473231341),c=d(c,h,p,s,n[f+7],22,-45705983),s=d(s,c,h,p,n[f+8],7,1770035416),p=d(p,s,c,h,n[f+9],12,-1958414417),h=d(h,p,s,c,n[f+10],17,-42063),c=d(c,h,p,s,n[f+11],22,-1990404162),s=d(s,c,h,p,n[f+12],7,1804603682),p=d(p,s,c,h,n[f+13],12,-40341101),h=d(h,p,s,c,n[f+14],17,-1502002290),c=d(c,h,p,s,n[f+15],22,1236535329),s=m(s,c,h,p,n[f+1],5,-165796510),p=m(p,s,c,h,n[f+6],9,-1069501632),h=m(h,p,s,c,n[f+11],14,643717713),c=m(c,h,p,s,n[f+0],20,-373897302),s=m(s,c,h,p,n[f+5],5,-701558691),p=m(p,s,c,h,n[f+10],9,38016083),h=m(h,p,s,c,n[f+15],14,-660478335),c=m(c,h,p,s,n[f+4],20,-405537848),s=m(s,c,h,p,n[f+9],5,568446438),p=m(p,s,c,h,n[f+14],9,-1019803690),h=m(h,p,s,c,n[f+3],14,-187363961),c=m(c,h,p,s,n[f+8],20,1163531501),s=m(s,c,h,p,n[f+13],5,-1444681467),p=m(p,s,c,h,n[f+2],9,-51403784),h=m(h,p,s,c,n[f+7],14,1735328473),c=m(c,h,p,s,n[f+12],20,-1926607734),s=v(s,c,h,p,n[f+5],4,-378558),p=v(p,s,c,h,n[f+8],11,-2022574463),h=v(h,p,s,c,n[f+11],16,1839030562),c=v(c,h,p,s,n[f+14],23,-35309556),s=v(s,c,h,p,n[f+1],4,-1530992060),p=v(p,s,c,h,n[f+4],11,1272893353),h=v(h,p,s,c,n[f+7],16,-155497632),c=v(c,h,p,s,n[f+10],23,-1094730640),s=v(s,c,h,p,n[f+13],4,681279174),p=v(p,s,c,h,n[f+0],11,-358537222),h=v(h,p,s,c,n[f+3],16,-722521979),c=v(c,h,p,s,n[f+6],23,76029189),s=v(s,c,h,p,n[f+9],4,-640364487),p=v(p,s,c,h,n[f+12],11,-421815835),h=v(h,p,s,c,n[f+15],16,530742520),c=v(c,h,p,s,n[f+2],23,-995338651),s=g(s,c,h,p,n[f+0],6,-198630844),p=g(p,s,c,h,n[f+7],10,1126891415),h=g(h,p,s,c,n[f+14],15,-1416354905),c=g(c,h,p,s,n[f+5],21,-57434055),s=g(s,c,h,p,n[f+12],6,1700485571),p=g(p,s,c,h,n[f+3],10,-1894986606),h=g(h,p,s,c,n[f+10],15,-1051523),c=g(c,h,p,s,n[f+1],21,-2054922799),s=g(s,c,h,p,n[f+8],6,1873313359),p=g(p,s,c,h,n[f+15],10,-30611744),h=g(h,p,s,c,n[f+6],15,-1560198380),c=g(c,h,p,s,n[f+13],21,1309151649),s=g(s,c,h,p,n[f+4],6,-145523070),p=g(p,s,c,h,n[f+11],10,-1120210379),h=g(h,p,s,c,n[f+2],15,718787259),c=g(c,h,p,s,n[f+9],21,-343485551),s=s+y>>>0,c=c+b>>>0,h=h+E>>>0,p=p+S>>>0}return r.endian([s,c,h,p])})._ff=function(e,t,n,r,a,o,i){var u=e+(t&n|~t&r)+(a>>>0)+i;return(u<<o|u>>>32-o)+t},u._gg=function(e,t,n,r,a,o,i){var u=e+(t&r|n&~r)+(a>>>0)+i;return(u<<o|u>>>32-o)+t},u._hh=function(e,t,n,r,a,o,i){var u=e+(t^n^r)+(a>>>0)+i;return(u<<o|u>>>32-o)+t},u._ii=function(e,t,n,r,a,o,i){var u=e+(n^(t|~r))+(a>>>0)+i;return(u<<o|u>>>32-o)+t},u._blocksize=16,u._digestsize=16,e.exports=function(e,t){if(null==e)throw Error("Illegal argument "+e);var n=r.wordsToBytes(u(e,t));return t&&t.asBytes?n:t&&t.asString?i.bytesToString(n):r.bytesToHex(n)}},37654:function(e,t,n){"use strict";n.r(t),n.d(t,{Route:function(){return s.Route},Routes:function(){return s.Routes},HashRouter:function(){return x},Link:function(){return U}});var r,a,o,i,u=n("83169"),l=n("34675"),s=n("19212"),c=n("24184");function h(){return(h=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e}).apply(this,arguments)}function p(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],!(t.indexOf(n)>=0)&&(a[n]=e[n]);return a}let f="application/x-www-form-urlencoded";function d(e){return null!=e&&"string"==typeof e.tagName}let m=null,v=new Set(["application/x-www-form-urlencoded","multipart/form-data","text/plain"]);function g(e){return null==e||v.has(e)?e:null}let y=["onClick","relative","reloadDocument","replace","state","target","to","preventScrollReset","unstable_viewTransition"],b=["fetcherKey","navigate","reloadDocument","replace","state","method","action","onSubmit","relative","preventScrollReset","unstable_viewTransition"],E=u.createContext({isTransitioning:!1}),S=u.startTransition;function x(e){let{basename:t,children:n,future:r,window:a}=e,o=u.useRef();null==o.current&&(o.current=(0,c.createHashHistory)({window:a,v5Compat:!0}));let i=o.current,[l,h]=u.useState({action:i.action,location:i.location}),{v7_startTransition:p}=r||{},f=u.useCallback(e=>{p&&S?S(()=>h(e)):h(e)},[h,p]);return u.useLayoutEffect(()=>i.listen(f),[i,f]),u.createElement(s.Router,{basename:t,children:n,location:l.location,navigationType:l.action,navigator:i})}l.flushSync;let R="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement,C=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,U=u.forwardRef(function(e,t){let n,{onClick:r,relative:a,reloadDocument:o,replace:i,state:l,target:f,to:d,preventScrollReset:m,unstable_viewTransition:v}=e,g=p(e,y),{basename:b}=u.useContext(s.UNSAFE_NavigationContext),E=!1;if("string"==typeof d&&C.test(d)&&(n=d,R))try{let e=new URL(window.location.href),t=new URL(d.startsWith("//")?e.protocol+d:d),n=(0,c.stripBasename)(t.pathname,b);t.origin===e.origin&&null!=n?d=n+t.search+t.hash:E=!0}catch(e){}let S=(0,s.useHref)(d,{relative:a}),x=function(e,t){let{target:n,replace:r,state:a,preventScrollReset:o,relative:i,unstable_viewTransition:l}=void 0===t?{}:t,c=(0,s.useNavigate)(),h=(0,s.useLocation)(),p=(0,s.useResolvedPath)(e,{relative:i});return u.useCallback(t=>{var u,f,d;if(u=t,f=n,0===u.button&&(!f||"_self"===f)&&!((d=u).metaKey||d.altKey||d.ctrlKey||d.shiftKey))t.preventDefault(),c(e,{replace:void 0!==r?r:(0,s.createPath)(h)===(0,s.createPath)(p),state:a,preventScrollReset:o,relative:i,unstable_viewTransition:l})},[h,c,p,r,a,n,e,o,i,l])}(d,{replace:i,state:l,target:f,preventScrollReset:m,relative:a,unstable_viewTransition:v});return u.createElement("a",h({},g,{href:n||S,onClick:E||o?r:function(e){r&&r(e),!e.defaultPrevented&&x(e)},ref:t,target:f}))});function w(e){let t=u.useContext(s.UNSAFE_DataRouterContext);return t||(0,c.UNSAFE_invariant)(!1),t}(r=o||(o={})).UseScrollRestoration="useScrollRestoration",r.UseSubmit="useSubmit",r.UseSubmitFetcher="useSubmitFetcher",r.UseFetcher="useFetcher",r.useViewTransitionState="useViewTransitionState",(a=i||(i={})).UseFetcher="useFetcher",a.UseFetchers="useFetchers",a.UseScrollRestoration="useScrollRestoration";let P=0,A=()=>"__"+String(++P)+"__"},19212:function(e,t,n){"use strict";n.r(t),n.d(t,{createPath:function(){return u.createPath},Route:function(){return A},Router:function(){return N},Routes:function(){return _},UNSAFE_DataRouterContext:function(){return s},UNSAFE_DataRouterStateContext:function(){return c},UNSAFE_NavigationContext:function(){return h},UNSAFE_RouteContext:function(){return f},UNSAFE_useRouteId:function(){return P},useHref:function(){return m},useLocation:function(){return g},useNavigate:function(){return b},useResolvedPath:function(){return E}});var r,a,o,i=n("83169"),u=n("24184");function l(){return(l=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e}).apply(this,arguments)}let s=i.createContext(null),c=i.createContext(null),h=i.createContext(null),p=i.createContext(null),f=i.createContext({outlet:null,matches:[],isDataRoute:!1}),d=i.createContext(null);function m(e,t){let{relative:n}=void 0===t?{}:t;v()||(0,u.UNSAFE_invariant)(!1);let{basename:r,navigator:a}=i.useContext(h),{hash:o,pathname:l,search:s}=E(e,{relative:n}),c=l;return"/"!==r&&(c="/"===l?r:(0,u.joinPaths)([r,l])),a.createHref({pathname:c,search:s,hash:o})}function v(){return null!=i.useContext(p)}function g(){return v()||(0,u.UNSAFE_invariant)(!1),i.useContext(p).location}function y(e){!i.useContext(h).static&&i.useLayoutEffect(e)}function b(){let{isDataRoute:e}=i.useContext(f);return e?function(){var e;let t;let{router:n}=(e=C.UseNavigateStable,(t=i.useContext(s))||(0,u.UNSAFE_invariant)(!1),t),r=w(U.UseNavigateStable),a=i.useRef(!1);return y(()=>{a.current=!0}),i.useCallback(function(e,t){void 0===t&&(t={}),a.current&&("number"==typeof e?n.navigate(e):n.navigate(e,l({fromRouteId:r},t)))},[n,r])}():function(){v()||(0,u.UNSAFE_invariant)(!1);let e=i.useContext(s),{basename:t,navigator:n}=i.useContext(h),{matches:r}=i.useContext(f),{pathname:a}=g(),o=JSON.stringify((0,u.UNSAFE_getPathContributingMatches)(r).map(e=>e.pathnameBase)),l=i.useRef(!1);return y(()=>{l.current=!0}),i.useCallback(function(r,i){if(void 0===i&&(i={}),!l.current)return;if("number"==typeof r){n.go(r);return}let s=(0,u.resolveTo)(r,JSON.parse(o),a,"path"===i.relative);null==e&&"/"!==t&&(s.pathname="/"===s.pathname?t:(0,u.joinPaths)([t,s.pathname])),(i.replace?n.replace:n.push)(s,i.state,i)},[t,n,o,a,e])}()}function E(e,t){let{relative:n}=void 0===t?{}:t,{matches:r}=i.useContext(f),{pathname:a}=g(),o=JSON.stringify((0,u.UNSAFE_getPathContributingMatches)(r).map(e=>e.pathnameBase));return i.useMemo(()=>(0,u.resolveTo)(e,JSON.parse(o),a,"path"===n),[e,o,a,n])}let S=i.createElement(function(){let e=function(){var e,t;let n;let r=i.useContext(d);let a=(t=U.UseRouteError,(n=i.useContext(c))||(0,u.UNSAFE_invariant)(!1),n),o=w(U.UseRouteError);return r?r:null==(e=a.errors)?void 0:e[o]}(),t=(0,u.isRouteErrorResponse)(e)?e.status+" "+e.statusText:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null;return i.createElement(i.Fragment,null,i.createElement("h2",null,"Unexpected Application Error!"),i.createElement("h3",{style:{fontStyle:"italic"}},t),n?i.createElement("pre",{style:{padding:"0.5rem",backgroundColor:"rgba(200,200,200, 0.5)"}},n):null,null)},null);class x extends i.Component{constructor(e){super(e),this.state={location:e.location,revalidation:e.revalidation,error:e.error}}static getDerivedStateFromError(e){return{error:e}}static getDerivedStateFromProps(e,t){return t.location!==e.location||"idle"!==t.revalidation&&"idle"===e.revalidation?{error:e.error,location:e.location,revalidation:e.revalidation}:{error:e.error||t.error,location:t.location,revalidation:e.revalidation||t.revalidation}}componentDidCatch(e,t){console.error("React Router caught the following error during render",e,t)}render(){return this.state.error?i.createElement(f.Provider,{value:this.props.routeContext},i.createElement(d.Provider,{value:this.state.error,children:this.props.component})):this.props.children}}function R(e){let{routeContext:t,match:n,children:r}=e,a=i.useContext(s);return a&&a.static&&a.staticContext&&(n.route.errorElement||n.route.ErrorBoundary)&&(a.staticContext._deepestRenderedBoundaryId=n.route.id),i.createElement(f.Provider,{value:t},r)}var C=((r=C||{}).UseBlocker="useBlocker",r.UseRevalidator="useRevalidator",r.UseNavigateStable="useNavigate",r);var U=((a=U||{}).UseBlocker="useBlocker",a.UseLoaderData="useLoaderData",a.UseActionData="useActionData",a.UseRouteError="useRouteError",a.UseNavigation="useNavigation",a.UseRouteLoaderData="useRouteLoaderData",a.UseMatches="useMatches",a.UseRevalidator="useRevalidator",a.UseNavigateStable="useNavigate",a.UseRouteId="useRouteId",a);function w(e){var t;let n;let r=(t=0,(n=i.useContext(f))||(0,u.UNSAFE_invariant)(!1),n),a=r.matches[r.matches.length-1];return a.route.id||(0,u.UNSAFE_invariant)(!1),a.route.id}function P(){return w(U.UseRouteId)}function A(e){(0,u.UNSAFE_invariant)(!1)}function N(e){let{basename:t="/",children:n=null,location:r,navigationType:a=u.Action.Pop,navigator:o,static:l=!1}=e;v()&&(0,u.UNSAFE_invariant)(!1);let s=t.replace(/^\/*/,"/"),c=i.useMemo(()=>({basename:s,navigator:o,static:l}),[s,o,l]);"string"==typeof r&&(r=(0,u.parsePath)(r));let{pathname:f="/",search:d="",hash:m="",state:g=null,key:y="default"}=r,b=i.useMemo(()=>{let e=(0,u.stripBasename)(f,s);return null==e?null:{location:{pathname:e,search:d,hash:m,state:g,key:y},navigationType:a}},[s,f,d,m,g,y,a]);return null==b?null:i.createElement(h.Provider,{value:c},i.createElement(p.Provider,{children:n,value:b}))}function _(e){var t;let{children:n,location:r}=e;return t=function e(t,n){void 0===n&&(n=[]);let r=[];return i.Children.forEach(t,(t,a)=>{if(!i.isValidElement(t))return;let o=[...n,a];if(t.type===i.Fragment){r.push.apply(r,e(t.props.children,o));return}t.type!==A&&(0,u.UNSAFE_invariant)(!1),!t.props.index||!t.props.children||(0,u.UNSAFE_invariant)(!1);let l={id:t.props.id||o.join("-"),caseSensitive:t.props.caseSensitive,element:t.props.element,Component:t.props.Component,index:t.props.index,path:t.props.path,loader:t.props.loader,action:t.props.action,errorElement:t.props.errorElement,ErrorBoundary:t.props.ErrorBoundary,hasErrorBoundary:null!=t.props.ErrorBoundary||null!=t.props.errorElement,shouldRevalidate:t.props.shouldRevalidate,handle:t.props.handle,lazy:t.props.lazy};t.props.children&&(l.children=e(t.props.children,o)),r.push(l)}),r}(n),function(e,t,n){let r;v()||(0,u.UNSAFE_invariant)(!1);let{navigator:a}=i.useContext(h),{matches:o}=i.useContext(f),s=o[o.length-1],c=s?s.params:{};s&&s.pathname;let d=s?s.pathnameBase:"/";s&&s.route;let m=g();if(t){var y;let e="string"==typeof t?(0,u.parsePath)(t):t;"/"===d||(null==(y=e.pathname)?void 0:y.startsWith(d))||(0,u.UNSAFE_invariant)(!1),r=e}else r=m;let b=r.pathname||"/",E="/"===d?b:b.slice(d.length)||"/",C=(0,u.matchRoutes)(e,{pathname:E}),U=function(e,t,n){var r,a;if(void 0===t&&(t=[]),void 0===n&&(n=null),null==e){if(null==(a=n)||!a.errors)return null;e=n.matches}let o=e,l=null==(r=n)?void 0:r.errors;if(null!=l){let e=o.findIndex(e=>e.route.id&&(null==l?void 0:l[e.route.id]));e>=0||(0,u.UNSAFE_invariant)(!1),o=o.slice(0,Math.min(o.length,e+1))}return o.reduceRight((e,r,a)=>{let u=r.route.id?null==l?void 0:l[r.route.id]:null,s=null;n&&(s=r.route.errorElement||S);let c=t.concat(o.slice(0,a+1)),h=()=>{let t;return t=u?s:r.route.Component?i.createElement(r.route.Component,null):r.route.element?r.route.element:e,i.createElement(R,{match:r,routeContext:{outlet:e,matches:c,isDataRoute:null!=n},children:t})};return n&&(r.route.ErrorBoundary||r.route.errorElement||0===a)?i.createElement(x,{location:n.location,revalidation:n.revalidation,component:s,error:u,children:h(),routeContext:{outlet:null,matches:c,isDataRoute:!0}}):h()},null)}(C&&C.map(e=>Object.assign({},e,{params:Object.assign({},c,e.params),pathname:(0,u.joinPaths)([d,a.encodeLocation?a.encodeLocation(e.pathname).pathname:e.pathname]),pathnameBase:"/"===e.pathnameBase?d:(0,u.joinPaths)([d,a.encodeLocation?a.encodeLocation(e.pathnameBase).pathname:e.pathnameBase])})),o,n);return t&&U?i.createElement(p.Provider,{value:{location:l({pathname:"/",search:"",hash:"",state:null,key:"default"},r),navigationType:u.Action.Pop}},U):U}(t,r)}i.startTransition;var B=((o=B||{})[o.pending=0]="pending",o[o.success=1]="success",o[o.error=2]="error",o);new Promise(()=>{})}}]);