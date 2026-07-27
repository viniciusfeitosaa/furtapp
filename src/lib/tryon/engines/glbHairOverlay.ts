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

const FOREHEAD = 10;
const CHIN = 152;
const LEFT_TEMPLE = 234;
const RIGHT_TEMPLE = 454;

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;
type Landmark = { x: number; y: number; z: number };

export type GlbHairDrawOpts = {
  intensity: number;
};

/**
 * Cabelo 3D ancorado no crânio:
 * - pivot na “base/scalp” do mesh (não no centro)
 * - posição no topo estimado da cabeça
 * - escala pela largura da face para cobrir orelha a orelha
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

      scene.add(new AmbientLight(0xffffff, 1.2));
      const key = new DirectionalLight(0xffffff, 0.7);
      key.position.set(0.3, 1, 1);
      scene.add(key);

      hairRoot = new Group();
      scene.add(hairRoot);
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
          m.transparent = true;
          m.alphaTest = 0.22;
          m.depthWrite = true;
          m.side = FrontSide;
          m.needsUpdate = true;
        }
      });

      // 1) Normalizar para maxDim = 1 e centralizar
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

      // 2) Pivot no scalp: origem perto da base do mesh, volume sobe em +Y
      hairModel.updateMatrixWorld(true);
      _box.setFromObject(hairModel);
      const scalpY =
        _box.min.y +
        (_box.max.y - _box.min.y) * HAIR_GLB_ASSET.fit.scalpFrac;
      hairModel.position.y -= scalpY;

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

      const faceLen = Math.hypot(fx - cx, fy - cy) || 1;
      const faceWidth = Math.hypot(rx - lx, ry - ly) || faceLen;

      const upX = (fx - cx) / faceLen;
      const upY = (fy - cy) / faceLen;
      const rightDirX = (rx - lx) / faceWidth;
      const rightDirY = (ry - ly) / faceWidth;
      const angle = Math.atan2(upX, upY);

      const fit = HAIR_GLB_ASSET.fit;
      const intensity = Math.min(1.5, Math.max(0.4, opts.intensity));

      // Topo do crânio ≈ fronte + crownUp × faceLen
      const ax =
        fx +
        upX * faceLen * fit.crownUp +
        rightDirX * faceWidth * fit.offsetX;
      const ay =
        fy +
        upY * faceLen * fit.crownUp +
        rightDirY * faceWidth * fit.offsetX;

      // Escala para cobrir a cabeça (orelha a orelha + volume no topo)
      const byWidth = faceWidth * fit.widthMul;
      const byHeight = faceLen * fit.heightMul;
      const s = Math.max(byWidth, byHeight) * fit.scale * intensity;

      hairRoot.visible = true;
      hairRoot.position.set(ax, ay, fit.offsetZ * faceWidth);
      hairRoot.rotation.set(0, 0, -angle);
      hairRoot.scale.setScalar(s);

      renderer.render(scene, camera);
      return true;
    },
  };
}

export type GlbHairOverlayEngine = ReturnType<typeof createGlbHairOverlayEngine>;
