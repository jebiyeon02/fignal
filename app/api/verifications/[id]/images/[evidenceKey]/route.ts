import { evidenceKeys, type EvidenceKey } from "../../../../analyze/analysis-contract";
import { getVerificationReportImageMetadata } from "../../../../../../db/verification-history";
import { readVerificationReportImage } from "../../../../../../db/verification-report-images";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; evidenceKey: string }> },
) {
  const { id, evidenceKey } = await context.params;
  if (!id || !evidenceKeys.includes(evidenceKey as EvidenceKey) || evidenceKey === "purchaseProof") {
    return new Response("Not found", { status: 404 });
  }

  const metadata = await getVerificationReportImageMetadata(id, evidenceKey);
  if (!metadata) return new Response("Not found", { status: 404 });

  const object = await readVerificationReportImage(metadata.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": object.httpMetadata?.contentType ?? metadata.contentType,
      "Content-Length": String(object.size),
      "Content-Disposition": "inline",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
