import { expect } from "chai";

function deleteAllCaches(){
    browser.url("https://bryanjimenez.github.io/nmemonica");

    const keysBefore = browser.execute(() => {
        return caches.keys().then(k=>Promise.all(k.map(k=>caches.delete(k)))).then(()=>caches.keys())
    });

    // console.log(keysBefore)
    expect(keysBefore).to.deep.equal([]);
}


describe("cache", function () {
  it("creates caches after a visit", function () {

    deleteAllCaches();

    browser.url("https://bryanjimenez.github.io/nmemonica");

    browser.$("#page-content").waitForExist();

    const keys = browser.execute(() => {
      return caches.keys();
    });

    expect(keys).to.deep.equal(["nmemonica-data", "nmemonica-static"]);
  });
});
