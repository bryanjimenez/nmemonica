import { expect } from "chai";
import { getParticles } from "../../../lambda/sheets/src/sheets_sync_phrases.js";

/* global describe it */

describe("sheet_sync_phrases", function () {
  describe("getParticles", function () {
    it("no particles or tags", function () {
      const initialTags = "";

      const { tags, particles } = getParticles(initialTags);

      expect(tags).to.deep.equal([]);
      expect(particles).to.deep.equal([]);
    });

    it("particles", function () {
      const initialTags = "p:は,から,を";

      const { tags, particles } = getParticles(initialTags);

      expect(tags).to.deep.equal([]);
      expect(particles).to.deep.equal(["は", "から", "を"]);
    });

    it("particles and tags", function () {
      const initialTags = "casual negative\np:は,から,を";

      const { tags, particles } = getParticles(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(particles).to.deep.equal(["は", "から", "を"]);
    });
  });
});
