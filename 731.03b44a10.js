"use strict";(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([[731],{8731:(e,t,i)=>{i.d(t,{Z:()=>d});var l=i(5893),a=i(245),o=i(195),n=i(5697),s=i.n(n),r=i(7294);function d(e){var t;const[i]=(0,r.useState)(e.initial),n=null!==(t=e.wideN)&&void 0!==t?t:32;let s=[],d={};for(let e=4;e<17;e++){const t=(e-4)/13*75;s=[...s,{value:t,raw:e}],d[`r ${t}`]=e,d[`s ${e}`]=t}s=[...s,{value:100,raw:n}],d["r 100"]=n,d[`s ${n}`]=100;const c=e=>d[`r ${e}`];return(0,l.jsxs)("div",{className:"kana-slider",children:[(0,l.jsx)(a.Z,{id:"discrete-slider-restrict",gutterBottom:!0,children:"Difficulty"}),(0,l.jsx)(o.ZP,{defaultValue:(u=i,d[`s ${u}`]),valueLabelFormat:c,getAriaValueText:e=>String(c(e)),"aria-labelledby":"discrete-slider-restrict",step:null,valueLabelDisplay:"auto",marks:s,onChangeCommitted:(t,i)=>{"number"==typeof i&&(t=>{const i=e.initial,l=c(t);l!==n&&i!==n&&l!==i||l!==n&&i===n&&l!==i?(e.setChoiceN(l),!0===e.wideMode&&"function"==typeof e.toggleWide&&e.toggleWide()):l===n&&l!==i&&(e.setChoiceN(l),!1===e.wideMode&&"function"==typeof e.toggleWide&&e.toggleWide())})(i)}})]});var u}d.propTypes={initial:s().number,wideMode:s().bool,setChoiceN:s().func,toggleWide:s().func}}}]);