# Interchange

`@uvcp/interchange` reads and writes the in-memory scene. The scene value stays in `@uvcp/core`. A format is a `read` and `write` pair registered by id. glTF 2.0 is the first id, `"gltf"`. Both `.gltf` JSON and `.glb` use that id.

glTF is the first target because the scene is a hierarchy of rectangles and boxes with finite transforms. OpenTimelineIO needs a timeline this scene does not have. STEP and DXF need a CAD kernel, and the usual Open CASCADE binding is LGPL, which this repository does not accept. USD's maintained API is C++ and Python.

The glTF adapter uses `@gltf-transform/core` and `gl-matrix`. Reads and writes use `WebIO` in memory, with a silent logger. The Node I/O service is not constructed, because constructing it loads the host filesystem. `WebIO.read` is not called, so a document cannot cause a network fetch.

## glTF mapping

- Node name is the scene id.
- Translation, rotation, and scale are the node's local transform. Rotation in the scene is radians, intrinsic XYZ, the order implemented by `gl-matrix` `quat.fromEuler`. glTF stores that rotation as a float32 quaternion, so a right angle survives within 0.001 radians.
- Width, height, and depth are the mesh extents in local space. Node scale is not baked into those extents. The mesh is centered on the node origin. A mesh that is not centered moves the scene position by the rotated, scaled center.
- A rectangle is a quad in the local XY plane (no Z extent), the local XZ plane, or the local YZ plane. Export writes the XY plane. A box is a rectangular prism whose vertices sit on all eight corners.
- Any other mesh, a skin, a morph target, more than one primitive, or more than one glTF scene is rejected. The whole document fails. No partial scene is returned.
- Materials, cameras, animations, and textures are not part of the scene. Export writes one matte material so a viewer can open the mesh. Import does not keep it.
- The byte cap is 4 MiB, checked before parse. It is not the scene-document cap. Accessor counts are checked before the library materializes them. Buffer URIs must be `data:` URIs. File, relative, and network URIs are rejected. `__proto__`, `constructor`, and `prototype` keys are rejected for both JSON and GLB.

`renderNull` is unchanged. The shell does not import this package. The editor calls `importDocument` and `exportDocument`. The toolbar imports a file into the open project, shows those shapes on the sheet, and exports the project or the selection. Sheet placement is editor behavior and does not change this mapping.
