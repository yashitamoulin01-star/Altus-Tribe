'use client';
import { useEffect, useRef } from 'react';

// Simplex-noise WebGL shader — dark animated background with subtle red bloom.
// Self-contained: no three.js, no external canvas lib.
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=(p+1.0)*0.5;gl_Position=vec4(p,0,1);}`;
const FRAG = `precision highp float;varying vec2 v;uniform float t;
vec3 px(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float sn(vec2 p){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
vec2 i=floor(p+dot(p,C.yy)),x0=p-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
vec3 pr=px(px(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
vec3 x=2.0*fract(pr*C.www)-1.0,h=abs(x)-0.5,a0=x-floor(x+0.5),g2;
g2.x=a0.x*x0.x+h.x*x0.y;g2.yz=a0.yz*x12.xz+h.yz*x12.yw;
return 130.0*dot(m*(1.79284291400159-0.85373472095314*(a0*a0+h*h)),g2);}
void main(){
float n=sn(v*2.0+t*0.05)*0.5+sn(v*4.0-t*0.03)*0.25+sn(v*1.5+t*0.02)*0.25;
vec3 c=mix(vec3(0.06,0.06,0.06),vec3(0.13,0.10,0.10),smoothstep(-0.5,0.5,n));
c=mix(c,vec3(0.72,0.06,0.16),smoothstep(0.4,1.0,n)*0.18);
gl_FragColor=vec4(c,1);}`;

export default function AuthBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, 't');
    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize); resize();

    const draw = (ms: number) => {
      gl.uniform1f(uT, ms * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: -1, width: '100%', height: '100%' }} />;
}
