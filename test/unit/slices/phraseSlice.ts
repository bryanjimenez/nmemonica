import { expect } from "chai";
import { getPropsFromTags } from "../../../src/slices/phraseSlice";

describe("phraseSlice", function () {
  describe("getPropsFromTags", function () {
    it("empty", function () {
      const initialTags = "";

      const { tags, particles } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal([]);
      expect(particles).to.deep.equal([]);
    });

    it("particles", function () {
      const initialTags = "p:は,から,を";

      const { tags, particles } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal([]);
      expect(particles).to.deep.equal(["は", "から", "を"]);
    });

    it("particles and tags", function () {
      const initialTags = "casual negative\np:は,から,を";

      const { tags, particles } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(particles).to.deep.equal(["は", "から", "を"]);
    });

    it("antonymns", function () {
      const expected = "4f3b0dffa85324487e7130022fa2a87c";
      const initialTags = `casual negative\np:は,から,を; ant:${expected}`;

      const { tags, particles, antonymn } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(particles).to.deep.equal(["は", "から", "を"]);
      expect(antonymn).to.equal(expected);
    });
  });
});
