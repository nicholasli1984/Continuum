import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: { sizeLimit: "6mb" } } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) return res.status(500).send("Server config error");

  const supabase = createClient(supabaseUrl, supabaseKey);
  const token = req.query.t || req.body?.token;

  // Validate token
  if (!token) {
    return res.status(400).send(errorPage("Invalid link", "This receipt link is missing a token. Please scan the QR code again."));
  }

  const { data: addrRows } = await supabase
    .from("user_forwarding_addresses")
    .select("user_id, email")
    .eq("forwarding_address", token)
    .limit(1);
  const addrRow = addrRows?.[0] || null;

  if (!addrRow?.user_id) {
    return res.status(404).send(errorPage("Invalid QR code", "This receipt link is not valid. Please ask for a new QR code."));
  }

  // GET — serve the receipt form
  if (req.method === "GET") {
    return res.status(200).setHeader("Content-Type", "text/html").send(receiptFormHTML(token));
  }

  // POST — process receipt submission or OCR parse
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);

      // ── OCR Mode: parse receipt image via Claude Vision ──
      if (body.action === "ocr" && body.imageData) {
        const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
        if (!anthropicKey) {
          return res.status(200).json({ error: "OCR not configured", parsed: null });
        }
        const mediaType = body.mediaType || "image/jpeg";
        // Strip data URL prefix if present
        const b64 = body.imageData.replace(/^data:[^;]+;base64,/, "");
        try {
          const ocrResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1024,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                  { type: "text", text: `Parse this receipt/bill image. Extract ALL of the following into a JSON object. Be precise with numbers — read them exactly as printed. If a field isn't visible, use null.

Return ONLY valid JSON, no markdown, no explanation:
{
  "restaurantName": "string — business/restaurant name",
  "date": "YYYY-MM-DD or null",
  "currency": "3-letter code (USD, EUR, GBP, JPY, etc.)",
  "items": [{"desc": "item description", "amount": number}],
  "subtotal": number or null,
  "tax": number or null,
  "tip": number or null,
  "total": number (the final total charged),
  "paymentMethod": "string — Visa, Amex, cash, etc. or null"
}` },
                ],
              }],
            }),
          });
          const ocrData = await ocrResp.json();
          const textContent = ocrData?.content?.[0]?.text || "";
          // Extract JSON from response (may have markdown wrapping)
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.status(200).json({ parsed });
          }
          return res.status(200).json({ parsed: null, raw: textContent });
        } catch (ocrErr) {
          console.error("OCR error:", ocrErr);
          return res.status(200).json({ parsed: null, error: ocrErr.message });
        }
      }

      const { restaurant, date, total, currency, tax, tip, subtotal, items, receiptImage, submitterNote } = body;

      if (!restaurant || !total || total <= 0) {
        return res.status(400).json({ error: "Restaurant name and total are required" });
      }

      // Rate limit: max 20 per token per hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await supabase
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", addrRow.user_id)
        .gte("created_at", oneHourAgo)
        .like("notes", "%via QR receipt%");
      if (count >= 20) {
        return res.status(429).json({ error: "Too many receipts submitted. Please try again later." });
      }

      // Build notes
      const noteLines = [];
      if (items?.length > 0) {
        noteLines.push("Items:");
        items.forEach(i => noteLines.push(`  ${i.desc} — ${currency || "USD"} ${Number(i.amount).toFixed(2)}`));
      }
      if (subtotal) noteLines.push(`Subtotal: ${currency || "USD"} ${Number(subtotal).toFixed(2)}`);
      if (tax) noteLines.push(`Tax: ${currency || "USD"} ${Number(tax).toFixed(2)}`);
      if (tip) noteLines.push(`Tip: ${currency || "USD"} ${Number(tip).toFixed(2)}`);
      if (submitterNote) noteLines.push(`Note: ${submitterNote}`);
      noteLines.push("Submitted via QR receipt");

      const { error } = await supabase.from("expenses").insert({
        user_id: addrRow.user_id,
        trip_id: null,
        category: "biz_meals",
        description: restaurant.slice(0, 200),
        amount: Number(total),
        currency: (currency || "USD").toUpperCase().slice(0, 3),
        date: date || new Date().toISOString().slice(0, 10),
        payment_method: "",
        receipt: true,
        receipt_image: receiptImage || null,
        notes: noteLines.join("\n"),
        individuals: "",
        fx_rate: 1,
        usd_reimbursement: null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: "Failed to save receipt" });
      }

      return res.status(200).setHeader("Content-Type", "text/html").send(successPage(restaurant));
    } catch (e) {
      console.error("Receipt processing error:", e);
      return res.status(500).json({ error: "Server error processing receipt" });
    }
  }

  return res.status(405).send("Method not allowed");
}

function errorPage(title, message) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Continuum Receipt</title><style>*{box-sizing:border-box;margin:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{max-width:400px;text-align:center;padding:40px 24px}h1{font-size:22px;font-weight:700;margin-bottom:12px;color:#dc2626}p{font-size:14px;color:#666;line-height:1.6}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

function successPage(restaurant) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receipt Sent</title><style>*{box-sizing:border-box;margin:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{max-width:400px;text-align:center;padding:40px 24px}h1{font-size:22px;font-weight:700;margin-bottom:12px;color:#16a34a}p{font-size:14px;color:#666;line-height:1.6}.check{width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}</style></head><body><div class="card"><div class="check">&#10003;</div><h1>Receipt Sent</h1><p>The receipt from <strong>${restaurant.replace(/</g, "&lt;")}</strong> has been delivered. You can close this page.</p></div></body></html>`;
}

function receiptFormHTML(token) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Send Receipt — Continuum</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f8f8;color:#1a1a1a;min-height:100vh}
.header{background:#fff;border-bottom:1px solid #eee;padding:16px 20px;text-align:center}
.header h1{font-size:16px;font-weight:700;color:#D4742D;letter-spacing:0.05em}
.header p{font-size:12px;color:#888;margin-top:4px}
.form{max-width:480px;margin:0 auto;padding:20px}
.field{margin-bottom:16px}
.field label{display:block;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px}
.field input,.field select,.field textarea{width:100%;padding:12px 14px;border:1px solid #ddd;border-radius:10px;font-size:16px;font-family:inherit;background:#fff;color:#1a1a1a;-webkit-appearance:none}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#D4742D}
.field textarea{resize:vertical;min-height:60px}
.row{display:flex;gap:12px}
.row .field{flex:1}
.items{margin-bottom:16px}
.item-row{display:flex;gap:8px;margin-bottom:8px}
.item-row input{flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit}
.item-row input:first-child{flex:2}
.add-item{background:none;border:1px dashed #ccc;border-radius:8px;padding:10px;width:100%;color:#888;font-size:13px;cursor:pointer;font-family:inherit}
.photo-area{border:2px dashed #ddd;border-radius:12px;padding:24px;text-align:center;cursor:pointer;position:relative;overflow:hidden;margin-bottom:16px}
.photo-area.has-photo{border-color:#D4742D;background:#fef7f0}
.photo-area input{position:absolute;inset:0;opacity:0;cursor:pointer}
.photo-area p{font-size:13px;color:#888}
.photo-area .preview{max-width:100%;max-height:200px;border-radius:8px;margin-top:8px}
.submit{width:100%;padding:14px;border:none;border-radius:12px;background:#D4742D;color:#fff;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.15s}
.submit:disabled{opacity:0.5;cursor:default}
.submit:hover:not(:disabled){opacity:0.9}
.total-row{background:#f0f0f0;border-radius:10px;padding:14px;margin-bottom:16px}
.total-row label{font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:6px;display:block}
.total-row input{font-size:24px;font-weight:700;border:none;background:transparent;width:100%;padding:0;color:#1a1a1a}
.total-row input:focus{outline:none}
.snap-hero{max-width:480px;margin:0 auto;padding:40px 20px;text-align:center}
.snap-hero h2{font-size:20px;font-weight:700;margin-bottom:8px}
.snap-hero p{font-size:14px;color:#666;margin-bottom:24px;line-height:1.5}
.snap-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px;border:none;border-radius:14px;background:#D4742D;color:#fff;font-size:18px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:12px}
.snap-btn svg{flex-shrink:0}
.manual-link{display:block;text-align:center;color:#888;font-size:13px;cursor:pointer;padding:8px;text-decoration:underline}
.ocr-status{text-align:center;padding:24px;color:#D4742D;font-size:14px;font-weight:600}
.ocr-status .spinner{display:inline-block;width:20px;height:20px;border:2px solid #ddd;border-top:2px solid #D4742D;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.filled-badge{display:inline-block;background:#dcfce7;color:#16a34a;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;text-transform:uppercase}
</style>
</head>
<body>
<div class="header">
  <h1>CONTINUUM</h1>
  <p>Digital Receipt Submission</p>
</div>

<!-- Step 1: Quick Snap hero -->
<div class="snap-hero" id="snapHero">
  <h2>Snap Your Receipt</h2>
  <p>Take a photo of your receipt and we'll read it automatically — no typing needed.</p>
  <button type="button" class="snap-btn" onclick="document.getElementById('snapInput').click()">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
    Take Photo
  </button>
  <input type="file" id="snapInput" accept="image/*" capture="environment" style="display:none" onchange="handleSnapPhoto(this)">
  <span class="manual-link" onclick="showManualForm()">Or enter details manually</span>
</div>

<!-- OCR processing status -->
<div class="ocr-status" id="ocrStatus" style="display:none">
  <div><span class="spinner"></span>Reading your receipt...</div>
  <p style="font-size:12px;color:#888;margin-top:8px">This takes a few seconds</p>
</div>

<!-- Step 2: Form (hidden until snap or manual) -->
<form class="form" id="receiptForm" style="display:none" onsubmit="return submitReceipt(event)">
  <input type="hidden" name="token" value="${token}">

  <div class="field">
    <label>Restaurant / Business Name <span id="restaurantBadge"></span></label>
    <input type="text" id="restaurant" required placeholder="e.g. Nobu, The Capital Grille" autocomplete="off">
  </div>

  <div class="row">
    <div class="field">
      <label>Date</label>
      <input type="date" id="receiptDate" value="${new Date().toISOString().slice(0, 10)}">
    </div>
    <div class="field">
      <label>Currency</label>
      <select id="currency">
        <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
        <option value="CAD">CAD</option><option value="JPY">JPY</option><option value="AUD">AUD</option>
        <option value="SGD">SGD</option><option value="HKD">HKD</option><option value="CHF">CHF</option>
        <option value="BMD">BMD</option><option value="TWD">TWD</option><option value="THB">THB</option>
        <option value="MXN">MXN</option><option value="NZD">NZD</option><option value="KRW">KRW</option>
      </select>
    </div>
  </div>

  <div class="items" id="itemsSection">
    <label style="display:block;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Line Items <span id="itemsBadge"></span></label>
    <div id="itemRows"></div>
    <button type="button" class="add-item" onclick="addItem()">+ Add Item</button>
  </div>

  <div class="row">
    <div class="field">
      <label>Subtotal</label>
      <input type="number" id="subtotal" step="0.01" min="0" placeholder="0.00">
    </div>
    <div class="field">
      <label>Tax</label>
      <input type="number" id="tax" step="0.01" min="0" placeholder="0.00">
    </div>
    <div class="field">
      <label>Tip</label>
      <input type="number" id="tip" step="0.01" min="0" placeholder="0.00">
    </div>
  </div>

  <div class="total-row">
    <label>Total Amount <span id="totalBadge"></span></label>
    <input type="number" id="total" step="0.01" min="0.01" required placeholder="0.00">
  </div>

  <div class="photo-area" id="photoArea" onclick="document.getElementById('photoInput').click()">
    <input type="file" id="photoInput" accept="image/*" capture="environment" onchange="handlePhoto(this)">
    <p id="photoLabel">Tap to take/change receipt photo</p>
    <img id="photoPreview" class="preview" style="display:none">
  </div>

  <div class="field">
    <label>Note (optional)</label>
    <textarea id="submitterNote" placeholder="e.g. Table 12, party of 4"></textarea>
  </div>

  <button type="submit" class="submit" id="submitBtn">Send Receipt</button>
  <p id="statusMsg" style="text-align:center;margin-top:12px;font-size:13px;color:#888"></p>
</form>

<script>
let photoData = null;

function showManualForm() {
  document.getElementById('snapHero').style.display = 'none';
  document.getElementById('receiptForm').style.display = 'block';
}

function addItem(desc, amount) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = '<input type="text" placeholder="Item description" value="' + (desc || '').replace(/"/g, '&quot;') + '"><input type="number" step="0.01" min="0" placeholder="0.00" value="' + (amount || '') + '"><button type="button" onclick="this.parentNode.remove()" style="padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#dc2626;cursor:pointer;font-size:14px">x</button>';
  document.getElementById('itemRows').appendChild(row);
}

function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5MB'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    photoData = { name: file.name, size: file.size, type: file.type, data: e.target.result };
    document.getElementById('photoPreview').src = e.target.result;
    document.getElementById('photoPreview').style.display = 'block';
    document.getElementById('photoLabel').textContent = file.name;
    document.getElementById('photoArea').classList.add('has-photo');
  };
  reader.readAsDataURL(file);
}

async function handleSnapPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5MB'); return; }

  // Show processing
  document.getElementById('snapHero').style.display = 'none';
  document.getElementById('ocrStatus').style.display = 'block';

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    photoData = { name: file.name, size: file.size, type: file.type, data: dataUrl };

    // Send to OCR endpoint
    try {
      const resp = await fetch(window.location.pathname + '?t=${token}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ocr', imageData: dataUrl, mediaType: file.type || 'image/jpeg' }),
      });
      const result = await resp.json();

      document.getElementById('ocrStatus').style.display = 'none';
      document.getElementById('receiptForm').style.display = 'block';

      // Set photo preview
      document.getElementById('photoPreview').src = dataUrl;
      document.getElementById('photoPreview').style.display = 'block';
      document.getElementById('photoLabel').textContent = file.name;
      document.getElementById('photoArea').classList.add('has-photo');

      // Auto-fill fields from OCR
      if (result.parsed) {
        const p = result.parsed;
        const badge = '<span class="filled-badge">auto-filled</span>';
        if (p.restaurantName) { document.getElementById('restaurant').value = p.restaurantName; document.getElementById('restaurantBadge').innerHTML = badge; }
        if (p.date) document.getElementById('receiptDate').value = p.date;
        if (p.currency) { const sel = document.getElementById('currency'); for (let o of sel.options) { if (o.value === p.currency.toUpperCase()) { sel.value = o.value; break; } } }
        if (p.subtotal) document.getElementById('subtotal').value = p.subtotal;
        if (p.tax) document.getElementById('tax').value = p.tax;
        if (p.tip) document.getElementById('tip').value = p.tip;
        if (p.total) { document.getElementById('total').value = p.total; document.getElementById('totalBadge').innerHTML = badge; }
        if (p.items && p.items.length > 0) {
          p.items.forEach(function(item) { addItem(item.desc, item.amount); });
          document.getElementById('itemsBadge').innerHTML = badge;
        }
        if (p.paymentMethod) document.getElementById('submitterNote').value = 'Payment: ' + p.paymentMethod;
      }
    } catch (err) {
      document.getElementById('ocrStatus').style.display = 'none';
      document.getElementById('receiptForm').style.display = 'block';
      document.getElementById('photoPreview').src = dataUrl;
      document.getElementById('photoPreview').style.display = 'block';
      document.getElementById('photoArea').classList.add('has-photo');
    }
  };
  reader.readAsDataURL(file);
}

async function submitReceipt(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const msg = document.getElementById('statusMsg');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  msg.textContent = '';

  const items = [];
  document.querySelectorAll('.item-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value && inputs[1].value) {
      items.push({ desc: inputs[0].value, amount: parseFloat(inputs[1].value) || 0 });
    }
  });

  const body = {
    token: '${token}',
    restaurant: document.getElementById('restaurant').value.trim(),
    date: document.getElementById('receiptDate').value,
    currency: document.getElementById('currency').value,
    subtotal: parseFloat(document.getElementById('subtotal').value) || 0,
    tax: parseFloat(document.getElementById('tax').value) || 0,
    tip: parseFloat(document.getElementById('tip').value) || 0,
    total: parseFloat(document.getElementById('total').value) || 0,
    items: items,
    receiptImage: photoData,
    submitterNote: document.getElementById('submitterNote').value.trim(),
  };

  try {
    const resp = await fetch(window.location.pathname + '?t=${token}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      document.body.innerHTML = (await resp.text());
    } else {
      const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
      msg.textContent = err.error || 'Failed to send. Please try again.';
      msg.style.color = '#dc2626';
      btn.disabled = false;
      btn.textContent = 'Send Receipt';
    }
  } catch (err) {
    msg.textContent = 'Network error. Please check your connection and try again.';
    msg.style.color = '#dc2626';
    btn.disabled = false;
    btn.textContent = 'Send Receipt';
  }
  return false;
}
</script>
</body>
</html>`;
}
