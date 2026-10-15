/**
 * Reads a chosen image file, centre-crops it to a square and downscales it to
 * fit `maxSize`, returning a compact JPEG data URL. Keeps profile photos small
 * enough to store on the user record without a dedicated file store.
 */
export async function fileToAvatarDataUrl(file: File, maxSize = 256): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG or WebP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("That image is larger than 8 MB. Please pick a smaller photo.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not open the selected photo."));
    el.src = dataUrl;
  });

  const side = Math.min(image.width, image.height);
  const scale = Math.min(1, maxSize / side);
  const size = Math.max(1, Math.round(side * scale));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // canvas unavailable — fall back to the original image

  ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}
