import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  Material,
  Matrix4,
  Mesh,
  PerspectiveCamera,
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

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;

export type GlbHairDrawOpts = {
  /** Maior dimensão do cabelo no espaço da face, em cm. */
  scale: number;
  /** Deslocamento vertical no espaço da face (cm). Negativo = desce. */
  offsetY: number;
};

/**
 * Caminho correto para o resultado ideal (rosto + cabelo 3D):
 * `facialTransformationMatrixes` + PerspectiveCamera FOV 63° em centímetros
 * (mesmo referencial do MediaPipe / exemplo three.js webcam).
 * O cabelo herda yaw/pitch/roll reais da cabeça — não um offset 2.5D.
 */
export function createGlbHairOverlayEngine() {
  let landmarker: FaceLandmarkerType | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let hairRoot: Group | null = null;
  let hairPivot: Group | null = null;
  let hairModel: Group | null = null;
  let lastTs = -1;
  let ready = false;
  let inited = false;

  const faceMatrix = new Matrix4();
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
          outputFacialTransformationMatrixes: true,
        });
      } catch {
        landmarker = await visionMod.FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
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
      // Espaço métrico MediaPipe: cm, FOV 63°, near/far em cm (ex. three.js webcam)
      camera = new PerspectiveCamera(63, 1, 1, 10000);

      scene.add(new AmbientLight(0xffffff, 1.25));
      const key = new DirectionalLight(0xffffff, 0.8);
      key.position.set(40, 120, 80);
      scene.add(key);

      hairRoot = new Group();
      hairRoot.matrixAutoUpdate = false;
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
          m.alphaTest = 0.2;
          m.depthWrite = true;
          m.side = FrontSide;
          m.needsUpdate = true;
        }
      });

      // Mesh unitário (maxDim=1), centralizado
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

      // Pivot no scalp (base do volume)
      hairModel.updateMatrixWorld(true);
      _box.setFromObject(hairModel);
      const scalpY =
        _box.min.y +
        (_box.max.y - _box.min.y) * HAIR_GLB_ASSET.fit.scalpFrac;
      hairModel.position.y -= scalpY;

      const fit = HAIR_GLB_ASSET.fit;
      hairPivot.rotation.set(fit.rotX, fit.rotY, fit.rotZ);
      hairPivot.position.set(fit.localX, fit.localY, fit.localZ);
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
        !hairRoot ||
        !hairPivot
      ) {
        return false;
      }
      if (video.readyState < 2) return false;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = renderer.domElement;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
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

      const mats = result.facialTransformationMatrixes;
      if (!mats?.length || !mats[0]?.data || mats[0].data.length < 16) {
        hairRoot.visible = false;
        renderer.render(scene, camera);
        return false;
      }

      // Vídeo + canvas já são espelhados via CSS — matriz crua, sem mirror extra
      faceMatrix.fromArray(mats[0].data);
      hairRoot.matrix.copy(faceMatrix);
      hairRoot.matrixWorldNeedsUpdate = true;
      hairRoot.visible = true;

      const fit = HAIR_GLB_ASSET.fit;
      hairPivot.position.set(fit.localX, opts.offsetY, fit.localZ);
      hairPivot.scale.setScalar(Math.min(60, Math.max(8, opts.scale)));

      // Câmera fixa na origem (não mover — senão o overlay descola do vídeo)
      renderer.render(scene, camera);
      return true;
    },
  };
}

export type GlbHairOverlayEngine = ReturnType<typeof createGlbHairOverlayEngine>;
