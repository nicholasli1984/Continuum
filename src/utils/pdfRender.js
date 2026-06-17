// PDF → image helpers. pdf.js is loaded on demand from a CDN the first time
// we need it — keeps it out of the main bundle for users who never open a
// PDF receipt. Mirrors the inline versions in App.jsx so both call sites
// share one definition.

let _pdfJsLoading = null;
async function ensurePdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!_pdfJsLoading) {
    _pdfJsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return _pdfJsLoading;
}

// Render every page of a PDF data URL to an array of PNG data URLs.
// `scale: 2` keeps text legible when embedded back into another PDF or used
// as a regular img.
export async function renderPdfToImages(pdfDataUrl, { scale = 2 } = {}) {
  await ensurePdfJs();
  const pdf = await window.pdfjsLib.getDocument(pdfDataUrl).promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    images.push({ dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
  }
  return images;
}
