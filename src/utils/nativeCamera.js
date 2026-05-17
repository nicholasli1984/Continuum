// Capacitor-aware camera helper. On a native platform (Android/iOS via
// Capacitor) it opens the OS-level camera UI and returns a File; on web it
// returns null and lets the caller fall back to the existing hidden
// <input type="file" capture> flow. This way the web build is unaffected
// and the native build gets a proper camera experience.

import { Capacitor } from "@capacitor/core";

export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

// Trigger native camera and resolve to a File or null. Caller should fall
// back to web file input when this returns null.
export async function snapReceiptNative() {
  if (!isNative()) return null;
  try {
    // Lazy-load the camera plugin so the web bundle stays slim.
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
      width: 1600,
    });
    if (!photo?.dataUrl) return null;
    // Convert data URL to a File so handleSnapReceipt's existing code path
    // (which expects a File) keeps working unchanged.
    const res = await fetch(photo.dataUrl);
    const blob = await res.blob();
    const ext = (photo.format || "jpg").toLowerCase();
    return new File([blob], `receipt_${Date.now()}.${ext}`, { type: blob.type || "image/jpeg" });
  } catch (err) {
    // User cancelled or permission denied. Don't fall back — they explicitly
    // dismissed. Returning null without throwing keeps the UI calm.
    if (err?.message?.toLowerCase?.().includes("cancel")) return null;
    console.warn("Native camera failed, falling back to file input:", err);
    return null;
  }
}
