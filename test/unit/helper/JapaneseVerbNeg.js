import { expect } from "chai";
import { JapaneseVerb } from "../../../src/helper/JapaneseVerb";

const verbs = {

  irr: [
    // { dic:'だ',class:3, nai:'です'},
    { dic: "くる\n来る", class: 3, nai: "こない\n来ない"},
    { dic: "する", class: 3, nai: "しない"},
    { dic: "あいする\n愛する", class: 3, nai: "あいしない\n愛しない"},

    { dic: "ある", class: 3, nai: "ない" },
  ],


  ru: [
    { dic: "たべる\n食べる", nai:"たべない\n食べない"},
    { dic:"おきる\n起きる", nai:"おきない\n起きない"},
    { dic:"とじる\n閉じる", nai:"とじない\n閉じない"},
    { dic: "いる\n居る", class: 2, nai: "いない\n居ない"},
    { dic: "いる", class: 2, nai: "いない"},
  ],

  u: [
    { dic: "あう\n会う", nai: "あわない\n会わない"},
    { dic: "たつ\n立つ", nai: "たたない\n立たない"},
    { dic: "うつす\n写す", nai: "うつさない\n写さない"},
    { dic: "わる\n割る", nai: "わらない\n割らない"},
    { dic: "かく\n書く", nai: "かかない\n書かない"},
    { dic: "およぐ\n泳ぐ", nai: "およがない\n泳がない"},
    { dic: "しぬ\n死ぬ", nai: "しなない\n死なない"},
    { dic: "まなぶ\n学ぶ", nai: "まなばない\n学ばない"},
    { dic: "やすむ\n休む", nai: "やすまない\n休まない"},

    { dic: {japanese: "へる\n減る", exv:1}, class: 1, nai: "へらない\n減らない"},
    { dic: "きく", class: 1, nai: "きかない"},
  ],
};

describe("JapaneseVerbNeg", function () {
  describe("nai form", function () {
    it("irr", function () {
      verbs.irr.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).naiForm();
        expect(actual, actual.toString()).to.be.a('JapaneseText');
        expect(actual.toString(), v.dic).to.eq(v.nai);
      });
    });

    it("ichidan", function () {
      verbs.ru.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).naiForm();
        expect(actual, actual.toString()).to.be.a('JapaneseText');
        expect(actual.toString(), v.dic).to.eq(v.nai);
      });
    });

    it("godan", function () {
      verbs.u.forEach((v) => {
        const actual = JapaneseVerb.parse(v.dic).naiForm();
        expect(actual, actual.toString()).to.be.a('JapaneseText');
        expect(actual.toString(), v.dic).to.eq(v.nai);
      });
    });
    
  });
});
