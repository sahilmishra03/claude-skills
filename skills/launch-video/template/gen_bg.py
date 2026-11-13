"""Generates assets/backdrop.jpg: the soft light mesh gradient behind the MacBook (2112x1188)."""
import numpy as np
from PIL import Image


def hexc(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def backdrop(W=2112, H=1188):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = x / W, y / H
    img = np.ones((H, W, 3), np.float32) * hexc("#f4efe8")
    for cx, cy, r, c in [
        (0.08, 0.10, 0.45, "#ffd9c2"),
        (0.92, 0.12, 0.42, "#d9dcff"),
        (0.85, 0.95, 0.50, "#e7d4ff"),
        (0.12, 0.92, 0.48, "#cfeedd"),
        (0.50, 0.50, 0.38, "#fbf7f1"),
    ]:
        w = np.exp(-(((u - cx) / r) ** 2 + ((v - cy) / (r * 1.1)) ** 2))[..., None]
        img = img * (1 - w * 0.85) + hexc(c) * w * 0.85
    grain = np.random.default_rng(7).normal(0, 0.006, (H, W))[..., None]
    Image.fromarray(((img + grain).clip(0, 1) * 255).astype(np.uint8)).save("assets/backdrop.jpg", quality=92, subsampling=0)


if __name__ == "__main__":
    backdrop()
