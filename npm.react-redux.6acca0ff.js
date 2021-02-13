/*! For license information please see npm.react-redux.6acca0ff.js.LICENSE.txt */
(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[794],{7703:(e,n,r)=>{"use strict";r.d(n,{zt:()=>c,$j:()=>H});var t=r(7294),o=(r(5697),t.createContext(null)),u=function(e){e()},a=function(){return u},i={notify:function(){}},s=function(){function e(e,n){this.store=e,this.parentSub=n,this.unsubscribe=null,this.listeners=i,this.handleChangeWrapper=this.handleChangeWrapper.bind(this)}var n=e.prototype;return n.addNestedSub=function(e){return this.trySubscribe(),this.listeners.subscribe(e)},n.notifyNestedSubs=function(){this.listeners.notify()},n.handleChangeWrapper=function(){this.onStateChange&&this.onStateChange()},n.isSubscribed=function(){return Boolean(this.unsubscribe)},n.trySubscribe=function(){this.unsubscribe||(this.unsubscribe=this.parentSub?this.parentSub.addNestedSub(this.handleChangeWrapper):this.store.subscribe(this.handleChangeWrapper),this.listeners=function(){var e=a(),n=null,r=null;return{clear:function(){n=null,r=null},notify:function(){e((function(){for(var e=n;e;)e.callback(),e=e.next}))},get:function(){for(var e=[],r=n;r;)e.push(r),r=r.next;return e},subscribe:function(e){var t=!0,o=r={callback:e,next:null,prev:r};return o.prev?o.prev.next=o:n=o,function(){t&&null!==n&&(t=!1,o.next?o.next.prev=o.prev:r=o.prev,o.prev?o.prev.next=o.next:n=o.next)}}}}())},n.tryUnsubscribe=function(){this.unsubscribe&&(this.unsubscribe(),this.unsubscribe=null,this.listeners.clear(),this.listeners=i)},e}();const c=function(e){var n=e.store,r=e.context,u=e.children,a=(0,t.useMemo)((function(){var e=new s(n);return e.onStateChange=e.notifyNestedSubs,{store:n,subscription:e}}),[n]),i=(0,t.useMemo)((function(){return n.getState()}),[n]);(0,t.useEffect)((function(){var e=a.subscription;return e.trySubscribe(),i!==n.getState()&&e.notifyNestedSubs(),function(){e.tryUnsubscribe(),e.onStateChange=null}}),[a,i]);var c=r||o;return t.createElement(c.Provider,{value:a},u)};var f=r(2122),p=r(9756),l=r(8679),d=r.n(l),m=r(2973),v="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement?t.useLayoutEffect:t.useEffect,b=[],h=[null,null];function y(e,n){var r=e[1];return[n.payload,r+1]}function S(e,n,r){v((function(){return e.apply(void 0,n)}),r)}function P(e,n,r,t,o,u,a){e.current=t,n.current=o,r.current=!1,u.current&&(u.current=null,a())}function w(e,n,r,t,o,u,a,i,s,c){if(e){var f=!1,p=null,l=function(){if(!f){var e,r,l=n.getState();try{e=t(l,o.current)}catch(e){r=e,p=e}r||(p=null),e===u.current?a.current||s():(u.current=e,i.current=e,a.current=!0,c({type:"STORE_UPDATED",payload:{error:r}}))}};return r.onStateChange=l,r.trySubscribe(),l(),function(){if(f=!0,r.tryUnsubscribe(),r.onStateChange=null,p)throw p}}}var g=function(){return[null,0]};function C(e,n){void 0===n&&(n={});var r=n,u=r.getDisplayName,a=void 0===u?function(e){return"ConnectAdvanced("+e+")"}:u,i=r.methodName,c=void 0===i?"connectAdvanced":i,l=r.renderCountProp,v=void 0===l?void 0:l,C=r.shouldHandleStateChanges,O=void 0===C||C,E=r.storeKey,M=void 0===E?"store":E,x=(r.withRef,r.forwardRef),N=void 0!==x&&x,R=r.context,T=void 0===R?o:R,q=(0,p.Z)(r,["getDisplayName","methodName","renderCountProp","shouldHandleStateChanges","storeKey","withRef","forwardRef","context"]),D=T;return function(n){var r=n.displayName||n.name||"Component",o=a(r),u=(0,f.Z)({},q,{getDisplayName:a,methodName:c,renderCountProp:v,shouldHandleStateChanges:O,storeKey:M,displayName:o,wrappedComponentName:r,WrappedComponent:n}),i=q.pure,l=i?t.useMemo:function(e){return e()};function C(r){var o=(0,t.useMemo)((function(){var e=r.reactReduxForwardedRef,n=(0,p.Z)(r,["reactReduxForwardedRef"]);return[r.context,e,n]}),[r]),a=o[0],i=o[1],c=o[2],d=(0,t.useMemo)((function(){return a&&a.Consumer&&(0,m.isContextConsumer)(t.createElement(a.Consumer,null))?a:D}),[a,D]),v=(0,t.useContext)(d),C=Boolean(r.store)&&Boolean(r.store.getState)&&Boolean(r.store.dispatch);Boolean(v)&&Boolean(v.store);var E=C?r.store:v.store,M=(0,t.useMemo)((function(){return function(n){return e(n.dispatch,u)}(E)}),[E]),x=(0,t.useMemo)((function(){if(!O)return h;var e=new s(E,C?null:v.subscription),n=e.notifyNestedSubs.bind(e);return[e,n]}),[E,C,v]),N=x[0],R=x[1],T=(0,t.useMemo)((function(){return C?v:(0,f.Z)({},v,{subscription:N})}),[C,v,N]),q=(0,t.useReducer)(y,b,g),Z=q[0][0],k=q[1];if(Z&&Z.error)throw Z.error;var j=(0,t.useRef)(),B=(0,t.useRef)(c),W=(0,t.useRef)(),F=(0,t.useRef)(!1),_=l((function(){return W.current&&c===B.current?W.current:M(E.getState(),c)}),[E,Z,c]);S(P,[B,j,F,c,_,W,R]),S(w,[O,E,N,M,B,j,F,W,R,k],[E,N,M]);var H=(0,t.useMemo)((function(){return t.createElement(n,(0,f.Z)({},_,{ref:i}))}),[i,n,_]);return(0,t.useMemo)((function(){return O?t.createElement(d.Provider,{value:T},H):H}),[d,H,T])}var E=i?t.memo(C):C;if(E.WrappedComponent=n,E.displayName=o,N){var x=t.forwardRef((function(e,n){return t.createElement(E,(0,f.Z)({},e,{reactReduxForwardedRef:n}))}));return x.displayName=o,x.WrappedComponent=n,d()(x,n)}return d()(E,n)}}function O(e,n){return e===n?0!==e||0!==n||1/e==1/n:e!=e&&n!=n}function E(e,n){if(O(e,n))return!0;if("object"!=typeof e||null===e||"object"!=typeof n||null===n)return!1;var r=Object.keys(e),t=Object.keys(n);if(r.length!==t.length)return!1;for(var o=0;o<r.length;o++)if(!Object.prototype.hasOwnProperty.call(n,r[o])||!O(e[r[o]],n[r[o]]))return!1;return!0}var M=r(4890);function x(e){return function(n,r){var t=e(n,r);function o(){return t}return o.dependsOnOwnProps=!1,o}}function N(e){return null!==e.dependsOnOwnProps&&void 0!==e.dependsOnOwnProps?Boolean(e.dependsOnOwnProps):1!==e.length}function R(e,n){return function(n,r){r.displayName;var t=function(e,n){return t.dependsOnOwnProps?t.mapToProps(e,n):t.mapToProps(e)};return t.dependsOnOwnProps=!0,t.mapToProps=function(n,r){t.mapToProps=e,t.dependsOnOwnProps=N(e);var o=t(n,r);return"function"==typeof o&&(t.mapToProps=o,t.dependsOnOwnProps=N(o),o=t(n,r)),o},t}}const T=[function(e){return"function"==typeof e?R(e):void 0},function(e){return e?void 0:x((function(e){return{dispatch:e}}))},function(e){return e&&"object"==typeof e?x((function(n){return(0,M.DE)(e,n)})):void 0}],q=[function(e){return"function"==typeof e?R(e):void 0},function(e){return e?void 0:x((function(){return{}}))}];function D(e,n,r){return(0,f.Z)({},r,e,n)}const Z=[function(e){return"function"==typeof e?function(e){return function(n,r){r.displayName;var t,o=r.pure,u=r.areMergedPropsEqual,a=!1;return function(n,r,i){var s=e(n,r,i);return a?o&&u(s,t)||(t=s):(a=!0,t=s),t}}}(e):void 0},function(e){return e?void 0:function(){return D}}];function k(e,n,r,t){return function(o,u){return r(e(o,u),n(t,u),u)}}function j(e,n,r,t,o){var u,a,i,s,c,f=o.areStatesEqual,p=o.areOwnPropsEqual,l=o.areStatePropsEqual,d=!1;return function(o,m){return d?function(o,d){var m,v,b=!p(d,a),h=!f(o,u);return u=o,a=d,b&&h?(i=e(u,a),n.dependsOnOwnProps&&(s=n(t,a)),c=r(i,s,a)):b?(e.dependsOnOwnProps&&(i=e(u,a)),n.dependsOnOwnProps&&(s=n(t,a)),c=r(i,s,a)):h?(m=e(u,a),v=!l(m,i),i=m,v&&(c=r(i,s,a)),c):c}(o,m):(i=e(u=o,a=m),s=n(t,a),c=r(i,s,a),d=!0,c)}}function B(e,n){var r=n.initMapStateToProps,t=n.initMapDispatchToProps,o=n.initMergeProps,u=(0,p.Z)(n,["initMapStateToProps","initMapDispatchToProps","initMergeProps"]),a=r(e,u),i=t(e,u),s=o(e,u);return(u.pure?j:k)(a,i,s,e,u)}function W(e,n,r){for(var t=n.length-1;t>=0;t--){var o=n[t](e);if(o)return o}return function(n,t){throw new Error("Invalid value of type "+typeof e+" for "+r+" argument when connecting component "+t.wrappedComponentName+".")}}function F(e,n){return e===n}function _(e){var n=void 0===e?{}:e,r=n.connectHOC,t=void 0===r?C:r,o=n.mapStateToPropsFactories,u=void 0===o?q:o,a=n.mapDispatchToPropsFactories,i=void 0===a?T:a,s=n.mergePropsFactories,c=void 0===s?Z:s,l=n.selectorFactory,d=void 0===l?B:l;return function(e,n,r,o){void 0===o&&(o={});var a=o,s=a.pure,l=void 0===s||s,m=a.areStatesEqual,v=void 0===m?F:m,b=a.areOwnPropsEqual,h=void 0===b?E:b,y=a.areStatePropsEqual,S=void 0===y?E:y,P=a.areMergedPropsEqual,w=void 0===P?E:P,g=(0,p.Z)(a,["pure","areStatesEqual","areOwnPropsEqual","areStatePropsEqual","areMergedPropsEqual"]),C=W(e,u,"mapStateToProps"),O=W(n,i,"mapDispatchToProps"),M=W(r,c,"mergeProps");return t(d,(0,f.Z)({methodName:"connect",getDisplayName:function(e){return"Connect("+e+")"},shouldHandleStateChanges:Boolean(e),initMapStateToProps:C,initMapDispatchToProps:O,initMergeProps:M,pure:l,areStatesEqual:v,areOwnPropsEqual:h,areStatePropsEqual:S,areMergedPropsEqual:w},g))}}const H=_();var U;U=r(3935).unstable_batchedUpdates,u=U},8359:(e,n)=>{"use strict";var r="function"==typeof Symbol&&Symbol.for,t=r?Symbol.for("react.element"):60103,o=r?Symbol.for("react.portal"):60106,u=r?Symbol.for("react.fragment"):60107,a=r?Symbol.for("react.strict_mode"):60108,i=r?Symbol.for("react.profiler"):60114,s=r?Symbol.for("react.provider"):60109,c=r?Symbol.for("react.context"):60110,f=r?Symbol.for("react.async_mode"):60111,p=r?Symbol.for("react.concurrent_mode"):60111,l=r?Symbol.for("react.forward_ref"):60112,d=r?Symbol.for("react.suspense"):60113,m=(r&&Symbol.for("react.suspense_list"),r?Symbol.for("react.memo"):60115),v=r?Symbol.for("react.lazy"):60116;r&&Symbol.for("react.block"),r&&Symbol.for("react.fundamental"),r&&Symbol.for("react.responder"),r&&Symbol.for("react.scope");function b(e){if("object"==typeof e&&null!==e){var n=e.$$typeof;switch(n){case t:switch(e=e.type){case f:case p:case u:case i:case a:case d:return e;default:switch(e=e&&e.$$typeof){case c:case l:case v:case m:case s:return e;default:return n}}case o:return n}}}n.isContextConsumer=function(e){return b(e)===c}},2973:(e,n,r)=>{"use strict";e.exports=r(8359)}}]);