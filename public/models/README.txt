Elaris Gardens uses original procedural Three.js geometry built in code
(src/pages/Experience.tsx) rather than an exported GLB. The wing/fin/glazing
configuration is reusable data (BUILDING + unitPosition in src/data.ts), so a
future Blender GLB can replace the meshes without changing property mapping.
