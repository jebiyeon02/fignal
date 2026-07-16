import assert from "node:assert/strict";
import test from "node:test";

import { displayableCaseImages } from "../app/case-image-rights.ts";

test("external case images render without becoming AI training data", () => {
  const images = ["https://example.com/reference.jpg"];
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "cleared_reference" }), images);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "unknown_link_only" }), images);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "cleared_training" }), images);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "project_owned" }), images);
  assert.deepEqual(displayableCaseImages({ images }), []);
});

test("case image display accepts only unique HTTPS references", () => {
  const image = "https://example.com/reference.jpg";
  assert.deepEqual(displayableCaseImages({
    images: [image, image, "http://example.com/insecure.jpg", "javascript:alert(1)"],
    rightsStatus: "unknown_link_only",
  }), [image]);
});
