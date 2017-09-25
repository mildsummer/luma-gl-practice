import {AnimationLoop, createGLContext, ClipSpaceQuad} from 'luma.gl';

const RANDOM_NOISE_FRAGMENT_SHADER = `\
uniform float uTime;
varying vec2 position;
void main(void) {
  gl_FragColor = vec4(position, 0, 1);
}
`;

new AnimationLoop({
  onContext: () => createGLContext({canvas: 'lumagl-canvas'}),
  onInitialize: ({gl}) => ({
    clipSpaceQuad: new ClipSpaceQuad({gl, fs: RANDOM_NOISE_FRAGMENT_SHADER})
  }),
  onRender: ({gl, canvas, tick, clipSpaceQuad}) => {
    canvas.width = canvas.clientWidth;
    canvas.style.height = `${canvas.width}px`;
    canvas.height = canvas.width;
    gl.viewport(0, 0, canvas.width, canvas.height);

    clipSpaceQuad.render({uTime: tick * 0.01});
  }
}).start();