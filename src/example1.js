/**
 * 公式のサンプルをちょっといじったもの
 * 立方体の表示、反射・屈折
 */

import { AnimationLoop, GL, TextureCube, Cube, Matrix4, radians, setParameters } from 'luma.gl';

const animationLoop = new AnimationLoop({
  onInitialize: ({ gl }) => { // 初期化時に呼ばれる
    // WebGLの各種パラメータを設定する
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    // ここでreturnしたものがonRenderの引数に入る
    return {
      cube: getCube(gl),
      prism: getPrism(gl),
      cubemap: new TextureCube(gl, { data: getFaceTextures({ size: 512 }) })
    };
  },
  onRender: ({ gl, tick, aspect, cube, prism, cubemap }) => { // 毎フレームの描画時に呼ばれる
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT); // 画面をクリア

    // ビューマトリックス（ビュー変換行列）
    const view = new Matrix4().lookAt({ eye: [0, 0, -1] }).translate([0, 0, 4]);
    // プロジェクションマトリックス（プロジェクション変換行列）
    const projection = new Matrix4().perspective({ fov: radians(75), aspect });

    cube.render({ // ここでuniform変数を渡す
      uTextureCube: cubemap,
      uModel: new Matrix4().scale([5, 5, 5]),
      uView: view,
      uProjection: projection
    });

    prism.render({ // ここでuniform変数を渡す
      uTextureCube: cubemap,
      uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
      uView: view,
      uProjection: projection
    });
  }
});

// 外側の立方体のオブジェクトを作成
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
  // プロジェクション変換行列・ビュー変換行列・モデル変換行列とかけることによって3D空間の座標を2D空間の座標に落とし込む
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
  // texureCubeというluma.glの組み込み関数で簡単に立方体のテクスチャを描画
  gl_FragColor = textureCube(uTextureCube, normalize(vPosition));
}
`
  });
}

// 内側の立方体のオブジェクトを作成
function getPrism(gl) {
  return new Cube({
    gl,
    vs: `\
attribute vec3 positions;
attribute vec3 normals;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 vPosition;
varying vec3 vNormal;
void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0) ;
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 1));
}
`,
    fs: `\
#ifdef GL_ES
precision highp float;
#endif
uniform samplerCube uTextureCube;
varying vec3 vPosition;
varying vec3 vNormal;
void main(void) {
  vec4 color = vec4(1, 1, 1, 1); // Prism color is red
  vec3 offsetPosition = vPosition - vec3(0, 0, 2.5);
  // 内側の立方体に外側の立方体のテクスチャが反射・屈折したように見せる
  vec3 reflectedDir = normalize(reflect(vPosition, vNormal));
  vec3 refractedDir = normalize(refract(vPosition, vNormal, 0.75));
  vec4 reflectedColor = textureCube(uTextureCube, reflectedDir);
  vec4 refractedColor = textureCube(uTextureCube, refractedDir);
  // テクスチャの色とベースの色を掛け合わせる
  gl_FragColor = color * mix(reflectedColor, refractedColor, 0.5);
}
`
  });
}

// 6つのテクスチャを作る
function getFaceTextures({ size }) {
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

// 各面のテクスチャを作る
function drawTexture({ ctx, sign, axis, size }) {
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

animationLoop.start({ canvas: 'lumagl-canvas' }); // canvasを指定してスタート
