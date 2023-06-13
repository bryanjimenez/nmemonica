import { expect } from "chai";
import { JapaneseVerb } from "../../../src/helper/JapaneseVerb";

const verbs = {

  irr: [
    // { dic: { japanese: 'だ' }, class: 3, nai: 'です' },
    { dic: { japanese: 'くる\n来る' }, class: 3, nai: 'こない\n来ない' },
    { dic: { japanese: 'する' }, class: 3, nai: 'しない' },
    { dic: { japanese: 'あいする\n愛する' }, class: 3, nai: 'あいしない\n愛しない' },
    { dic: { japanese: 'ある' }, class: 3, nai: 'ない' }
  ],


  ru: [
    { dic: { japanese: 'たべる\n食べる' }, nai: 'たべない\n食べない' },
    { dic: { japanese: 'おきる\n起きる' }, nai: 'おきない\n起きない' },
    { dic: { japanese: 'とじる\n閉じる' }, nai: 'とじない\n閉じない' },
    { dic: { japanese: 'いる\n居る' }, class: 2, nai: 'いない\n居ない' },
    { dic: { japanese: 'いる' }, class: 2, nai: 'いない' }
  ],

  u: [
    { dic: { japanese: 'あう\n会う' }, nai: 'あわない\n会わない' },
    { dic: { japanese: 'たつ\n立つ' }, nai: 'たたない\n立たない' },
    { dic: { japanese: 'うつす\n写す' }, nai: 'うつさない\n写さない' },
    { dic: { japanese: 'わる\n割る' }, nai: 'わらない\n割らない' },
    { dic: { japanese: 'かく\n書く' }, nai: 'かかない\n書かない' },
    { dic: { japanese: 'およぐ\n泳ぐ' }, nai: 'およがない\n泳がない' },
    { dic: { japanese: 'しぬ\n死ぬ' }, nai: 'しなない\n死なない' },
    { dic: { japanese: 'まなぶ\n学ぶ' }, nai: 'まなばない\n学ばない' },
    { dic: { japanese: 'やすむ\n休む' }, nai: 'やすまない\n休まない' },
    { dic: { japanese: 'へる\n減る', exv: 1 }, class: 1, nai: 'へらない\n減らない' },
    { dic: { japanese: 'きく' }, class: 1, nai: 'きかない' }
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
