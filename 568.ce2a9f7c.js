(self.webpackChunknmemonica=self.webpackChunknmemonica||[]).push([["568"],{2342:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return E}});var n=a("10327"),r=a("58093"),s=a("22707"),i=a("78615"),o=a("83169"),l=a("40432"),c=a("37654"),u=a("28733"),d=a("80130"),h=a("43398"),v=a("17310"),m=a("60437"),f=a("22839"),p=a("9871"),S=a("16332"),b=a("34616"),g=a("38354"),x=a("72530"),w=a("87177"),j=a("84193"),y=a("93781"),k=a("40665");function E(){let e=(0,l.useDispatch)(),{localServiceURL:t,lastImport:a}=(0,l.useSelector)(({global:e})=>e),[E,D]=(0,o.useState)(!1),[L,P]=(0,o.useState)(!1),[N,T]=(0,o.useState)(!1),[C,I]=(0,o.useState)(!1),O=(0,o.useCallback)(()=>{if(!confirm("User edited datasets will be overwritten"))return;let a=(0,u.getExternalSourceType)(t);a===u.ExternalSourceType.Unset?e((0,p.setLocalDataEdited)(!1)):e((0,p.setLocalDataEdited)(!0)),e((0,w.importDatasets)()).unwrap().then(t=>Promise.all(t.map(t=>{let{data:a,hash:n}=(0,s.sheetDataToJSON)(t),r=t.name.toLowerCase();return e((0,j.setVersion)({name:r,hash:n})),(0,f.swMessageSaveDataJSON)(d.dataServiceEndpoint+"/"+r+".json.v"+n,a,n).then(()=>t)})).then(t=>((0,h.openIDB)().then(e=>(0,h.putIDBItem)({db:e,store:h.IDBStores.WORKBOOK},{key:"0",workbook:t})),e((0,j.setSwVersions)())))).then(()=>{e((0,y.clearVocabulary)()),e((0,x.clearPhrases)()),e((0,S.clearKanji)()),e((0,g.clearParticleGame)()),e((0,b.clearOpposites)()),T(!0),e((0,p.setLastImport)(`${["Reset","Local","GitHub"][a]}: ${new Date().toJSON()}`))})},[e,t]),B=(0,o.useCallback)(()=>{if(!confirm("Back up *All* to local service"))return;let a=new Promise((a,n)=>{let r;try{r=(0,m.getLocalStorageSettings)(v.localStorageKey)}catch(t){e((0,p.logger)("Failed settings backup",k.DebugLevel.ERROR))}if(!r){a();return}(0,w.saveSettingsLocalService)(r,t).then(()=>a).catch(()=>n)}),n=e((0,w.getDatasets)()).unwrap().then(e=>e.map(e=>(0,w.saveSheetLocalService)({getData:()=>[e]},t))).then(e=>Promise.all(e));Promise.all([a,n]).then(()=>{I(!0)})},[e,t]),R=(0,o.useCallback)(e=>{D(e)},[]),V=(0,o.useCallback)(e=>{P(e),!e&&(T(null),I(null))},[]);return(0,n.jsx)("div",{className:"outer",children:(0,n.jsxs)("div",{className:"d-flex flex-column flex-sm-row justify-content-between",children:[(0,n.jsx)("div",{className:"column-1 mb-2 me-sm-2",children:(0,n.jsx)("div",{className:"mt-2 mb-2",children:[(0,n.jsx)("div",{children:"Recent import history:"},"label"),...a.map(e=>(0,n.jsx)("div",{className:"pt-1",children:e},e))]})}),(0,n.jsxs)("div",{className:"column-2",children:[(0,n.jsx)("div",{className:"mb-2",children:(0,n.jsx)(u.default,{onChangeInput:R,onChangeTrust:V})}),(0,n.jsxs)("div",{className:"d-flex",children:[(0,n.jsx)("div",{className:"px-1",children:(0,n.jsxs)(r.Button,{"aria-label":"Backup Datasets",variant:"outlined",size:"small",disabled:(0,u.getExternalSourceType)(t)!==u.ExternalSourceType.LocalService||E||""===t||!0!==L||!0===C,onClick:B,children:[C?(0,n.jsx)(i.CheckCircleIcon,{size:"small",className:"pe-1"}):(0,n.jsx)(i.UploadIcon,{size:"small",className:"pe-1"}),"Backup"]})}),(0,n.jsx)("div",{className:"px-1",children:(0,n.jsxs)(r.Button,{"aria-label":"Import Datasets",variant:"outlined",size:"small",disabled:E||""===t||!0!==L||!0===N,onClick:O,children:[N?(0,n.jsx)(i.CheckCircleIcon,{size:"small",className:"pe-1"}):(0,n.jsx)(i.DownloadIcon,{size:"small",className:"pe-1"}),"Import"]})}),(0,n.jsx)("div",{className:"px-1",children:(0,n.jsx)(r.Button,{"aria-label":"Edit Datasets",variant:"contained",size:"small",disabled:E||""===t||!L,children:(0,n.jsxs)(c.Link,{to:"/sheet",className:"text-decoration-none",children:["Edit ",(0,n.jsx)(i.UndoIcon,{})]})})})]})]})]})})}},285:function(e,t,a){"use strict";a.r(t),a.d(t,{getActiveSheet:function(){return r},removeLastRowIfBlank:function(){return s},addExtraRow:function(){return i},searchInSheet:function(){return o},touchScreenCheck:function(){return l}});var n=a("88134");function r(e){let t=e.getData();if(1===t.length){let e=t[0].name,a=s(t[0]);return{activeSheetName:e,activeSheetData:a}}let a=e.bottombar.activeEl.el.innerHTML,n=t.find(e=>e.name===a)??t[0],r=s(n);return{activeSheetName:a,activeSheetData:r}}function s(e){let t=e.rows;if(!e.rows||!t)return e;let a={...e,rows:t},r=(0,n.getLastCellIdx)(e.rows);for(;Object.values(e.rows[r].cells).every(e=>void 0===e.text||0===e.text.length||""===e.text.trim());)delete a.rows[r],a.rows.len-=1,r=(0,n.getLastCellIdx)(a.rows);return a}function i(e){let t=e.reduce((e,t)=>{let a=t.rows;if(!a)return[...e,{rows:{0:{cells:{}}},len:1}];let r=(0,n.getLastCellIdx)(a),s={...t,rows:{...a,[String(r+1)]:{cells:{}},len:a.len+1}};return[...e,s]},[]);return t}function o(e,t){if(!e.rows)return[];let a=Object.values(e.rows).reduce((e,a,n)=>{if("number"!=typeof a&&"cells"in a){let r=Object.keys(a.cells).find(e=>a.cells[Number(e)].text?.toLowerCase().includes(t.toLowerCase()));if(void 0===r)return e;let s=a.cells[Number(r)].text;if(void 0===s)return e;let i=Number(r);e=[...e,[n,i,s]]}return e},[]);return a}function l(){let e=!1;if("maxTouchPoints"in navigator&&"number"==typeof navigator.maxTouchPoints)e=navigator.maxTouchPoints>0;else if("msMaxTouchPoints"in navigator&&"number"==typeof navigator.msMaxTouchPoints)e=navigator.msMaxTouchPoints>0;else{let t=matchMedia?.("(pointer:coarse)");if(t?.media==="(pointer:coarse)")e=!!t.matches;else if("orientation"in window)e=!0;else{let t=navigator.userAgent;e=/\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(t)||/\b(Android|Windows Phone|iPad|iPod)\b/i.test(t)}}return e}},87177:function(e,t,a){"use strict";a.r(t),a.d(t,{importDatasets:function(){return b},getDatasets:function(){return x},saveSheetLocalService:function(){return w},saveSettingsLocalService:function(){return j},saveSheetServiceWorker:function(){return y}});var n=a("89780"),r=a("22707"),s=a("88134"),i=a("71387"),o=a("9871"),l=a("16332"),c=a("72530");a("40665");var u=a("93781"),d=a("80130"),h=a("28733"),v=a("17310"),m=a("22839"),f=a("285");class p extends EventTarget{line(e){this.dispatchEvent(new CustomEvent("line",{detail:e}))}close(e){this.dispatchEvent(new CustomEvent("close",{detail:e}))}on(e,t){let a=e=>{if("detail"in e&&"string"==typeof e.detail){let{detail:a}=e;return t(a)}return t("")};switch(e){case"line":this.addEventListener("line",a);break;case"close":this.addEventListener("close",a)}}}function S(e,t){let a=t.slice(0,t.indexOf("."));return fetch(e+t).then(e=>{if(!e.ok)throw Error("bad response?");return e.text()}).then(e=>{let t=new p;t.addEventListener("line",()=>{});let r=(0,n.csvToObject)(t,a),s=e.includes("\r\n")?"\r\n":"\n";return e.split(s).forEach(e=>{t.line(e)}),t.close(),r})}let b=(0,i.createAsyncThunk)("sheet/importDatasets",async(e,t)=>{let a;let n=t.getState(),{localServiceURL:r}=n.global,s=(0,h.getExternalSourceType)(n.global.localServiceURL),i=n.global.localServiceURL;switch(s){case h.ExternalSourceType.GitHubUserContent:a=Promise.all([S(i+"/","Phrases.csv"),S(i+"/","Vocabulary.csv"),S(i+"/","Kanji.csv")]);break;case h.ExternalSourceType.LocalService:a=fetch(i+d.sheetServicePath,(0,o.requiredAuth)(r)).then(e=>e.json()).then(e=>e);break;default:a=g(t.dispatch)}return a});function g(e){let t=e((0,u.getVocabulary)()).unwrap(),a=e((0,c.getPhrase)()).unwrap(),n=e((0,l.getKanji)()).unwrap(),s=["Phrases","Vocabulary","Kanji"];return Promise.all([a,t,n]).then(e=>e.reduce((e,{value:t},a)=>[...e,(0,r.jtox)(t,s[a])],[]))}let x=(0,i.createAsyncThunk)("sheet/getDatasets",async(e,t)=>g(t.dispatch));function w(e,t){if(!e)return Promise.reject(Error("Missing workbook"));let{activeSheetData:a,activeSheetName:n}=(0,f.getActiveSheet)(e),r=new FormData,s=new Blob([JSON.stringify(a)],{type:"application/json"});return r.append("sheetType","xSheetObj"),r.append("sheetName",n),r.append("sheetData",s),fetch(t+d.sheetServicePath,{method:"PUT",credentials:"include",body:r}).then(e=>{if(307===e.status)return fetch(t+d.sheetServicePath,{method:"PUT",credentials:"include",body:r}).then(e=>{if(!e.ok)throw Error("Redirected and failed to save sheet");return e});if(!e.ok)throw Error("Failed to save sheet");return e}).then(e=>e.json()).then(({hash:e})=>({hash:e,name:n}))}function j(e,t){let a=new FormData,n=new Blob([JSON.stringify(e)],{type:"application/json"});return a.append("dataType",v.localStorageKey),a.append("data",n),fetch(t+d.settingsServicePath,{method:"PUT",credentials:"include",body:a}).then(e=>{if(!e.ok)throw Error("Failed to save user settings")})}function y(e){if(!e)return Promise.reject(Error("Missing workbook"));let{activeSheetData:t,activeSheetName:a}=(0,f.getActiveSheet)(e);if(!(0,s.isFilledSheetData)(t))throw Error("Missing data");let n=(0,f.removeLastRowIfBlank)(t),{data:i,hash:o}=(0,r.sheetDataToJSON)(n),l=t.name.toLowerCase();return(0,m.swMessageSaveDataJSON)(d.dataServiceEndpoint+"/"+l+".json.v"+o,i,o).then(()=>({name:a,hash:o}))}let k=(0,i.createSlice)({name:"sheet",initialState:{},reducers:{}}),{}=k.actions;k.reducer},84193:function(e,t,a){"use strict";a.r(t),a.d(t,{getVersions:function(){return o},setSwVersions:function(){return l},setVersion:function(){return d},default:function(){return h}});var n=a("71387"),r=a("9871"),s=a("80130"),i=a("22839");let o=(0,n.createAsyncThunk)("version/getVersions",async(e,t)=>{let a=t.getState(),{localServiceURL:n}=a.global;return fetch(s.dataServiceEndpoint+"/cache.json",(0,r.requiredAuth)(n)).then(e=>e.json())}),l=(0,n.createAsyncThunk)("version/setSwVersions",async(e,t)=>{let a=t.getState(),n={...a.version},r=s.dataServiceEndpoint+"/cache.json";return(0,i.swMessageSaveDataJSON)(r,n,"")}),c=(0,n.createSlice)({name:"version",initialState:{vocabulary:void 0,phrases:void 0,kanji:void 0,opposites:void 0,particles:void 0,suffixes:void 0},reducers:{clearVersions(e){e.vocabulary=void 0,e.phrases=void 0,e.kanji=void 0,e.opposites=void 0,e.particles=void 0,e.suffixes=void 0},setVersion(e,t){let{name:a,hash:n}=t.payload;e[a]=n}},extraReducers:e=>{e.addCase(o.fulfilled,(e,t)=>{let{vocabulary:a,kanji:n,phrases:r,opposites:s,particles:i,suffixes:o}=t.payload;e.kanji=n,e.vocabulary=a,e.phrases=r,e.opposites=s,e.particles=i,e.suffixes=o})}}),{clearVersions:u,setVersion:d}=c.actions;var h=c.reducer}}]);