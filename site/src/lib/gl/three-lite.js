/**
 * The few three.js names the WebGL moments use. Importing this module (instead of
 * the whole `three` namespace) lets the bundler tree-shake the lazy WebGL chunk.
 */
export {
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
