// Client helper for the drag-and-drop "Add from file" flow on the trip
// detail page. Reads the dropped file as a base64 data URL and POSTs it to
// /api/parse-attachment — the server dispatches based on file type:
//   PDF   → Claude reads the document natively (all pages)
//   DOCX  → server extracts text via mammoth, sends as text to Claude
//   image → Claude Vision reads the image
//
// The earlier flow converted PDFs to PNG via pdf.js (client-side, page 1 only).
// We dropped that step — Claude's document support reads every page directly
// and we save a ~150 KB client dependency.

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function parseAttachmentFile(file, segmentType) {
  if (!file) throw new Error("No file provided");
  if (!segmentType) throw new Error("Segment type required");

  const dataUrl = await fileToDataUrl(file);
  const name = file.name || "";

  // Resolve the media type. Browsers sometimes leave `file.type` blank for
  // .docx (especially when dragged from a chat app); fall back to the
  // extension so the server still routes correctly.
  let mediaType = file.type || "";
  if (!mediaType) {
    if (/\.docx$/i.test(name)) mediaType = DOCX_MIME;
    else if (/\.pdf$/i.test(name)) mediaType = "application/pdf";
    else mediaType = "image/png";
  }

  const res = await fetch("/api/parse-attachment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl: dataUrl, mediaType, segmentType, fileName: name }),
  });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || "Parsing failed");
  return data;
}

export const SEGMENT_TYPE_OPTIONS = [
  { id: "flight", label: "Flight", emoji: "✈" },
  { id: "hotel", label: "Hotel", emoji: "🏨" },
  { id: "activity", label: "Activity", emoji: "🎟" },
  { id: "rental", label: "Rental car", emoji: "🚗" },
  { id: "train", label: "Train", emoji: "🚆" },
  { id: "transfer", label: "Transfer", emoji: "🚐" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽" },
  { id: "lounge", label: "Lounge", emoji: "🛋" },
  { id: "ferry", label: "Ferry", emoji: "⛴" },
  { id: "cruise", label: "Cruise", emoji: "🚢" },
];
