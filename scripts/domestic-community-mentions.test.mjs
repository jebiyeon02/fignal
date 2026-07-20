import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const domesticMentions = JSON.parse(readFileSync(new URL("../app/data/domestic-community-mentions.generated.json", import.meta.url))).mentions;
const catalogProducts = [
  ...JSON.parse(readFileSync(new URL("../app/data/nendoroids-1-500.generated.json", import.meta.url))),
  ...JSON.parse(readFileSync(new URL("../app/data/nendoroids-catalog.generated.json", import.meta.url))),
];

test("domestic community mentions map only to known products and original HTTPS pages", () => {
  const productIds = new Set(catalogProducts.map((product) => product.id));
  const mentionIds = new Set();
  const allowedHosts = new Set(["gall.dcinside.com", "blog.naver.com", "bbs.ruliweb.com"]);

  assert.ok(domesticMentions.length > 0);
  for (const mention of domesticMentions) {
    assert.equal(productIds.has(mention.productId), true, `unknown product: ${mention.productId}`);
    assert.equal(mentionIds.has(mention.mentionId), false, `duplicate mention: ${mention.mentionId}`);
    mentionIds.add(mention.mentionId);
    assert.equal(mention.sourceLocale, "domestic");
    assert.equal(mention.verdictImpact, "none");
    assert.equal(mention.requiresHumanReview, true);

    const sourceUrl = new URL(mention.sourceUrl);
    assert.equal(sourceUrl.protocol, "https:");
    assert.equal(allowedHosts.has(sourceUrl.hostname), true, `unexpected source host: ${sourceUrl.hostname}`);
  }
});
