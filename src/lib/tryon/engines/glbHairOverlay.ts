import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  Matrix4,
  PerspectiveCamera,
  Scene,
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
  /** Opacidade / presença do modelo 0..1 */
  intensity: number;
};

/**
 * Overlay 3D: Face Landmarker (matriz facial) + GLB de cabelo (Sketchfab CC BY).
 * Desenha em canvas WebGL transparente sobre o vídeo espelhado.
 */
export function createGlbHairOverlayEngine() {
  let landmarker: FaceLandmarkerType | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let hairRoot: Group | null = null;
  let hairModel: Group | null = null;
  let lastTs = -1;
  let ready = false;
  let inited = false;

  const faceMatrix = new Matrix4();
  const mirrorX = new Matrix4().makeScale(-1, 1, 1);

  return {
    kind: "glb-overlay" as const,
    ownsCamera: false as const,

    async init(canvas: HTMLCanvasElement) {
      if (inited && renderer?.domElement === canvas) return;
      if (inited) this.dispose();

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
        powerPreference: "high-performance",
      });
      renderer.setClearColor(new Color(0x000000), 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      scene = new Scene();
      camera = new PerspectiveCamera(63, 1, 0.01, 100);

      scene.add(new AmbientLight(0xffffff, 0.75));
      const key = new DirectionalLight(0xfff0e0, 0.9);
      key.position.set(0.35, 1.1, 0.55);
      scene.add(key);

      hairRoot = new Group();
      scene.add(hairRoot);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(HAIR_GLB_ASSET.glbUrl);
      hairModel = gltf.scene;
      hairModel.traverse((obj) => {
        const mesh = obj as { isMesh?: boolean; frustumCulled?: boolean };
        if (mesh.isMesh) mesh.frustumCulled = false;
      });

      const { scale, offsetY, offsetZ } = HAIR_GLB_ASSET.fit;
      hairModel.scale.setScalar(scale);
      hairModel.position.set(0, offsetY, offsetZ);
      hairRoot.add(hairModel);
      ready = true;
      inited = true;
    },

    dispose() {
      landmarker?.close();
      landmarker = null;
      hairModel = null;
      hairRoot = null;
      scene = null;
      camera = null;
      renderer?.dispose();
      renderer = null;
      ready = false;
      inited = false;
    },

    draw(video: HTMLVideoElement, opts: GlbHairDrawOpts): boolean {
      if (!ready || !landmarker || !renderer || !scene || !camera || !hairRoot) {
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
      const hasFace = Boolean(mats?.length);
      hairRoot.visible = hasFace && opts.intensity > 0.05;

      if (hasFace && mats[0]) {
        const d = mats[0].data;
        if (d.length >= 16) {
          // data no formato esperado por Matrix4.fromArray (column-major)
          faceMatrix.fromArray(d);
          faceMatrix.premultiply(mirrorX);
          hairRoot.matrixAutoUpdate = false;
          hairRoot.matrix.copy(faceMatrix);
          hairRoot.matrixWorldNeedsUpdate = true;
        }

        const s = 0.85 + opts.intensity * 0.2;
        if (hairModel) hairModel.scale.setScalar(HAIR_GLB_ASSET.fit.scale * s);
      }

      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, -1);
      camera.fov = 63;
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      return hasFace;
    },
  };
}

export type GlbHairOverlayEngine = ReturnType<typeof createGlbHairOverlayEngine>;
