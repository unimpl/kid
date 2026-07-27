import * as PIXI from 'pixi.js';
import { audio } from './audio.js';
import { startBlackHole } from './blackhole.js';
import { SpaceProps } from './props.js';
import { DIFFICULTIES } from './levels.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const W = () => window.innerWidth;
const H = () => window.innerHeight;
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

class Game {
  constructor() {
    this.app = new PIXI.Application();
    this.scenes = {};
    this.current = null;
    this._fade = null;
    this._lastTime = 0;
    this.difficulty = DIFFICULTIES[0];
    this.props = null;
  }

  async init() {
    await this.app.init({
      width: W(), height: H(),
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
    });
    document.getElementById('game-layer').appendChild(this.app.canvas);

    this.world = new PIXI.Container();
    this.world.sortableChildren = true;
    this.app.stage.addChild(this.world);

    this.props = new SpaceProps();
    this.props.populate(W(), H(), 7);
    this.world.addChild(this.props.container);

    startBlackHole();

    // 字体就绪
    try {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load('900 64px Orbitron'),
        document.fonts.load('800 30px "Baloo 2"'),
        document.fonts.load('700 20px Orbitron'),
      ]);
    } catch (e) { /* 字体加载失败也继续 */ }

    audio.init();

    this.registerScenes();
    this.bindResize();
    this.go('menu');

    this.app.ticker.add((ticker) => this.tick(ticker.deltaMS));
    this.hideLoading();
  }

  registerScenes() {
    this.scenes.menu = new MenuScene(this);
    this.scenes.game = new GameScene(this);
    this.scenes.result = new ResultScene(this);
  }

  go(name, data) {
    const next = this.scenes[name];
    if (this.current) {
      this.current.exit();
      this.world.removeChild(this.current.view);
    }
    this.current = next;
    next.enter(data);
    next.view.alpha = 0;
    next.view.scale.set(0.96);
    this.world.addChild(next.view);
    this._fade = { obj: next.view, t: 0, dur: 480 };
  }

  tick(dt) {
    if (this.current && this.current.update) this.current.update(dt);
    if (this.props) this.props.update(dt, W(), H());
    if (this._fade) {
      this._fade.t += dt;
      const k = Math.min(1, this._fade.t / this._fade.dur);
      const e = easeOutCubic(k);
      this._fade.obj.alpha = e;
      this._fade.obj.scale.set(0.96 + 0.04 * e);
      if (k >= 1) {
        this._fade.obj.scale.set(1);
        this._fade = null;
      }
    }
  }

  bindResize() {
    window.addEventListener('resize', () => {
      this.app.renderer.resize(W(), H());
      if (this.props) this.props.resize(W(), H());
      if (this.current && this.current.resize) this.current.resize(W(), H());
    });
  }

  hideLoading() {
    const el = document.getElementById('loading');
    if (!el) return;
    el.classList.add('hide');
    setTimeout(() => el.remove(), 900);
  }

  unlockAudio() { audio.resume(); }
}

export const game = new Game();
if (typeof window !== 'undefined') window.__game = game;

window.addEventListener('load', () => game.init());
window.addEventListener('pointerdown', () => game.unlockAudio(), { once: true });

export { easeOutCubic, easeInOutCubic };
