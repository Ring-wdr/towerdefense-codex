export interface OpaqueBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CenteredPlacement {
  extract: OpaqueBounds;
  left: number;
  top: number;
}

export function findOpaqueBounds(
  buffer: Uint8Array,
  width: number,
  height: number,
): OpaqueBounds | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alphaIndex = (y * width + x) * 4 + 3;
      if (buffer[alphaIndex] === 0) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right === -1) {
    return null;
  }

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

export function getCenteredPlacement(
  buffer: Uint8Array,
  width: number,
  height: number,
): CenteredPlacement {
  const bounds = findOpaqueBounds(buffer, width, height);
  if (!bounds) {
    return {
      extract: {
        left: 0,
        top: 0,
        width,
        height,
      },
      left: 0,
      top: 0,
    };
  }

  return {
    extract: bounds,
    left: Math.floor((width - bounds.width) / 2),
    top: Math.floor((height - bounds.height) / 2),
  };
}
