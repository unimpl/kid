// Three.js + Shader 黑洞背景：引力透镜 / 吸积盘 / 星云 / 光线弯曲 / 粒子吸入
// 全屏三角形 + ShaderMaterial，fragment shader 内做光线弯曲积分
import * as THREE from 'three';

let renderer, scene, camera, material, mesh, clock;
let running = false;
let raf = 0;

const VERTEX = `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAGMENT = `
uniform vec2 uResolution;
uniform float uTime;

#define STEPS 80
const vec3 BH_POS = vec3(-4.0, 0.0, 0.0);   // 左侧，约 1/3 露出
const float EH = 1.0;                        // 事件视界半径
const float DISK_IN = 2.4;
const float DISK_OUT = 6.8;
const float MASS = 1.15;

float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p=p*2.02; a*=0.5; } return v; }

// 星空（被透镜弯曲后的方向采样）
vec3 stars(vec3 d){
  vec3 col=vec3(0.0);
  vec3 c=floor(d*420.0);
  float h=hash(c);
  if(h>0.9966) col+=vec3(0.8,0.86,1.0)*(h-0.9966)*130.0;
  float h2=hash(c+11.3);
  if(h2>0.9988) col+=vec3(1.0,0.82,0.6)*(h2-0.9988)*95.0;
  return col;
}

// 星云（同样被透镜弯曲）
vec3 nebula(vec3 d){
  float n=fbm(d*2.2+vec3(uTime*0.01,0.0,0.0));
  float n2=fbm(d*4.5-vec3(0.0,uTime*0.013,0.0));
  float n3=fbm(d*1.3);
  vec3 col=vec3(0.0);
  col+=vec3(0.16,0.05,0.26)*smoothstep(0.28,0.8,n);
  col+=vec3(0.08,0.18,0.42)*smoothstep(0.32,0.85,n2);
  col+=vec3(0.26,0.07,0.20)*smoothstep(0.4,0.9,n3)*0.5;
  col*=0.55;
  col+=stars(d);
  return col;
}

// 吸积盘颜色：温度梯度 + 湍流 + 多普勒增亮
vec3 diskColor(float r, float ang){
  float t=clamp((r-DISK_IN)/(DISK_OUT-DISK_IN),0.0,1.0);
  vec3 c=mix(vec3(1.3,1.15,0.9),vec3(1.3,0.7,0.25),smoothstep(0.0,0.35,t));
  c=mix(c,vec3(0.7,0.18,0.08),smoothstep(0.35,1.0,t));
  float sp=fbm(vec3(r*0.7, ang*4.0+uTime*1.5+r*2.0, 0.0));
  c*=0.6+sp*0.9;
  c*=1.0+0.7*cos(ang);     // 多普勒：接近侧更亮
  return c;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/uResolution.y;
  vec3 pos=vec3(0.0,0.45,-5.5);              // 相机
  vec3 dir=normalize(vec3(uv*1.1,1.3));       // 初始光线方向
  vec3 color=vec3(0.0);
  float trans=1.0;
  float minR=999.0;
  bool captured=false;

  for(int i=0;i<STEPS;i++){
    vec3 toBH=BH_POS-pos;
    float r=length(toBH);
    minR=min(minR,r);
    float dt=clamp(r*0.12,0.04,0.5);
    // 引力偏折（光线弯曲）
    dir+=normalize(toBH)*(MASS/(r*r+0.02))*dt;
    dir=normalize(dir);
    // 吸积盘平面(y=0)穿越检测
    float yb=(pos-BH_POS).y;
    vec3 np=pos+dir*dt;
    float ya=(np-BH_POS).y;
    if(yb*ya<0.0){
      float tc=yb/(yb-ya);
      vec3 hit=pos+dir*dt*tc;
      vec3 loc=hit-BH_POS;
      float dr=length(loc.xz);
      if(dr>DISK_IN && dr<DISK_OUT){
        float ang=atan(loc.z,loc.x);
        vec3 dc=diskColor(dr,ang);
        // 粒子吸入：内边缘明亮的旋入流条纹
        float ingest=smoothstep(DISK_IN+1.3,DISK_IN,dr);
        float streak=fbm(vec3(dr*3.0, ang*8.0-uTime*4.0, 0.0));
        dc+=vec3(1.6,1.0,0.45)*ingest*streak*1.3;
        float dens=(0.4+0.55*streak)*smoothstep(DISK_OUT,DISK_IN,dr);
        color+=dc*dens*trans;
        trans*=1.0-clamp(dens*0.45,0.0,0.9);
      }
    }
    pos=np;
    if(r<EH){ captured=true; break; }   // 事件视界捕获
    if(r>22.0) break;
  }

  if(!captured){
    // 光子环（光线在 ~1.5 倍视界处绕行形成亮环）
    float ring=exp(-pow((minR-1.5*EH)/(0.18*EH),2.0));
    color+=vec3(1.0,0.85,0.6)*ring*0.45*trans;
    // 背景星云（方向已被透镜弯曲）
    color+=nebula(dir)*trans;
  }

  color=color/(1.0+color);
  color=pow(color,vec3(0.9));
  float vig=1.0-0.22*dot(uv*0.7,uv*0.7);
  gl_FragColor=vec4(color*vig,1.0);
}
`;

export function startBlackHole() {
  if (running) return;
  running = true;
  const container = document.getElementById('bg-layer');
  if (!container) return;

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.Camera();

  material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uTime: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });

  // 全屏三角形（覆盖 NDC）
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  clock = new THREE.Clock();
  animate();

  window.addEventListener('resize', onResize);
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  const pr = renderer.getPixelRatio();
  material.uniforms.uResolution.value.set(w * pr, h * pr);
}

function animate() {
  raf = requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
