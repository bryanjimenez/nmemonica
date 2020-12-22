"use strict";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";

import { google } from "googleapis";
import axios from "axios";
import qs from "qs";

// axios.interceptors.request.use(e=>{
//   console.log('req intercept');
//   console.log(e);

//   return e;
// });

export function sheets_sync_translate(req, res) {
  var data = qs.stringify({
    "f.req":
      '[[["MkEWBc","[[\\"はい\\",\\"ja\\",\\"en\\",true],[null]]",null,"generic"]]]',
  });
  var config = {
    method: "post",
    url:
      "https://translate.google.com/_/TranslateWebserverUi/data/batchexecute",
    // headers: {
    //   "X-Same-Domain": "1",
    //   "User-Agent":
    //     "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    //   "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    //   Accept: "*/*",
    // },
    data: data,
  };

  return axios(config)
    .then((response) => {
      const a = JSON.parse(
        JSON.parse(response.data.split("\n").slice(1)[1] + "]")[0][2]
      )[0];
      console.log(a);
      return res.status(400).json(a);
    })
    .catch((error) => {
      return res.status(500).json(error.details);
    });
}
