export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Continuum — Update</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #fff; color: #111; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { text-align: center; max-width: 380px; }
  h1 { font-size: 18px; margin-bottom: 8px; }
  p { font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 20px; }
  .btn { padding: 14px 32px; border: none; border-radius: 10px; background: #D4742D; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
  .done { color: #16a34a; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
</style>
</head><body>
<div class="card" id="card">
  <p>Updating...</p>
</div>
<script>
(async function() {
  var card = document.getElementById('card');
  try {
    if ('serviceWorker' in navigator) {
      var regs = await navigator.serviceWorker.getRegistrations();
      for (var i = 0; i < regs.length; i++) await regs[i].unregister();
    }
    if ('caches' in window) {
      var keys = await caches.keys();
      for (var i = 0; i < keys.length; i++) await caches.delete(keys[i]);
    }
    try { localStorage.removeItem('_sw_ver'); } catch(e) {}
    card.innerHTML = '<p class="done">Updated successfully</p><a href="/" class="btn">Open Continuum</a>';
  } catch(e) {
    card.innerHTML = '<p>Error: ' + e.message + '</p><a href="/" class="btn">Try Opening</a>';
  }
})();
</script>
</body></html>`);
}
