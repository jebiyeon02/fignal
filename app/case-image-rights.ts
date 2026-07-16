export function displayableCaseImages(counterfeitCase: { images: string[]; rightsStatus?: string }) {
  const displayableRights = new Set([
    "unknown_link_only",
    "cleared_reference",
    "cleared_training",
    "project_owned",
  ]);

  if (!counterfeitCase.rightsStatus || !displayableRights.has(counterfeitCase.rightsStatus)) return [];
  return [...new Set(counterfeitCase.images.filter((image) => /^https:\/\//i.test(image)))];
}
