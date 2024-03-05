(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["68"],{95595:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return C}});var s=a("10327"),n=a("58093"),r=a("22707"),i=a("78615"),l=a("49620"),o=a.n(l),c=a("83169"),u=a("40432"),d=a("37654"),h=a("28733"),m=a("3252"),v=a("80130"),f=a("43398"),p=a("17310"),b=a("10776"),x=a("480"),S=a("60437"),g=a("22839"),j=a("68130"),w=a("9871"),y=a("16332"),k=a("34616"),D=a("38354"),N=a("72530"),E=a("40665"),L=a("87177"),T=a("84193"),P=a("93781");function C(){let e=(0,u.useDispatch)(),{cookies:t,debug:a,localServiceURL:l,lastImport:C}=(0,j.useConnectSetting)(),[O,I]=(0,c.useState)(!1),[R,B]=(0,c.useState)(!1),[M,V]=(0,c.useState)(!1),[A,U]=(0,c.useState)(!1),[z,F]=(0,c.useState)(!1),[J,K]=(0,c.useState)(!1),H=(0,c.useCallback)(()=>{if(!confirm("User edited datasets will be overwritten"))return;let t=(0,h.getExternalSourceType)(l);t===h.ExternalSourceType.Unset?e((0,w.setLocalDataEdited)(!1)):e((0,w.setLocalDataEdited)(!0)),e((0,L.importDatasets)()).unwrap().then(t=>Promise.all(t.map(t=>{let{data:a,hash:s}=(0,r.sheetDataToJSON)(t),n=t.name.toLowerCase();return e((0,T.setVersion)({name:n,hash:s})),(0,g.swMessageSaveDataJSON)(v.dataServiceEndpoint+"/"+n+".json.v"+s,a,s).then(()=>t)})).then(t=>((0,f.openIDB)().then(e=>(0,f.putIDBItem)({db:e,store:f.IDBStores.WORKBOOK},{key:"0",workbook:t})),e((0,T.setSwVersions)())))).then(()=>{e((0,P.clearVocabulary)()),e((0,N.clearPhrases)()),e((0,y.clearKanji)()),e((0,D.clearParticleGame)()),e((0,k.clearOpposites)()),V(!0),e((0,w.setLastImport)(`${["Reset","Local","GitHub"][t]}: ${new Date().toJSON()}`))})},[e,l]),W=(0,c.useCallback)(()=>{if(!confirm("Back up:\n - Datasets\n - Settings\n\nto local service?"))return;let t=new Promise((t,a)=>{let s;try{s=(0,S.getLocalStorageSettings)(p.localStorageKey)}catch(t){e((0,w.logger)("Failed settings backup",E.DebugLevel.ERROR))}if(!s){t();return}(0,L.saveSettingsLocalService)(s,l).then(()=>t).catch(()=>a)}),a=e((0,L.getDatasets)()).unwrap().then(e=>e.map(e=>(0,L.saveSheetLocalService)({getData:()=>[e]},l))).then(e=>Promise.all(e));Promise.all([t,a]).then(()=>{U(!0)})},[e,l]),G=(0,c.useCallback)(e=>{I(e)},[]),q=(0,c.useCallback)(e=>{B(e),!e&&(V(null),U(null))},[]);return(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"mt-3 mb-1"}),(0,s.jsxs)("div",{className:"d-flex flex-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1 mb-2 me-sm-2"}),(0,s.jsx)("div",{className:"column-2",children:(0,s.jsxs)("div",{className:"ps-2 d-flex flex-column align-items-end",children:[(0,s.jsx)("div",{className:"setting-block mb-2",children:(0,s.jsx)(m.default,{disabled:!t,active:a>E.DebugLevel.OFF,action:(0,b.buildAction)(e,w.debugToggled),color:"default",statusText:(0,x.labelOptions)(a,["Debug","Debug Error","Debug Warn","Debug"])})}),(0,s.jsxs)("div",{className:o({"d-flex justify-content-end mb-2":!0,"disabled-color":J}),children:[(0,s.jsx)("p",{id:"hard-refresh",className:o({"text-right":!0,"disabled-color":!t}),children:"Hard Refresh"}),(0,s.jsx)("div",{className:o({"spin-a-bit":z,"disabled-color":!t,clickable:t}),style:{height:"24px"},"aria-labelledby":"hard-refresh",onClick:t?()=>{F(!0),K(!1),setTimeout(()=>{z&&(F(!1),K(!0))},3e3),(0,g.swMessageDoHardRefresh)()}:void 0,children:(0,s.jsx)(i.SyncIcon,{size:24,"aria-label":"Hard Refresh"})})]})," "]})})]}),(0,s.jsx)("h3",{className:"mt-3 mb-1 fw-light",children:"External Data Source"}),(0,s.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:[(0,s.jsx)("div",{className:"column-1 mb-2 me-sm-2",children:(0,s.jsx)("div",{className:"mt-2 mb-2",children:[(0,s.jsx)("div",{children:"Recent import history:"},"label"),...C.map(e=>(0,s.jsx)("div",{className:"pt-1",children:e},e))]})}),(0,s.jsxs)("div",{className:"column-2",children:[(0,s.jsx)("div",{className:"mb-2",children:(0,s.jsx)(h.default,{onChangeInput:G,onChangeTrust:q})}),(0,s.jsxs)("div",{className:"d-flex justify-content-center",children:[(0,s.jsx)("div",{className:"px-1",children:(0,s.jsxs)(n.Button,{"aria-label":"Import Datasets",variant:"outlined",size:"small",disabled:O||""===l||!0!==R||!0===M,onClick:H,children:[M?(0,s.jsx)(i.CheckCircleIcon,{size:"small",className:"pe-1"}):(0,s.jsx)(i.DownloadIcon,{size:"small",className:"pe-1"}),"Import"]})}),(0,s.jsx)("div",{className:"px-1",children:(0,s.jsx)(n.Button,{"aria-label":"Edit Datasets",variant:"contained",size:"small",disabled:O||""===l||!R,children:(0,s.jsxs)(d.Link,{to:"/sheet",className:"text-decoration-none",children:["Edit ",(0,s.jsx)(i.UndoIcon,{})]})})}),(0,s.jsx)("div",{className:"px-1",children:(0,s.jsxs)(n.Button,{"aria-label":"Backup Datasets",variant:"outlined",size:"small",disabled:(0,h.getExternalSourceType)(l)!==h.ExternalSourceType.LocalService||O||""===l||!0!==R||!0===A,onClick:W,children:[A?(0,s.jsx)(i.CheckCircleIcon,{size:"small",className:"pe-1"}):(0,s.jsx)(i.UploadIcon,{size:"small",className:"pe-1"}),"Backup"]})})]})]})]})]})}},285:function(e,t,a){"use strict";a.r(t),a.d(t,{getActiveSheet:function(){return n},removeLastRowIfBlank:function(){return r},sheetAddExtraRow:function(){return i},searchInSheet:function(){return l},touchScreenCheck:function(){return o}});var s=a("88134");function n(e){let t=e.getData();if(1===t.length){let e=t[0].name,a=r(t[0]);return{activeSheetName:e,activeSheetData:a}}let a=e.bottombar.activeEl.el.innerHTML,s=t.find(e=>e.name===a)??t[0],n=r(s);return{activeSheetName:a,activeSheetData:n}}function r(e){let t=e.rows;if(!e.rows||!t)return e;let a={...e,rows:t},n=(0,s.getLastCellIdx)(e.rows);for(;Object.values(e.rows[n].cells).every(e=>void 0===e.text||0===e.text.length||""===e.text.trim());)delete a.rows[n],a.rows.len-=1,n=(0,s.getLastCellIdx)(a.rows);return a}function i(e){let t=e.rows;if(!t)return{rows:{0:{cells:{}}},len:1};let a=(0,s.getLastCellIdx)(t),n={...e,rows:{...t,[String(a+1)]:{cells:{}},len:t.len+1}};return n}function l(e,t){if(!e.rows)return[];let a=Object.values(e.rows).reduce((e,a,s)=>{if("number"!=typeof a&&"cells"in a){let n=Object.keys(a.cells).find(e=>a.cells[Number(e)].text?.toLowerCase().includes(t.toLowerCase()));if(void 0===n)return e;let r=a.cells[Number(n)].text;if(void 0===r)return e;let i=Number(n);e=[...e,[s,i,r]]}return e},[]);return a}function o(){let e=!1;if("maxTouchPoints"in navigator&&"number"==typeof navigator.maxTouchPoints)e=navigator.maxTouchPoints>0;else if("msMaxTouchPoints"in navigator&&"number"==typeof navigator.msMaxTouchPoints)e=navigator.msMaxTouchPoints>0;else{let t=matchMedia?.("(pointer:coarse)");if(t?.media==="(pointer:coarse)")e=!!t.matches;else if("orientation"in window)e=!0;else{let t=navigator.userAgent;e=/\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(t)||/\b(Android|Windows Phone|iPad|iPod)\b/i.test(t)}}return e}},87177:function(e,t,a){"use strict";a.r(t),a.d(t,{importDatasets:function(){return x},getDatasets:function(){return g},saveSheetLocalService:function(){return j},saveSettingsLocalService:function(){return w},saveSheetServiceWorker:function(){return y}});var s=a("89780"),n=a("22707"),r=a("88134"),i=a("71387"),l=a("9871"),o=a("16332"),c=a("72530");a("40665");var u=a("93781"),d=a("80130"),h=a("28733"),m=a("17310"),v=a("22839"),f=a("285");class p extends EventTarget{line(e){this.dispatchEvent(new CustomEvent("line",{detail:e}))}close(e){this.dispatchEvent(new CustomEvent("close",{detail:e}))}on(e,t){let a=e=>{if("detail"in e&&"string"==typeof e.detail){let{detail:a}=e;return t(a)}return t("")};switch(e){case"line":this.addEventListener("line",a);break;case"close":this.addEventListener("close",a)}}}function b(e,t){let a=t.slice(0,t.indexOf("."));return fetch(e+t).then(e=>{if(!e.ok)throw Error("bad response?");return e.text()}).then(e=>{let t=new p;t.addEventListener("line",()=>{});let n=(0,s.csvToObject)(t,a),r=e.includes("\r\n")?"\r\n":"\n";return e.split(r).forEach(e=>{t.line(e)}),t.close(),n})}let x=(0,i.createAsyncThunk)("sheet/importDatasets",async(e,t)=>{let a;let s=t.getState(),{localServiceURL:n}=s.global,r=(0,h.getExternalSourceType)(s.global.localServiceURL),i=s.global.localServiceURL;switch(r){case h.ExternalSourceType.GitHubUserContent:a=Promise.all([b(i+"/","Phrases.csv"),b(i+"/","Vocabulary.csv"),b(i+"/","Kanji.csv")]);break;case h.ExternalSourceType.LocalService:a=fetch(i+d.sheetServicePath,(0,l.requiredAuth)(n)).then(e=>e.json()).then(e=>e);break;default:a=S(t.dispatch)}return a});function S(e){let t=e((0,u.getVocabulary)()).unwrap(),a=e((0,c.getPhrase)()).unwrap(),s=e((0,o.getKanji)()).unwrap(),r=["Phrases","Vocabulary","Kanji"];return Promise.all([a,t,s]).then(e=>e.reduce((e,{value:t},a)=>[...e,(0,n.jtox)(t,r[a])],[]))}let g=(0,i.createAsyncThunk)("sheet/getDatasets",async(e,t)=>S(t.dispatch));function j(e,t){if(!e.name)return Promise.reject(Error("Missing sheet"));let a=e.name,s=new FormData,n=new Blob([JSON.stringify(e)],{type:"application/json"});return s.append("sheetType","xSheetObj"),s.append("sheetName",a),s.append("sheetData",n),fetch(t+d.sheetServicePath,{method:"PUT",credentials:"include",body:s}).then(e=>{if(307===e.status)return fetch(t+d.sheetServicePath,{method:"PUT",credentials:"include",body:s}).then(e=>{if(!e.ok)throw Error("Redirected and failed to save sheet");return e});if(!e.ok)throw Error("Failed to save sheet");return e}).then(e=>e.json()).then(({hash:e})=>({hash:e,name:a}))}function w(e,t){let a=new FormData,s=new Blob([JSON.stringify(e)],{type:"application/json"});return a.append("dataType",m.localStorageKey),a.append("data",s),fetch(t+d.settingsServicePath,{method:"PUT",credentials:"include",body:a}).then(e=>{if(!e.ok)throw Error("Failed to save user settings")})}function y(e){if(!e)return Promise.reject(Error("Missing workbook"));let{activeSheetData:t,activeSheetName:a}=(0,f.getActiveSheet)(e);if(!(0,r.isFilledSheetData)(t))throw Error("Missing data");let s=(0,f.removeLastRowIfBlank)(t),{data:i,hash:l}=(0,n.sheetDataToJSON)(s),o=t.name.toLowerCase();return(0,v.swMessageSaveDataJSON)(d.dataServiceEndpoint+"/"+o+".json.v"+l,i,l).then(()=>({name:a,hash:l}))}let k=(0,i.createSlice)({name:"sheet",initialState:{},reducers:{}}),{}=k.actions;k.reducer},84193:function(e,t,a){"use strict";a.r(t),a.d(t,{getVersions:function(){return l},setSwVersions:function(){return o},setVersion:function(){return d},default:function(){return h}});var s=a("71387"),n=a("9871"),r=a("80130"),i=a("22839");let l=(0,s.createAsyncThunk)("version/getVersions",async(e,t)=>{let a=t.getState(),{localServiceURL:s}=a.global;return fetch(r.dataServiceEndpoint+"/cache.json",(0,n.requiredAuth)(s)).then(e=>e.json())}),o=(0,s.createAsyncThunk)("version/setSwVersions",async(e,t)=>{let a=t.getState(),s={...a.version},n=r.dataServiceEndpoint+"/cache.json";return(0,i.swMessageSaveDataJSON)(n,s,"")}),c=(0,s.createSlice)({name:"version",initialState:{vocabulary:void 0,phrases:void 0,kanji:void 0,opposites:void 0,particles:void 0,suffixes:void 0},reducers:{clearVersions(e){e.vocabulary=void 0,e.phrases=void 0,e.kanji=void 0,e.opposites=void 0,e.particles=void 0,e.suffixes=void 0},setVersion(e,t){let{name:a,hash:s}=t.payload;e[a]=s}},extraReducers:e=>{e.addCase(l.fulfilled,(e,t)=>{let{vocabulary:a,kanji:s,phrases:n,opposites:r,particles:i,suffixes:l}=t.payload;e.kanji=s,e.vocabulary=a,e.phrases=n,e.opposites=r,e.particles=i,e.suffixes=l})}}),{clearVersions:u,setVersion:d}=c.actions;var h=c.reducer}}]);