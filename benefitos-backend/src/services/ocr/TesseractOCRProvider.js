const { createWorker } = require("tesseract.js");
const { Jimp } = require("jimp");
const fs = require("fs");
const path = require("node:path");

const DEBUG_DIR = path.resolve(__dirname, "../../../debug");

/**
 * Validates if the file at filePath has valid image headers (magic bytes)
 */
const isValidImageHeader = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stats = fs.statSync(filePath);
    if (stats.size < 4) return false;

    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;
    
    return false;
  } catch (err) {
    console.error(`[OCR Magic Check] Error reading header: ${err.message}`);
    return false;
  }
};

/**
 * Solves a linear system of equations using Gaussian elimination to find homography coefficients
 */
function getPerspectiveTransform(src, dst) {
  const A = [];
  const B = [];
  
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { u, v } = dst[i];
    
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    
    B.push(u);
    B.push(v);
  }
  
  const n = 8;
  const M = A.map((row, idx) => [...row, B[idx]]);
  
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    const temp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = temp;
    
    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }
  
  const h = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    h[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) {
      M[k][n] -= M[k][i] * h[i];
    }
  }
  
  return [...h, 1];
}

/**
 * Warps a source Jimp image to a destination rectangle using projective homography matrix
 */
function warpPerspective(srcImage, dstWidth, dstHeight, hMatrix) {
  const dstImage = new Jimp({ width: dstWidth, height: dstHeight, color: 0xFFFFFFFF });
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = hMatrix;
  
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const w = h6 * x + h7 * y + h8;
      const srcX = (h0 * x + h1 * y + h2) / w;
      const srcY = (h3 * x + h4 * y + h5) / w;
      
      const xFloor = Math.floor(srcX);
      const yFloor = Math.floor(srcY);
      const xCeil = Math.min(srcImage.bitmap.width - 1, xFloor + 1);
      const yCeil = Math.min(srcImage.bitmap.height - 1, yFloor + 1);
      
      if (xFloor >= 0 && xCeil < srcImage.bitmap.width && yFloor >= 0 && yCeil < srcImage.bitmap.height) {
        const dx = srcX - xFloor;
        const dy = srcY - yFloor;
        
        const getPixel = (px, py) => {
          const idx = (py * srcImage.bitmap.width + px) * 4;
          return {
            r: srcImage.bitmap.data[idx],
            g: srcImage.bitmap.data[idx + 1],
            b: srcImage.bitmap.data[idx + 2],
            a: srcImage.bitmap.data[idx + 3]
          };
        };
        
        const p00 = getPixel(xFloor, yFloor);
        const p10 = getPixel(xCeil, yFloor);
        const p01 = getPixel(xFloor, yCeil);
        const p11 = getPixel(xCeil, yCeil);
        
        const r = (1 - dx) * (1 - dy) * p00.r + dx * (1 - dy) * p10.r + (1 - dx) * dy * p01.r + dx * dy * p11.r;
        const g = (1 - dx) * (1 - dy) * p00.g + dx * (1 - dy) * p10.g + (1 - dx) * dy * p01.g + dx * dy * p11.g;
        const b = (1 - dx) * (1 - dy) * p00.b + dx * (1 - dy) * p10.b + (1 - dx) * dy * p01.b + dx * dy * p11.b;
        const a = (1 - dx) * (1 - dy) * p00.a + dx * (1 - dy) * p10.a + (1 - dx) * dy * p01.a + dx * dy * p11.a;
        
        const dstIdx = (y * dstWidth + x) * 4;
        dstImage.bitmap.data[dstIdx] = Math.round(r);
        dstImage.bitmap.data[dstIdx + 1] = Math.round(g);
        dstImage.bitmap.data[dstIdx + 2] = Math.round(b);
        dstImage.bitmap.data[dstIdx + 3] = Math.round(a);
      }
    }
  }
  
  return dstImage;
}

/**
 * Scans image to detect coordinates of the 4 document card corners
 */
function detectDocumentCorners(image) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const data = image.bitmap.data;
  
  let totalLuminance = 0;
  for (let idx = 0; idx < w * h * 4; idx += 4) {
    totalLuminance += 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
  }
  const avgLum = totalLuminance / (w * h);
  const threshold = Math.max(100, avgLum * 1.15);
  
  let tl = { x: w, y: h, sum: w + h };
  let br = { x: 0, y: 0, sum: 0 };
  let tr = { x: 0, y: h, diff: -h };
  let bl = { x: w, y: 0, diff: w };
  let count = 0;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
      
      if (lum > threshold) {
        count++;
        const sum = x + y;
        const diff = x - y;
        
        if (sum < tl.sum) { tl = { x, y, sum }; }
        if (sum > br.sum) { br = { x, y, sum }; }
        if (diff > tr.diff) { tr = { x, y, diff }; }
        if (diff < bl.diff) { bl = { x, y, diff }; }
      }
    }
  }
  
  const marginX = w * 0.12;
  const marginY = h * 0.12;
  const isNearBorder = (
    tl.x < marginX && tl.y < marginY &&
    br.x > w - marginX && br.y > h - marginY
  );
  
  if (count < 500 || isNearBorder) {
    return [
      { x: 0, y: 0 },
      { x: w - 1, y: 0 },
      { x: w - 1, y: h - 1 },
      { x: 0, y: h - 1 }
    ];
  }
  
  return [tl, tr, br, bl];
}

/**
 * Draws red markers on the image corner coordinates for debugging
 */
function drawCornerMarkers(image, corners) {
  const marked = image.clone();
  const colors = [0xFF0000FF, 0x00FF00FF, 0x0000FFFF, 0xFFFF00FF]; // R, G, B, Y
  corners.forEach((c, i) => {
    const size = 15;
    const color = colors[i];
    const w = marked.bitmap.width;
    const h = marked.bitmap.height;
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const px = Math.round(c.x + dx);
        const py = Math.round(c.y + dy);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const idx = (py * w + px) * 4;
          marked.bitmap.data[idx] = (color >> 24) & 0xFF;
          marked.bitmap.data[idx+1] = (color >> 16) & 0xFF;
          marked.bitmap.data[idx+2] = (color >> 8) & 0xFF;
          marked.bitmap.data[idx+3] = color & 0xFF;
        }
      }
    }
  });
  return marked;
}

/**
 * Generates edge gradient map for debugging
 */
function generateEdgeMap(image) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const edges = new Jimp({ width: w, height: h, color: 0xFFFFFFFF });
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const getLum = (px, py) => {
        const idx = (py * w + px) * 4;
        return 0.299 * image.bitmap.data[idx] + 0.587 * image.bitmap.data[idx+1] + 0.114 * image.bitmap.data[idx+2];
      };
      const gx = getLum(x+1, y) - getLum(x-1, y);
      const gy = getLum(x, y+1) - getLum(x, y-1);
      const mag = Math.min(255, Math.round(Math.sqrt(gx*gx + gy*gy)));
      const idx = (y * w + x) * 4;
      edges.bitmap.data[idx] = mag;
      edges.bitmap.data[idx+1] = mag;
      edges.bitmap.data[idx+2] = mag;
      edges.bitmap.data[idx+3] = 255;
    }
  }
  return edges;
}

/**
 * Core image preprocessing pipeline
 */
async function preprocessPipeline(filePath) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  
  // Stage 1: Camera/Raw Input
  fs.copyFileSync(filePath, path.join(DEBUG_DIR, "original.jpg"));
  
  console.log("[Tesseract OCR] Preprocessing: loading image into Jimp...");
  let image = await Jimp.read(filePath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  const ratio = w / h;
  const isPrecropped = ratio > 1.2 && ratio < 1.9;

  if (!isPrecropped) {
    // Stage 2: Viewfinder Cropping
    const centerCropW = Math.round(w * 0.85);
    const centerCropH = Math.round(w * 0.55);
    const cropX = Math.max(0, Math.round((w - centerCropW) / 2));
    const cropY = Math.max(0, Math.round((h - centerCropH) / 2));
    image.crop({ x: cropX, y: cropY, w: centerCropW, h: centerCropH });
    
    // Save post-preprocessing viewfinder crop to cropped.jpg first (or edge detection input)
    await image.write(path.join(DEBUG_DIR, "cropped.jpg"));

    // Stage 3: Edge Detection
    const edges = generateEdgeMap(image);
    await edges.write(path.join(DEBUG_DIR, "edges.jpg"));

    // Decimation low-pass noise filter before corner scanning
    image.resize({ w: 550 });
    image.resize({ w: 1400 });
    image.normalize();
    image.contrast(0.3);

    // Stage 4: Corner Detection
    const corners = detectDocumentCorners(image);
    const cornersImg = drawCornerMarkers(image, corners);
    await cornersImg.write(path.join(DEBUG_DIR, "corners.jpg"));

    // Stage 5: Perspective Warp
    const tl = corners[0];
    const tr = corners[1];
    const br = corners[2];
    const bl = corners[3];
    const minX = Math.min(tl.x, bl.x);
    const maxX = Math.max(tr.x, br.x);
    const minY = Math.min(tl.y, tr.y);
    const maxY = Math.max(bl.y, br.y);
    const cardW = maxX - minX;
    const cardH = maxY - minY;
    const cw = image.bitmap.width;

    if (cardW > cw * 0.75 && cardW > 100 && cardH > 100) {
      image.crop({ x: minX, y: minY, w: cardW, h: cardH });
      // Save warped file as identity crop copy
      await image.write(path.join(DEBUG_DIR, "warped.jpg"));
    } else {
      const targetW = 900;
      const targetH = 570;
      const targetCorners = [
        { u: 0, v: 0 },
        { u: targetW - 1, v: 0 },
        { u: targetW - 1, v: targetH - 1 },
        { u: 0, v: targetH - 1 }
      ];
      const hMatrix = getPerspectiveTransform(corners, targetCorners);
      image = warpPerspective(image, targetW, targetH, hMatrix);
      await image.write(path.join(DEBUG_DIR, "warped.jpg"));
    }
  } else {
    // If pre-cropped, copy to intermediates directly
    await image.write(path.join(DEBUG_DIR, "cropped.jpg"));
    await image.write(path.join(DEBUG_DIR, "edges.jpg"));
    await image.write(path.join(DEBUG_DIR, "corners.jpg"));
    await image.write(path.join(DEBUG_DIR, "warped.jpg"));
  }

  // Stage 6: Final Decimation & Dynamic Range Stretching (OCR Input)
  image.resize({ w: 550 });
  image.resize({ w: 1400 });
  image.normalize();
  image.contrast(0.25);
  
  await image.write(path.join(DEBUG_DIR, "ocr_input.jpg"));
  return image;
}

exports.preprocessImage = async (filePath) => {
  try {
    const preprocessed = await preprocessPipeline(filePath);
    const tempOut = filePath + "_temp_pre.jpg";
    await preprocessed.write(tempOut);
    
    // Read buffer and encode to base64 Data URI
    const buffer = fs.readFileSync(tempOut);
    const base64 = buffer.toString("base64");
    fs.unlinkSync(tempOut);
    
    return {
      status: "Success",
      preprocessedImage: `data:image/jpeg;base64,${base64}`
    };
  } catch (err) {
    console.error(`[Scanner Pipeline] Preprocess error: ${err.message}`);
    throw err;
  }
};

exports.extractText = async (filePath) => {
  console.log(`[Tesseract OCR] Beginning extraction for file: ${filePath}`);
  
  if (!isValidImageHeader(filePath)) {
    console.log(`[Tesseract OCR] File has invalid or missing image header signatures. Bypassing extraction.`);
    return {
      text: "",
      confidence: 0,
    };
  }

  let worker;
  const processedPath = filePath + "_processed.jpg";
  try {
    const preprocessed = await preprocessPipeline(filePath);
    await preprocessed.write(processedPath);

    // Initialize worker for English language
    worker = await createWorker("eng");
    
    // Perform OCR recognition on the preprocessed file
    const { data: { text, confidence } } = await worker.recognize(processedPath);
    
    console.log(`[Tesseract OCR] Extraction finished. Confidence: ${confidence}%, Text Length: ${text?.length || 0}`);
    return {
      text: text || "",
      confidence: confidence / 100, // convert percentage to decimal format (0..1)
    };
  } catch (err) {
    console.error(`[Tesseract OCR] Error processing image: ${err.message}`);
    return {
      text: "",
      confidence: 0,
    };
  } finally {
    if (worker) {
      await worker.terminate().catch(err => {
        console.error(`[Tesseract OCR] Error terminating worker: ${err.message}`);
      });
    }
    if (fs.existsSync(processedPath)) {
      try {
        fs.unlinkSync(processedPath);
      } catch (err) {
        console.error(`[Tesseract OCR] Failed to unlink temp file: ${err.message}`);
      }
    }
  }
};
