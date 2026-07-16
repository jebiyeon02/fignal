export function displayableCaseImages(counterfeitCase: { images: string[]; rightsStatus?: string }) {
  return counterfeitCase.rightsStatus === "cleared_reference" ? counterfeitCase.images : [];
}
