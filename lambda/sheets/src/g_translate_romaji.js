"use strict";
import { default as admin } from "firebase-admin";
import axios from "axios";
import qs from "qs";
import md5 from "md5";

// axios.interceptors.request.use(e=>{
//   console.log('req intercept');
//   console.log(e);
//   return e;
// });

export async function g_translate_romaji(req, res) {
  try {
    const { path } = req.body;

    switch (path) {
      case "phrases":
        await updatePhrases();
        break;
      default:
        throw new Error("missingPathException");
    }

    return res.sendStatus(200);
  } catch (e) {
    if (e.message === "missingPathException") {
      console.log(JSON.stringify({ severity: "ERROR", message: e.message }));
      return res.status(500).json({ error: e.message });
    } else {
      console.log(JSON.stringify({ severity: "ERROR", message: e.toString() }));
      return res.sendStatus(500);
    }
  }
}

async function updatePhrases() {
  const phrase = await admin.database().ref("lambda/phrases").once("value");

  if (!phrase.hasChildren()) {
    console.error("There are no phrases.");
    return;
  }

  let romajiReqPromises = [];
  let phraseOrig = [];
  let oldPhrase = {};
  phrase.forEach((childSnapshot) => {
    let p = childSnapshot.val();
    let key = childSnapshot.key;

    let japanese;
    if (p.japanese.indexOf("\n") > -1) {
      japanese = p.japanese.split("\n")[1];
    } else {
      japanese = p.japanese;
    }

    if (!p.romaji || p.romaji === "") {
      romajiReqPromises.push(getRomaji(japanese));
      phraseOrig.push({ key, phrase: p });
    }

    oldPhrase[key] = { ...p };
  });

  const responses = await Promise.all(romajiReqPromises);

  const romajis = responses.reduce((acc, cur, idx) => {
    const [a, b] = JSON.parse(
      JSON.parse(cur.data.split("\n").slice(1)[1] + "]")[0][2]
    );

    const romaji = a[0];
    acc[phraseOrig[idx].key] = { ...phraseOrig[idx].phrase, romaji };

    oldPhrase[phraseOrig[idx].key] = {
      ...oldPhrase[phraseOrig[idx].key],
      romaji,
    };

    return acc;
  }, {});

  return Promise.all([
    admin.database().ref("lambda/phrases").update(romajis),

    admin
      .database()
      .ref("lambda/cache")
      .update({ phrases: md5(JSON.stringify(oldPhrase)).substr(0, 4) }),
  ]);
}

/**
 * makes a request to google translate to obtain a romaji equivalent of the japanese param
 * NOTE: don't abuse the api
 * @param {String} japanese japanese input text
 * @returns an AxiosPromise
 */
function getRomaji(japanese) {
  var data = qs.stringify({
    "f.req":
      '[[["MkEWBc","[[\\"' +
      japanese +
      '\\",\\"ja\\",\\"en\\",true],[null]]",null,"generic"]]]',
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

  return axios(config);
  // .then((response) => {
  //   const [a,b] = JSON.parse(
  //     JSON.parse(response.data.split("\n").slice(1)[1] + "]")[0][2]
  //   );
  //   // a = [ 'Hai', null, null, [ [ [Array] ], 2 ] ]
  //   // b[0][0][5] = [ [ 'Yes', [ 'Yes', 'OK', 'Okay' ] ] ]
  //   // console.log(a);
  //   // console.log(b[0][0][5]);
  //   // return res.status(400).json(a);
  //   return a;
  // })
  // .catch((error) => {
  //   return res.status(500).json(error.details);
  // });
}
