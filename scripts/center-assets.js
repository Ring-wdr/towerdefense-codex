import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { getCenteredPlacement } from "../src/assets/centering.js";

const ROOT = process.cwd();
const DEFAULT_DIRECTORIES = [
  "src/assets/towers",
  "src/assets/enemies",
];

async function main() {
  const args = new Set(process.argv.slice(2));
  const shouldWrite = args.has("--write");
  const directories = DEFAULT_DIRECTORIES.map((directory) => path.join(ROOT, directory));
  const files = await collectPngFiles(directories);

  if (!files.length) {
    console.log("No PNG assets found.");
    return;
  }

  let changedCount = 0;
  for (const file of files) {
    const result = await recenterImage(file, shouldWrite);
    if (result.changed) {
      changedCount += 1;
    }
    console.log(formatResult(result, ROOT, shouldWrite));
  }

  console.log(
    `${shouldWrite ? "Updated" : "Would update"} ${changedCount} of ${files.length} PNG assets.`,
  );
}

async function collectPngFiles(directories) {
  const files = [];

  for (const directory of directories) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const resolved = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectPngFiles([resolved])));
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
        files.push(resolved);
      }
    }
  }

  return files.sort();
}

async function recenterImage(filePath, shouldWrite) {
  const image = sharp(filePath, { animated: false });
  const { data, info } = await image
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const placement = getCenteredPlacement(data, info.width, info.height);
  const changed =
    placement.left !== placement.extract.left || placement.top !== placement.extract.top;

  if (!changed) {
    return {
      changed,
      filePath,
      info,
      placement,
    };
  }

  if (shouldWrite) {
    const centered = await sharp({
      create: {
        width: info.width,
        height: info.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: await image.clone().extract(placement.extract).png().toBuffer(),
          left: placement.left,
          top: placement.top,
        },
      ])
      .png()
      .toBuffer();

    await fs.writeFile(filePath, centered);
  }

  return {
    changed,
    filePath,
    info,
    placement,
  };
}

function formatResult(result, root, shouldWrite) {
  const relativePath = path.relative(root, result.filePath);
  if (!result.changed) {
    return `keep  ${relativePath}`;
  }

  const dx = result.placement.left - result.placement.extract.left;
  const dy = result.placement.top - result.placement.extract.top;
  return `${shouldWrite ? "write" : "shift"} ${relativePath} (${dx >= 0 ? "+" : ""}${dx}, ${dy >= 0 ? "+" : ""}${dy})`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
