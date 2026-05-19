import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Renders an HTML string to a full-page PNG via headless Chromium.
// Shared between api/inbound-email.js (new forwards) and
// api/render-html-to-png.js (client-triggered migration of legacy
// text/html records). The aggressive readability CSS handles the worst
// case forwarded email styling — explicit white text on every nested
// element with CID background images that don't load.
export async function renderEmailHtmlToPng(html) {
  // Conservative readability safety net:
  //   - Force light background only at the root, so transactional emails
  //     with white text don't render invisibly on white (the dead-CID-bg
  //     case from Outlook forwarding).
  //   - Force readable text color ONLY where the email specifically
  //     declares pure white text (#ffffff, #fff, white). Other colors
  //     pass through unchanged.
  //   - Hide cid: images that didn't get resolved (broken refs from
  //     Outlook). Resolved cid: images were rewritten to data: URLs by
  //     resolveCidImages() before this CSS even sees them.
  //   - Cap images to container width so they don't blow out the layout.
  // This is significantly less aggressive than the prior version, so
  // Gmail-forwarded emails with proper styling render with their original
  // colors and layout. Outlook's truly-empty HTML still renders blank
  // (and we already fall back to the card path for those).
  const safetyCss = `<style id="continuum-safety-css">
    html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.55; padding: 20px; box-sizing: border-box; color: #1a1a1a; }
    body img { max-width: 100% !important; height: auto !important; }
    body img[src^="cid:"] { display: none !important; }
    body [style*="color:#fff"], body [style*="color: #fff"], body [style*="color:#ffffff"], body [style*="color: #ffffff"], body [style*="color:white"], body [style*="color: white"] { color: #1a1a1a !important; }
    body font[color="#ffffff"], body font[color="#fff"], body font[color="white"] { color: #1a1a1a !important; }
  </style>`;
  let docToRender;
  if (/<\/head>/i.test(html)) {
    docToRender = html.replace(/<\/head>/i, safetyCss + "</head>");
  } else if (/<html[\s>]/i.test(html)) {
    docToRender = html.replace(/<html[^>]*>/i, (m) => m + "<head>" + safetyCss + "</head>");
  } else {
    docToRender = `<!doctype html><html><head><meta charset="utf-8">${safetyCss}</head><body>${html}</body></html>`;
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 800, height: 1200, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(docToRender, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 300));
    const buffer = await page.screenshot({ fullPage: true, type: "png", omitBackground: false });
    return buffer;
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
  }
}
