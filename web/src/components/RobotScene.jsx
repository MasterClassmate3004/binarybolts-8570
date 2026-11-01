import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const offsets = {
  chassis: [0, 0, 0],
  systems: [0, 1.22, 0],
  intake: [-0.22, 2.18, 0.08],
  controls: [0.42, 0.78, 0.06],
  finish: [0.05, 1.74, -0.08],
};
const intervals = {
  chassis: [0, 0],
  controls: [0, 0.42],
  systems: [0.12, 0.56],
  intake: [0.32, 0.82],
  finish: [0.58, 1],
};
const smoothstep = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function assemblyKey(name) {
  if (/^Chassis/i.test(name)) return "chassis";
  if (/^Spindexer/i.test(name)) return "systems";
  if (/^FourBar/i.test(name)) return "intake";
  if (
    /MPM|PDH|Pdh|Breaker|Assembly 1|Robot Signal|Servo|2000-0025|LL4/i.test(
      name,
    )
  )
    return "controls";
  return "finish";
}

// Bake each named assembly's geometry into a few material batches. The original
// CAD file and hierarchy stay intact on disk; these batches reduce browser draws.
function prepareRobot(source) {
  source.updateMatrixWorld(true);
  const sourceRoot = source.children[0];
  const batches = new Map();
  const toYUp = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  const sourceMaterials = new Set();
  for (const assembly of sourceRoot.children) {
    const key = assemblyKey(assembly.name);
    assembly.traverse((mesh) => {
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      const geometry = new THREE.BufferGeometry();
      for (const name of ["position", "normal"]) {
        const attribute = mesh.geometry.getAttribute(name);
        if (!attribute) continue;
        const values = new Float32Array(attribute.count * 3);
        for (let i = 0; i < attribute.count; i++) {
          values[i * 3] = attribute.getX(i);
          values[i * 3 + 1] = attribute.getY(i);
          values[i * 3 + 2] = attribute.getZ(i);
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(values, 3));
      }
      const colors = mesh.geometry.getAttribute("color");
      if (colors) {
        const values = new Float32Array(colors.count * colors.itemSize);
        for (let i = 0; i < colors.count; i++) {
          values[i * colors.itemSize] = colors.getX(i);
          values[i * colors.itemSize + 1] = colors.getY(i);
          values[i * colors.itemSize + 2] = colors.getZ(i);
          if (colors.itemSize === 4) values[i * 4 + 3] = colors.getW(i);
        }
        geometry.setAttribute(
          "color",
          new THREE.BufferAttribute(values, colors.itemSize),
        );
      }
      if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index.clone());
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.applyMatrix4(toYUp);
      if (mesh.matrixWorld.determinant() < 0 && geometry.index) {
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) {
          const second = indices[i + 1];
          indices[i + 1] = indices[i + 2];
          indices[i + 2] = second;
        }
      }
      if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
      const batchId = key + "/" + mesh.material.uuid;
      if (!batches.has(batchId))
        batches.set(batchId, {
          key,
          material: mesh.material.clone(),
          geometries: [],
        });
      batches.get(batchId).geometries.push(geometry);
      sourceMaterials.add(mesh.material);
    });
  }
  const robot = new THREE.Group();
  const groups = new Map(
    Object.keys(offsets).map((key) => {
      const group = new THREE.Group();
      group.name = key;
      robot.add(group);
      return [key, group];
    }),
  );
  for (const { key, material, geometries } of batches.values()) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    // Onshape's display-color values are encoded as sRGB in this export.
    material.color.convertSRGBToLinear();
    const { r, g, b } = material.color;
    const isNeutral = Math.max(r, g, b) - Math.min(r, g, b) < 0.12;
    material.roughness = isNeutral && r > 0.3 ? 0.38 : 0.57;
    material.metalness = isNeutral && r > 0.3 ? 0.65 : 0.12;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    groups.get(key).add(mesh);
  }
  const bounds = new THREE.Box3().setFromObject(robot);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3.45 / Math.max(size.x, size.z);
  robot.scale.setScalar(scale);
  robot.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale,
  );
  source.traverse((mesh) => {
    if (mesh.isMesh) mesh.geometry.dispose();
  });
  sourceMaterials.forEach((material) => material.dispose());
  return { robot, groups, scale };
}

export default function RobotScene({
  progress = 0,
  interactive = false,
  resetKey = 0,
  onReady,
}) {
  const mount = useRef(null);
  const engine = useRef(null);
  const latestProgress = useRef(progress);
  const onReadyRef = useRef(onReady);
  const [status, setStatus] = useState("loading");
  const [loaded, setLoaded] = useState(0);
  latestProgress.current = progress;
  onReadyRef.current = onReady;

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let observer;
    let resize;
    let controls;
    let scene;
    let renderer;
    let environment;
    let visible = true;
    const host = mount.current;
    let current = latestProgress.current;
    let previousSeparation = 0;
    let homeDistance = 1;
    let prepared;
    let pmrem;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = window.innerWidth > 700;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.setClearColor("#191918");
      host.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      scene.background = new THREE.Color("#191918");
      scene.fog = new THREE.Fog("#191918", 12, 24);
      const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
      const homePosition = new THREE.Vector3(6.3, 5.1, 8.2);
      const target = new THREE.Vector3(0, 1.75, 0);
      camera.position.copy(homePosition);
      camera.lookAt(target);
      pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04);
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.3;
      scene.add(new THREE.HemisphereLight("#f9ead6", "#44464e", 0.7));
      const key = new THREE.DirectionalLight("#fff0d7", 3);
      key.position.set(4, 8, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -6;
      key.shadow.camera.right = 6;
      key.shadow.camera.top = 6;
      key.shadow.camera.bottom = -6;
      key.shadow.normalBias = 0.04;
      scene.add(key);
      const rim = new THREE.DirectionalLight("#cfdeed", 1.8);
      rim.position.set(-5, 5, -4);
      scene.add(rim);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({
          color: "#070706",
          roughness: 1,
          metalness: 0.05,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.04;
      floor.receiveShadow = true;
      scene.add(floor);
      if (interactive) {
        camera.position.set(4.6, 3.4, 5.9);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.4, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 4;
        controls.maxDistance = 16;
        controls.maxPolarAngle = Math.PI / 2 - 0.04;
        controls.enablePan = false;
        controls.addEventListener("change", requestFrame);
        controls.update();
        controls.saveState();
      }
      function render() {
        frame = 0;
        if (disposed || !visible) return;
        const targetProgress = latestProgress.current;
        current += (targetProgress - current) * 0.12;
        if (Math.abs(current - targetProgress) < 0.0005)
          current = targetProgress;
        if (prepared) {
          for (const [key, group] of prepared.groups) {
            const [start, end] = intervals[key];
            const amount =
              key === "chassis"
                ? 0
                : 1 - smoothstep((current - start) / (end - start));
            group.position
              .fromArray(offsets[key])
              .multiplyScalar(amount / prepared.scale);
          }
          if (!interactive) {
            const zoom = 1 - current * 0.1;
            camera.position.set(6.3 * zoom, 5.1 - current * 1.3, 8.2 * zoom);
            target.y = 1.75 - current * 0.7;
            camera.position
              .sub(target)
              .multiplyScalar(homeDistance)
              .add(target);
            camera.lookAt(target);
          } else {
            const separation = 1 - current;
            const ratio =
              (7 + separation * 3.5) / (7 + previousSeparation * 3.5);
            camera.position.sub(controls.target).multiplyScalar(ratio);
            controls.target.y = 0.95 + separation * 1.1;
            camera.position.add(controls.target);
            previousSeparation = separation;
          }
        }
        controls?.update();
        renderer.render(scene, camera);
        if (current !== targetProgress) requestFrame();
      }
      function requestFrame() {
        if (!frame && !disposed && visible)
          frame = requestAnimationFrame(render);
      }
      resize = new ResizeObserver(() => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.fov = width / height < 0.95 ? 40 : 30;
        homeDistance = 1;
        if (!interactive && width > 760 && width < 1100) {
          camera.fov = camera.aspect < 1.3 ? 45 : 38;
          homeDistance = 1.15;
        }
        if (!interactive && width > 760)
          camera.setViewOffset(width, height, -width * 0.18, 0, width, height);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        // Resizing clears the WebGL drawing buffer, including while the
        // scroll section moves back into view at a new breakpoint.
        const rect = host.getBoundingClientRect();
        visible = rect.bottom > -80 && rect.top < window.innerHeight + 80;
        cancelAnimationFrame(frame);
        frame = 0;
        requestFrame();
      });
      resize.observe(host);
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) requestFrame();
        },
        { rootMargin: "80px" },
      );
      observer.observe(host);
      engine.current = {
        requestFrame,
        controls,
        reset: () => {
          current = latestProgress.current;
          previousSeparation = 0;
          controls?.reset();
          requestFrame();
        },
      };
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        "/models/cannonbolt.glb",
        (gltf) => {
          if (disposed) {
            gltf.scene.traverse((mesh) => {
              if (mesh.isMesh) {
                mesh.geometry.dispose();
                if (!Array.isArray(mesh.material)) mesh.material.dispose();
              }
            });
            return;
          }
          prepared = prepareRobot(gltf.scene);
          scene.add(prepared.robot);
          setStatus("ready");
          onReadyRef.current?.();
          requestFrame();
        },
        (event) => {
          if (!disposed && event.total)
            setLoaded(Math.round((event.loaded / event.total) * 100));
        },
        (error) => {
          if (!disposed) {
            console.error("Robot model could not be loaded.", error);
            setStatus("error");
          }
        },
      );
      requestFrame();
    } catch (error) {
      console.error("3D renderer could not start.", error);
      setStatus("error");
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resize?.disconnect();
      controls?.dispose();
      scene?.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      environment?.dispose();
      pmrem?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      engine.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    engine.current?.requestFrame();
  }, [progress]);
  useEffect(() => {
    engine.current?.reset();
  }, [resetKey]);

  return (
    <div
      className={"robot-canvas " + (interactive ? "is-interactive" : "")}
      ref={mount}
      aria-label={
        interactive
          ? "Interactive 3D model of Cannonbolt. Drag to rotate and scroll to zoom."
          : "Cannonbolt robot assembling as you scroll."
      }
      role="img"
    >
      {status !== "ready" && (
        <div className="model-status" role="status">
          <span className="model-status-rule" />
          <span>
            {status === "error"
              ? "3D view unavailable on this device"
              : "Loading Cannonbolt"}
          </span>
          {status === "loading" && <small>{loaded}%</small>}
        </div>
      )}
    </div>
  );
}
