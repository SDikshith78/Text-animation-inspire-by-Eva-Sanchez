import { useEffect, useRef } from "react";
import {
  Renderer,
  Camera,
  Transform,
  Program,
  Mesh,
  Geometry,
  Texture,
  Vec2,
} from "ogl";
import GUI from "lil-gui";

import vertex from "../shaders/text.vert.js";
import fragment from "../shaders/text.frag.js";

export default function LiquidText() {
  const containerRef = useRef(null);
  const initialized = useRef(false);


  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /* ---------- Renderer ---------- */
    const renderer = new Renderer({ alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    containerRef.current.appendChild(gl.canvas);

    /* ---------- Camera ---------- */
    const camera = new Camera(gl);
    camera.position.z = 1.6;

    const scene = new Transform();

    /* ---------- Mouse ---------- */
    const mouse = new Vec2(0.5, 0.5);
    const mouseLerp = new Vec2(0.5, 0.5);

    // fake mouse / lens
    const lens = new Vec2(0.5, 0.5);
    const lensPrev = new Vec2(0.5, 0.5);
    const velocity = new Vec2(0, 0);

    function onMouseMove(e) {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    }

    window.addEventListener("mousemove", onMouseMove);

    /* ---------- Load MSDF ---------- */
    Promise.all([
      fetch("/fonts/Inter-Medium.json").then((r) => r.json()),
      new Promise((resolve) => {
        const img = new Image();
        img.src = "/fonts/Inter-Medium.png";
        img.onload = () => resolve(img);
      }),
    ]).then(([font, image]) => {
      const texture = new Texture(gl);
      texture.image = image;

      const text = "Sai Dikshith";

      const positions = [];
      const uvs = [];
      const indices = [];
      const glyphIndex = [];

      let cursorX = 0;
      let index = 0;
      const SCALE = 0.5;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = font.glyphs.find((g) => g.unicode === char.charCodeAt(0));

        if (!glyph || !glyph.planeBounds) {
          cursorX += 0.05;
          continue;
        }

        const pb = glyph.planeBounds;
        const ab = glyph.atlasBounds;

        const x0 = (pb.left + cursorX) * SCALE;
        const x1 = (pb.right + cursorX) * SCALE;
        const y0 = pb.bottom * SCALE;
        const y1 = pb.top * SCALE;

        positions.push(x0, y0, x1, y0, x1, y1, x0, y1);

        const w = font.atlas.width;
        const h = font.atlas.height;

        uvs.push(
          ab.left / w,
          ab.bottom / h,
          ab.right / w,
          ab.bottom / h,
          ab.right / w,
          ab.top / h,
          ab.left / w,
          ab.top / h,
        );

        for (let v = 0; v < 4; v++) glyphIndex.push(i);

        indices.push(index, index + 1, index + 2, index, index + 2, index + 3);

        index += 4;
        cursorX += glyph.advance;
      }

      const geometry = new Geometry(gl, {
        position: { size: 2, data: new Float32Array(positions) },
        uv: { size: 2, data: new Float32Array(uvs) },
        glyphIndex: { size: 1, data: new Float32Array(glyphIndex) },
        index: { data: new Uint16Array(indices) },
      });

      const program = new Program(gl, {
        vertex,
        fragment,
        transparent: true,
        uniforms: {
          uMap: { value: texture },
          uMouse: { value: lens }, // 👈 shader uses lens
          uVelocity: { value: velocity },
          uTime: { value: 0 },
          uStrength: { value: 0.23 },
          uRadius: { value: 0.07 },
          uFrequency: { value: 15 },
          uSpeed: { value: 3 },
          uGlyphCount: { value: text.length },
          uChromatic: { value: 0.002 },
          uPhase: { value: 0 },
        },
      });

      /* ---------------- GUI ---------------- */
      const gui = new GUI();
      gui
        .add(program.uniforms.uStrength, "value", 0, 30, 0.05)
        .name("Strength");
      gui.add(program.uniforms.uRadius, "value", 0.05, 2, 0.05).name("Radius");
      gui.add(program.uniforms.uFrequency, "value", 1, 50, 1).name("Frequency");
      gui.add(program.uniforms.uSpeed, "value", 0.5, 11, 0.5).name("Speed");
      gui
        .add(program.uniforms.uChromatic, "value", 0, 3, 0.1)
        .name("Chromatic");

      const mesh = new Mesh(gl, { geometry, program });
      mesh.position.x = -cursorX * SCALE * 0.5;
      scene.addChild(mesh);

      /* ---------- Resize ---------- */
      function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({
          aspect: gl.canvas.width / gl.canvas.height,
        });
      }

      window.addEventListener("resize", resize);
      resize();

      /* ---------- Render ---------- */
  let prevLetterIndex = -1;

      function render(t) {
        // smooth real mouse
        mouseLerp.lerp(mouse, 0.23);

        // lens tween (fake mouse)
        lens.lerp(mouseLerp, 0.45);

        // velocity from lens movement
        velocity.x += (lens.x - lensPrev.x - velocity.x) * 0.55;
        velocity.y += (lens.y - lensPrev.y - velocity.y) * 0.35;

        const letterIndex = Math.floor(lens.x * text.length);

if (letterIndex !== prevLetterIndex) {
  program.uniforms.uPhase.value = 0.0;

  velocity.x = 0.0;
  velocity.y = 0.0;

  prevLetterIndex = letterIndex;
}


        let v = Math.max(-0.02, Math.min(0.02, velocity.x));

        if (Math.abs(v) > 0.0001) {
          program.uniforms.uPhase.value += v * 45.0;

          if (program.uniforms.uPhase.value > 1000.0)
            program.uniforms.uPhase.value -= 1000.0;
          if (program.uniforms.uPhase.value < -1000.0)
            program.uniforms.uPhase.value += 1000.0;
        }

        lensPrev.copy(lens);

        program.uniforms.uTime.value = t * 0.001;

        renderer.render({ scene, camera });
        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
}
