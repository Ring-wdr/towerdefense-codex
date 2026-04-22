import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const INPUT_DIR = path.resolve("src/assets/boss");
const OUTPUT_DIR = path.resolve("src/assets/boss/transparent");
const FILES = ["frost-boss.png", "flame-boss.png", "dracula-boss.png"];
const MAX_CHANNEL = 16;
const MAX_SUM = 40;

function isEdgeBackground(data, pixelIndex) {
  const offset = pixelIndex * 4;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];

  return alpha > 0
    && red <= MAX_CHANNEL
    && green <= MAX_CHANNEL
    && blue <= MAX_CHANNEL
    && red + green + blue <= MAX_SUM;
}

function removeEdgeConnectedBlack(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueueIfBackground = (x, y) => {
    const index = y * width + x;
    if (visited[index] || !isEdgeBackground(data, index)) {
      return;
    }
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x, 0);
    enqueueIfBackground(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(0, y);
    enqueueIfBackground(width - 1, y);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;

    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    data[offset + 3] = 0;

    if (x > 0) {
      enqueueIfBackground(x - 1, y);
    }
    if (x + 1 < width) {
      enqueueIfBackground(x + 1, y);
    }
    if (y > 0) {
      enqueueIfBackground(x, y - 1);
    }
    if (y + 1 < height) {
      enqueueIfBackground(x, y + 1);
    }
  }
}

async function processFile(fileName) {
  const inputPath = path.join(INPUT_DIR, fileName);
  const outputPath = path.join(OUTPUT_DIR, fileName.replace(".png", "-transparent.png"));
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeEdgeConnectedBlack(data, info.width, info.height);

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  }).png().toFile(outputPath);

  return outputPath;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const fileName of FILES) {
    const outputPath = await processFile(fileName);
    console.log(outputPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
