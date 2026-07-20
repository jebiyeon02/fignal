import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const overseasMentions = JSON.parse(readFileSync(new URL("../app/data/overseas-community-mentions.generated.json", import.meta.url))).mentions;
const catalogProducts = [
  ...JSON.parse(readFileSync(new URL("../app/data/nendoroids-1-500.generated.json", import.meta.url))),
  ...JSON.parse(readFileSync(new URL("../app/data/nendoroids-catalog.generated.json", import.meta.url))),
];

test("overseas community mentions stay product-specific and verdict-neutral", () => {
  const productIds = new Set(catalogProducts.map((product) => product.id));
  const mentionIds = new Set();
  const allowedHosts = new Set(["www.reddit.com", "myfigurecollection.net"]);

  assert.ok(overseasMentions.length >= 40);
  for (const mention of overseasMentions) {
    assert.equal(productIds.has(mention.productId), true, `unknown product: ${mention.productId}`);
    assert.equal(mentionIds.has(mention.mentionId), false, `duplicate mention: ${mention.mentionId}`);
    mentionIds.add(mention.mentionId);
    assert.equal(mention.sourceLocale, "international");
    assert.equal(mention.verdictImpact, "none");
    assert.equal(mention.requiresHumanReview, true);

    const sourceUrl = new URL(mention.sourceUrl);
    assert.equal(sourceUrl.protocol, "https:");
    assert.equal(allowedHosts.has(sourceUrl.hostname), true, `unexpected source host: ${sourceUrl.hostname}`);
  }
});
