/**
 * 最初のサンプルに自力でライティング（平行光源）をしてみた
 */

import { AnimationLoop, GL, TextureCube, Cube, Matrix4, radians, setParameters } from 'luma.gl';

const animationLoop = new AnimationLoop({
  onInitialize: ({ gl }) => {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    return {
      cube: getCube(gl),
      prism: getPrism(gl),
      cubemap: new TextureCube(gl, { data: getFaceTextures({ size: 512 }) })
    };
  },
  onRender: ({ gl, tick, aspect, cube, prism, cubemap }) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const view = new Matrix4().lookAt({ eye: [0, 0, -1] }).translate([0, 0, 4]);
    const projection = new Matrix4().perspective({ fov: radians(75), aspect });

    cube.render({
      uTextureCube: cubemap,
      uModel: new Matrix4().scale([5, 5, 5]),
      uView: view,
      uProjection: projection
    });

    const prismModelMatrix = new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013);

    prism.render({
      uTextureCube: cubemap,
      uInvMatrix: projection.clone().multiplyRight(view).multiplyRight(prismModelMatrix).invert(), // 平行光源を表現するために、変換行列の逆行列を渡す
      uLightDirection: [0.5, 0.5, -1.0],
      uModel: prismModelMatrix,
      uView: view,
      uProjection: projection
    });
  }
});

function getCube(gl) {
  return new Cube({
    gl,
    vs: `\
attribute vec3 positions;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 vPosition;
void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = positions;
}
`,
    fs: `\
#define SHADER_NAME cube_fragment
#ifdef GL_ES
precision highp float;
#endif
uniform samplerCube uTextureCube;
varying vec3 vPosition;
void main(void) {
  // The outer cube just samples the texture cube directly
  gl_FragColor = textureCube(uTextureCube, normalize(vPosition));
}
`
  });
}

function getPrism(gl) {
  return new Cube({
    gl,
    vs: `\
attribute vec3 positions;
attribute vec3 normals;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

uniform mat4 uInvMatrix;
uniform vec3 uLightDirection;

varying float vBrightness;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
  // 光源のベクトルを求める
  vec3 invLight = normalize(uInvMatrix * vec4(uLightDirection, 0.0)).xyz;
  // 光源のベクトルと法線ベクトルの内積(=光の影響力の強さ)を求める
  vBrightness = clamp(dot(normals, invLight), 0.1, 1.0);

  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 1));
}
`,
    fs: `\
#ifdef GL_ES
precision highp float;
#endif
uniform samplerCube uTextureCube;
uniform float uReflect;
uniform float uRefract;
varying float vBrightness;
varying vec3 vPosition;
varying vec3 vNormal;
void main(void) {
  vec4 color = vec4(vec3(vBrightness), 1); // 光の強さに合わせて色を変える
  vec3 offsetPosition = vPosition - vec3(0, 0, 2.5);
  vec3 reflectedDir = normalize(reflect(vPosition, vNormal));
  vec3 refractedDir = normalize(refract(vPosition, vNormal, 0.75));
  vec4 reflectedColor = textureCube(uTextureCube, reflectedDir);
  gl_FragColor = mix(color, reflectedColor, 0.1);
}
`
  });
}

function getFaceTextures({size}) {
  const signs = ['pos', 'neg'];
  const axes = ['x', 'y', 'z'];
  const textures = {
    pos: {},
    neg: {}
  };

  let face = 0;

  for (const sign of signs) {
    for (const axis of axes) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      drawTexture({ctx, sign, axis, size});
      textures[TextureCube.FACES[face++]] = canvas;
    }
  }
  return textures;
}

function drawTexture({ctx, sign, axis, size}) {
  if (axis === 'x' || axis === 'z') {
    ctx.translate(size, size);
    ctx.rotate(Math.PI);
  }
  const color = 'rgb(0,64,128)';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.fillRect(8, 8, size - 16, size - 16);
  ctx.fillStyle = color;
  ctx.font = `${size / 4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${sign}-${axis}`, size / 2, size / 2);
  ctx.strokeStyle = color;
  ctx.strokeRect(0, 0, size, size);
}

animationLoop.start({ canvas: 'lumagl-canvas' });
