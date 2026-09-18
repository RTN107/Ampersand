import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { REDUCED, ScrollTrigger } from '../lib/motion';

/**
 * Four currents.
 * Points of light enter as four separate lanes, braid together at a seam on
 * the right third of the screen, and continue as a single current. Everything
 * is computed in the vertex shader from time, so the CPU does no per-frame work.
 */

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uFade;
uniform float uPixelRatio;
uniform float uXScale;
attribute float aLane;
attribute float aSeed;
attribute float aPhase;
attribute float aSize;
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;
${NOISE}

const vec3 LANE0 = vec3(0.373, 0.827, 0.663); /* jade */
const vec3 LANE1 = vec3(0.812, 0.910, 0.878); /* ice */
const vec3 LANE2 = vec3(0.520, 0.800, 0.780); /* cool jade */
const vec3 LANE3 = vec3(0.831, 0.659, 0.325); /* faint brass */
const vec3 MERGED = vec3(0.875, 0.961, 0.918); /* jade white */

void main() {
  float speed = 0.026 * (0.7 + 0.6 * aSeed);
  float u = fract(aPhase + uTime * speed);

  float x = mix(-11.0, 12.5, u) * uXScale;
  float laneY = (aLane - 1.5) * 2.2;
  float c = smoothstep(0.10, 0.62, u);
  float y = mix(laneY, 0.0, c);

  float n1 = snoise(vec3(x * 0.30, laneY * 0.7 + aSeed * 3.0, uTime * 0.11));
  float n2 = snoise(vec3(x * 0.85 + 10.0, aSeed * 7.0, uTime * 0.19));
  y += n1 * mix(1.35, 0.32, c) + n2 * 0.16;
  y += sin(u * 24.0 + aSeed * 6.2831) * 0.20 * c;

  float z = (aSeed - 0.5) * 7.0 * mix(1.0, 0.72, c) + n2 * 0.6;

  float edge = smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.90, 1.0, u));

  vec3 lane = aLane < 0.5 ? LANE0 : (aLane < 1.5 ? LANE1 : (aLane < 2.5 ? LANE2 : LANE3));
  vColor = mix(lane, MERGED, c * 0.85);

  vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
  float dist = -mv.z;
  float soft = clamp(abs(dist - 11.0) / 4.0, 0.0, 1.0);
  vSoft = soft;

  gl_PointSize = aSize * uPixelRatio * (150.0 / dist) * (1.0 + soft * 1.4);
  vAlpha = edge * uFade * (0.85 - soft * 0.62) * (0.6 + 0.25 * c) * 0.48;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = clamp(length(p) * 2.0, 0.0, 1.0);
  float a = pow(1.0 - d, mix(2.4, 1.3, vSoft)) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

type Props = { agentOpen: boolean };

export default function HeroField({ agentOpen }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef(agentOpen);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    agentRef.current = agentOpen;
  }, [agentOpen]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return; // No WebGL: the vignette and page still stand on their own.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0, 11);

    const count = window.innerWidth < 768 ? 9000 : 24000;
    const position = new Float32Array(count * 3);
    const lane = new Float32Array(count);
    const seed = new Float32Array(count);
    const phase = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      lane[i] = i % 4;
      seed[i] = Math.random();
      phase[i] = Math.random();
      const r = Math.random();
      size[i] = r < 0.035 ? 1.4 + Math.random() * 1.2 : 0.22 + Math.random() * 0.7;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aLane', new THREE.BufferAttribute(lane, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

    const uniforms = {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uXScale: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const resize = () => {
      const w = wrap.clientWidth || window.innerWidth;
      const h = wrap.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uXScale.value = Math.min(1, camera.aspect / 1.5);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax, eased.
    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Only render while the hero is on screen or the agent is open.
    let heroVisible = true;
    const heroEl = document.getElementById('hero');
    const io = heroEl
      ? new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting;
        })
      : null;
    if (heroEl && io) io.observe(heroEl);

    // Dim and slow as the hero scrolls away.
    let scrollFade = 1;
    const st = heroEl
      ? ScrollTrigger.create({
          trigger: heroEl,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            scrollFade = 1 - self.progress * 0.9;
          },
        })
      : null;

    const target = new THREE.Vector3(0, 0, 11);
    let t = 0;
    let last = performance.now();
    let raf = 0;
    let alive = true;

    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const agent = agentRef.current;
      const active = heroVisible || agent;
      if (active) {
        t += dt * (agent ? 0.45 : 1);
        uniforms.uTime.value = t;
        uniforms.uFade.value = agent ? 0.8 : scrollFade;
        const drift = t * 0.06;
        target.set(
          mouse.x * 0.7 + Math.sin(drift) * 0.25,
          mouse.y * 0.45 + Math.cos(drift * 0.8) * 0.18,
          11,
        );
        camera.position.lerp(target, 0.035);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      if (alive) raf = requestAnimationFrame(render);
    };

    if (REDUCED) {
      t = 40;
      uniforms.uTime.value = t;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(render);
    }
    setReady(true);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      io?.disconnect();
      st?.kill();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`currents${ready ? ' is-ready' : ''}${agentOpen ? ' is-front' : ''}`}
      aria-hidden="true"
    >
      <div className="currents__glow" />
    </div>
  );
}
