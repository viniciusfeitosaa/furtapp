import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  Material,
  Mesh,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HAIR_GLB_ASSET } from "@/lib/tryon/hairAssets";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

/** Índices Face Mesh. */
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_TEMPLE = 234;
const RIGHT_TEMPLE = 454;
/** Pontos da linha anterior — média estabiliza a âncora. */
const HAIRLINE = [54, 21, 162, 103, 67, 109, 10, 338, 297, 332, 284] as const;

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;
type Landmark = { x: number; y: number; z: number };

export type GlbHairDrawOpts = {
  intensity: number;
};

/**
 * Overlay 3D: landmarks → pose 2.5D no plano do vídeo.
 * Calibração de orientação em HAIR_GLB_ASSET.fit (rotX/Y/Z, anchorUp).
 */
export function createGlbHairOverlayEngine() {
  let landmarker: FaceLandmarkerType | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: OrthographicCamera | null = null;
  let hairRoot: Group | null = null;
  let hairPivot: Group | null = null;
  let hairModel: Group | null = null;
  let lastTs = -1;
  let ready = false;
  let inited = false;

  const _size = new Vector3();
  const _center = new Vector3();
  const _box = new Box3();

  return {
    kind: "glb-overlay" as const,
    ownsCamera: false as const,

    async init(canvas: HTMLCanvasElement) {
      if (inited && renderer?.domElement === canvas) return;
      if (inited) {
        landmarker?.close();
        renderer?.dispose();
        landmarker = null;
        renderer = null;
        scene = null;
        camera = null;
        hairRoot = null;
        hairPivot = null;
        hairModel = null;
        ready = false;
        inited = false;
      }

      const visionMod = await import("@mediapipe/tasks-vision");
      const vision = await visionMod.FilesetResolver.forVisionTasks(WASM_ROOT);

      try {
        landmarker = await visionMod.FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
      } catch {
        landmarker = await visionMod.FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
      }

      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(new Color(0x000000), 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = "srgb";

      scene = new Scene();
      camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
      camera.position.set(0, 0, 1000);

      scene.add(new AmbientLight(0xffffff, 1.15));
      const key = new DirectionalLight(0xffffff, 0.75);
      key.position.set(0.35, 0.9, 1);
      scene.add(key);

      hairRoot = new Group();
      scene.add(hairRoot);

      // Pivot: rotação fixa do asset + escala; root = pose na face
      hairPivot = new Group();
      hairRoot.add(hairPivot);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(HAIR_GLB_ASSET.glbUrl);
      hairModel = gltf.scene;

      hairModel.traverse((obj) => {
        if (!(obj instanceof Mesh)) return;
        obj.frustumCulled = false;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of mats) {
          if (!(m instanceof Material)) continue;
          // Esconde o “oco” interno (backfaces) e corta alpha fraco
          m.transparent = true;
          m.alphaTest = 0.28;
          m.depthWrite = true;
          m.side = FrontSide;
          m.needsUpdate = true;
        }
      });

      _box.setFromObject(hairModel);
      _box.getSize(_size);
      _box.getCenter(_center);
      const maxDim = Math.max(_size.x, _size.y, _size.z, 1e-8);
      const unitScale = 1 / maxDim;
      hairModel.scale.setScalar(unitScale);
      hairModel.position.set(
        -_center.x * unitScale,
        -_center.y * unitScale,
        -_center.z * unitScale,
      );

      const { rotX, rotY, rotZ } = HAIR_GLB_ASSET.fit;
      hairPivot.rotation.set(rotX, rotY, rotZ);
      hairPivot.add(hairModel);

      ready = true;
      inited = true;
    },

    dispose() {
      landmarker?.close();
      landmarker = null;
      hairModel = null;
      hairPivot = null;
      hairRoot = null;
      scene = null;
      camera = null;
      renderer?.dispose();
      renderer = null;
      ready = false;
      inited = false;
    },

    draw(video: HTMLVideoElement, opts: GlbHairDrawOpts): boolean {
      if (
        !ready ||
        !landmarker ||
        !renderer ||
        !scene ||
        !camera ||
        !hairRoot
      ) {
        return false;
      }
      if (video.readyState < 2) return false;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = renderer.domElement;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.left = -w / 2;
        camera.right = w / 2;
        camera.top = h / 2;
        camera.bottom = -h / 2;
        camera.updateProjectionMatrix();
      }

      const now = performance.now();
      if (now <= lastTs) return false;
      lastTs = now;

      let result;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch {
        return false;
      }

      const lms = result.faceLandmarks?.[0] as Landmark[] | undefined;
      if (!lms?.length) {
        hairRoot.visible = false;
        renderer.render(scene, camera);
        return false;
      }

      const forehead = lms[FOREHEAD];
      const chin = lms[CHIN];
      const left = lms[LEFT_TEMPLE];
      const right = lms[RIGHT_TEMPLE];
      if (!forehead || !chin || !left || !right) {
        hairRoot.visible = false;
        renderer.render(scene, camera);
        return false;
      }

      const toX = (lm: Landmark) => (lm.x - 0.5) * w;
      const toY = (lm: Landmark) => -(lm.y - 0.5) * h;

      const fx = toX(forehead);
      const fy = toY(forehead);
      const cx = toX(chin);
      const cy = toY(chin);
      const lx = toX(left);
      const ly = toY(left);
      const rx = toX(right);
      const ry = toY(right);

      // Média da linha anterior (mais estável que só o ponto 10)
      let hx = 0;
      let hy = 0;
      let hn = 0;
      for (const idx of HAIRLINE) {
        const lm = lms[idx];
        if (!lm) continue;
        hx += toX(lm);
        hy += toY(lm);
        hn += 1;
      }
      if (hn > 0) {
        hx /= hn;
        hy /= hn;
      } else {
        hx = fx;
        hy = fy;
      }

      const faceLen = Math.hypot(fx - cx, fy - cy) || 1;
      const faceWidth = Math.hypot(rx - lx, ry - ly) || faceLen;

      const upX = (fx - cx) / faceLen;
      const upY = (fy - cy) / faceLen;
      // Eixo lateral (esquerda → direita na tela)
      const rightX = (rx - lx) / faceWidth;
      const rightY = (ry - ly) / faceWidth;
      const angle = Math.atan2(upX, upY);

      const fit = HAIR_GLB_ASSET.fit;
      const intensity = Math.min(1.4, Math.max(0.3, opts.intensity));
      const targetH = faceLen * (0.95 + intensity * 0.2) * fit.scale;

      // Âncora na hairline, com ajuste fino
      const ax =
        hx +
        upX * faceLen * fit.anchorUp +
        rightX * faceWidth * fit.offsetX;
      const ay =
        hy +
        upY * faceLen * fit.anchorUp +
        rightY * faceWidth * fit.offsetX;

      hairRoot.visible = intensity > 0.05;
      hairRoot.position.set(ax, ay, fit.offsetZ * faceWidth);
      // Só roll no plano da câmera — pitch/yaw ficam no pivot do asset
      hairRoot.rotation.set(0, 0, -angle);
      hairRoot.scale.setScalar(targetH);

      renderer.render(scene, camera);
      return true;
    },
  };
}

export type GlbHairOverlayEngine = ReturnType<typeof createGlbHairOverlayEngine>;
