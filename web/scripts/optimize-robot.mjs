import { NodeIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  EXTMeshoptCompression,
} from "@gltf-transform/extensions";
import {
  dedup,
  join,
  weld,
  simplify,
  prune,
  reorder,
  getBounds,
} from "@gltf-transform/functions";
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const source = path.resolve(project, "..", "Final Robot Assembly.glb");
const destination = path.join(project, "public/models/cannonbolt.glb");
await mkdir(path.dirname(destination), { recursive: true });
await Promise.all([
  MeshoptEncoder.ready,
  MeshoptDecoder.ready,
  MeshoptSimplifier.ready,
]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const document = await io.read(source);
const originalBounds = getBounds(document.getRoot().listScenes()[0]);
const countTriangles = () =>
  document
    .getRoot()
    .listMeshes()
    .reduce(
      (sum, mesh) =>
        sum +
        mesh
          .listPrimitives()
          .reduce(
            (n, primitive) =>
              n +
              (primitive.getIndices()?.getCount() ??
                primitive.getAttribute("POSITION").getCount()) /
                3,
            0,
          ),
      0,
    );
const originalTriangles = countTriangles();
await document.transform(
  dedup(),
  join({ keepMeshes: true }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.1, error: 0.008 }),
  prune({ keepLeaves: true }),
  reorder({ encoder: MeshoptEncoder, target: "size" }),
);
// Quantizing this CAD's shared geometry changes nested component transforms.
// Compress float buffers losslessly instead, retaining the original coordinates.
document
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(destination, document);
const roundtrip = await io.read(destination);
const roundtripBounds = getBounds(roundtrip.getRoot().listScenes()[0]);
const boundsError = Math.max(
  ...["min", "max"].flatMap((key) =>
    originalBounds[key].map((value, index) =>
      Math.abs(value - roundtripBounds[key][index]),
    ),
  ),
);
if (boundsError > 0.001)
  throw new Error(
    "Optimized robot bounds differ from source by " + boundsError + " m.",
  );
const root = document.getRoot().listScenes()[0].listChildren()[0];
const manifest = {
  title: "Cannonbolt 8570",
  source: "Final Robot Assembly.glb",
  originalBytes: (await stat(source)).size,
  optimizedBytes: (await stat(destination)).size,
  originalTriangles,
  optimizedTriangles: countTriangles(),
  originalBounds,
  boundsError,
  bounds: getBounds(document.getRoot().listScenes()[0]),
  rootName: root.getName(),
  assemblies: root
    .listChildren()
    .map((node) => ({ name: node.getName(), bounds: getBounds(node) })),
  note: "Web copy simplified and meshopt-compressed. Original assembly hierarchy retained. Source export preserved outside public/.",
};
await writeFile(
  path.join(project, "public/models/manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(
  JSON.stringify(
    {
      ...manifest,
      assemblies: manifest.assemblies.filter(
        (a) => !a.name.startsWith("occurrence"),
      ),
    },
    null,
    2,
  ),
);
