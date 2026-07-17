import { env } from "cloudflare:workers";
import type { EvidenceKey } from "../app/api/analyze/analysis-contract";

export type ReportImageUpload = {
  evidenceKey: EvidenceKey;
  file: File;
};

export type StoredReportImage = {
  evidenceKey: EvidenceKey;
  objectKey: string;
  contentType: string;
  byteSize: number;
};

function reportImageBucket() {
  const bucket = (env as unknown as { REPORT_IMAGES?: R2Bucket }).REPORT_IMAGES;
  if (!bucket) throw new Error("Cloudflare R2 binding `REPORT_IMAGES` is unavailable");
  return bucket;
}

function extensionFor(contentType: string) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  }[contentType] ?? "bin";
}

export async function storeVerificationReportImages(
  verificationId: string,
  uploads: ReportImageUpload[],
): Promise<StoredReportImage[]> {
  const bucket = reportImageBucket();
  const stored: StoredReportImage[] = [];
  try {
    for (const { evidenceKey, file } of uploads) {
      const contentType = file.type.toLowerCase();
      const objectKey = `verification-reports/${verificationId}/${evidenceKey}.${extensionFor(contentType)}`;
      const bytes = await file.arrayBuffer();
      await bucket.put(objectKey, bytes, {
        httpMetadata: { contentType },
        customMetadata: { verificationId, evidenceKey },
      });
      stored.push({ evidenceKey, objectKey, contentType, byteSize: bytes.byteLength });
    }
    return stored;
  } catch (error) {
    if (stored.length > 0) await bucket.delete(stored.map((image) => image.objectKey));
    throw error;
  }
}

export async function deleteVerificationReportImages(images: StoredReportImage[]) {
  if (images.length === 0) return;
  await reportImageBucket().delete(images.map((image) => image.objectKey));
}

export async function readVerificationReportImage(objectKey: string) {
  return reportImageBucket().get(objectKey);
}
