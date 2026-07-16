import assert from "node:assert/strict";
import test from "node:test";

import { displayableCaseImages } from "../app/case-image-rights.ts";

test("only explicitly cleared reference images can render in case cards", () => {
  const images = ["https://example.com/reference.jpg"];
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "cleared_reference" }), images);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "unknown_link_only" }), []);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "cleared_training" }), []);
  assert.deepEqual(displayableCaseImages({ images, rightsStatus: "project_owned" }), []);
  assert.deepEqual(displayableCaseImages({ images }), []);
});
