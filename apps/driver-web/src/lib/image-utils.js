import heic2any from "heic2any";

function toFile(blob, name, type = "image/jpeg") {
  return new File([blob], name, { type, lastModified: Date.now() });
}

export async function convertHeicToJpeg(file) {
  const fileName = String(file?.name || "").toLowerCase();
  const isHeic =
    String(file?.type || "").toLowerCase() === "image/heic" ||
    String(file?.type || "").toLowerCase() === "image/heif" ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif");
  if (!isHeic) return file;

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.85,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const outName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return toFile(blob, outName, "image/jpeg");
}

export async function compressImage(
  file,
  { maxWidth = 2048, maxHeight = 2048, quality = 0.85 } = {}
) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Failed to compress image."));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      quality
    );
  });

  return toFile(blob, file.name.replace(/\.(heic|heif|png|webp)$/i, ".jpg"), "image/jpeg");
}

