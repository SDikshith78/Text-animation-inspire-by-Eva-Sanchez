import { Geometry } from "ogl";

/**
 * Builds MSDF text geometry in CLIP SPACE
 */
export function createMSDFText(gl, font, text) {
  const positions = [];
  const uvs = [];
  const indices = [];

  let cursorX = 0;
  let index = 0;

  const fontSize = 1; // logical units

  for (const char of text) {
    const glyph = font.glyphs.find(
      g => g.unicode === char.charCodeAt(0)
    );

    if (!glyph || !glyph.planeBounds) {
      cursorX += 0.4;
      continue;
    }

    const pb = glyph.planeBounds;
    const ab = glyph.atlasBounds;

    const x0 = cursorX + pb.left * fontSize;
    const x1 = cursorX + pb.right * fontSize;
    const y0 = pb.bottom * fontSize;
    const y1 = pb.top * fontSize;

    positions.push(
      x0, y0,
      x1, y0,
      x1, y1,
      x0, y1
    );

    const u0 = ab.left / font.atlas.width;
    const u1 = ab.right / font.atlas.width;
    const v0 = ab.bottom / font.atlas.height;
    const v1 = ab.top / font.atlas.height;

    uvs.push(
      u0, v1,
      u1, v1,
      u1, v0,
      u0, v0
    );

    indices.push(
      index, index + 1, index + 2,
      index, index + 2, index + 3
    );

    index += 4;
    cursorX += glyph.advance * fontSize;
  }

  return new Geometry(gl, {
    position: { size: 2, data: new Float32Array(positions) },
    uv: { size: 2, data: new Float32Array(uvs) },
    index: { data: new Uint16Array(indices) }
  });
}
