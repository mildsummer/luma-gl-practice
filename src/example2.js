/**
 * ミニマムなフラグメントシェーダーを使うサンプル
 */

import { AnimationLoop, createGLContext, ClipSpaceQuad } from 'luma.gl';

const FRAGMENT_SHADER = `\
uniform float uTime;
varying vec2 position;
void main(void) {
  gl_FragColor = vec4(position, 0, 1);
}
`;

new AnimationLoop({
  onInitialize: ({ gl }) => ({
    clipSpaceQuad: new ClipSpaceQuad({ gl, fs: FRAGMENT_SHADER }) // 正方形の単純な画面を作るにはこれを使うらしい
  }),
  onRender: ({ tick, clipSpaceQuad }) => {
    clipSpaceQuad.render({ uTime: tick * 0.01 });
  }
}).start({ canvas: 'lumagl-canvas' });
