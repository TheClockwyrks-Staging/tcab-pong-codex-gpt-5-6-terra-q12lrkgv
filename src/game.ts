import type { Game, InitApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";
export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type Snap = Omit<CaromState, "ball"> & {
  version: number;
  ball: (BallState & { speed: number }) | null;
};
type R = { x: number; y: number; w: number; h: number };
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, a: number, b: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, d: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, d: Side, v: number): CaromState;
  setPaddleDriven(s: DeepReadonly<CaromState>, d: Side, v: boolean): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Snap;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): R | null;
}
export const BACKGROUND = "#07121f";
const sg = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const mkball = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: sg(),
  trail: [],
});
const init = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: mkball(),
  obstacles: C.OBSTACLE_CENTERS.map((p, index) => ({
    index,
    cx: p.x,
    cy: p.y,
  })),
  simTime: 0,
  muted,
});
const need = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw new Error("Carom: no ball in the world");
  return s.ball;
};
const setp = (
  s: DeepReadonly<CaromState>,
  d: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [d]: p } });
const items = (x: Screen): readonly string[] | null =>
  x === "title"
    ? C.TITLE_ITEMS
    : x === "howto"
      ? ["BACK"]
      : x === "paused"
        ? C.PAUSE_ITEMS
        : x === "matchover"
          ? C.MATCHOVER_ITEMS
          : null;
const menu = (s: DeepReadonly<CaromState>, i: number): R | null => {
  const a = items(s.screen);
  return !a || i < 0 || i >= a.length
    ? null
    : { x: 440, y: 300 + i * 58, w: 400, h: 46 };
};
const start = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  mode,
  screen: "countdown",
  menuIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: mkball(),
});
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const a of C.ACTIONS)
      api.input.register(a, { keys: [...C.BINDINGS[a]] });
    api.audio.define(C.CUES.paddleHit, { freq: 440, durationMs: 50 });
    api.audio.define(C.CUES.wallBounce, { freq: 240, durationMs: 45 });
    api.audio.define(C.CUES.obstacleBounce, { freq: 180, durationMs: 55 });
    api.audio.define(C.CUES.score, { freq: 700, durationMs: 180 });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("p1", (s) => s.score.p1);
    api.diagnostics.register("p2", (s) => s.score.p2);
    api.diagnostics.register("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : "-",
    );
    const d: CaromDebugApi = {
      version: C.CAROM_DEBUG_VERSION,
      clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...s, ball: mkball() }),
      spawnObstacle: (s, i) => {
        if (!C.OBSTACLE_CENTERS[i])
          throw Error("Carom: invalid obstacle index");
        const p = C.OBSTACLE_CENTERS[i];
        return {
          ...s,
          obstacles: [
            ...s.obstacles.filter((o) => o.index !== i),
            { index: i, cx: p.x, cy: p.y },
          ],
        };
      },
      reset: (s) => init(s.muted),
      reconcile: (s) => ({ ...s }),
      setScreen: (s, v) => ({ ...s, screen: v }),
      setMode: (s, v) => ({ ...s, mode: v }),
      setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
      setScore: (s, a, b) => ({ ...s, score: { p1: a, p2: b } }),
      setWinner: (s, v) => ({ ...s, winner: v }),
      setReceiver: (s, v) => ({ ...s, receiver: v }),
      setPaddleCy: (s, x, v) => setp(s, x, { ...s.paddles[x], cy: v }),
      setPaddleVy: (s, x, v) => setp(s, x, { ...s.paddles[x], drivenVy: v }),
      setPaddleDriven: (s, x, v) => setp(s, x, { ...s.paddles[x], driven: v }),
      setBallPosition: (s, x, y) => ({ ...s, ball: { ...need(s), x, y } }),
      setBallVelocity: (s, x, y) => ({
        ...s,
        ball: { ...need(s), vx: x, vy: y },
      }),
      setBallSpin: (s, v) => ({ ...s, ball: { ...need(s), spin: v } }),
      setBallHeld: (s, v) => ({ ...s, ball: { ...need(s), held: v } }),
      setBallHoldTimer: (s, v) => ({
        ...s,
        ball: { ...need(s), holdTimer: v },
      }),
      setBallServeSign: (s, v) => ({
        ...s,
        ball: { ...need(s), serveSign: v },
      }),
      drawBallServeSign: (s) => ({
        ...s,
        ball: { ...need(s), serveSign: sg() },
      }),
      setAiTracking: (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } }),
      setAiMovement: (s, v) => ({ ...s, ai: { ...s.ai, movement: v } }),
      setMuted: (s, v) => ({ ...s, muted: v }),
      snapshot: (s) => ({
        ...s,
        version: C.CAROM_DEBUG_VERSION,
        ball: s.ball && { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) },
      }),
      menuItemRect: menu,
    };
    return [init(), d];
  },
  update(s, a, dt) {
    let z: CaromState = {
      ...s,
      simTime: s.simTime + dt,
      muted: a.audio.muted(),
    };
    if (a.input.pressed("mute")) {
      a.audio.setMuted(!a.audio.muted());
      z = { ...z, muted: a.audio.muted() };
    }
    if (
      (s.screen === "playing" || s.screen === "countdown") &&
      a.input.pressed("pause")
    )
      return { ...z, screen: "paused", resumeScreen: s.screen, menuIndex: 0 };
    if (
      s.screen === "paused" &&
      (a.input.pressed("pause") || a.input.pressed("back"))
    )
      return { ...z, screen: z.resumeScreen };
    if (s.screen === "title" && a.input.pressed("confirm"))
      return z.menuIndex === 0
        ? start(z, "solo")
        : z.menuIndex === 1
          ? start(z, "versus")
          : { ...z, screen: "howto", menuIndex: 0 };
    if (
      s.screen === "howto" &&
      (a.input.pressed("confirm") || a.input.pressed("back"))
    )
      return {
        ...init(z.muted),
        simTime: z.simTime,
        titleIndex: z.titleIndex,
        menuIndex: z.titleIndex,
      };
    if (s.screen === "countdown" && z.ball) {
      const b = z.ball,
        r = b.holdTimer - dt;
      if (r <= 0) {
        const dir = z.receiver === "left" ? -1 : 1;
        return {
          ...z,
          screen: "playing",
          ball: {
            ...b,
            held: false,
            holdTimer: 0,
            vx: dir * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
            vy: b.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
          },
        };
      }
      return { ...z, ball: { ...b, holdTimer: r } };
    }
    if (s.screen === "playing" && z.ball && !z.ball.held) {
      const b = z.ball,
        x = b.x + b.vx * dt,
        y = b.y + b.vy * dt;
      return {
        ...z,
        ball: {
          ...b,
          x,
          y,
          vx: b.vx,
          vy: y - C.BALL_R < 0 || y + C.BALL_R > C.FIELD_H ? -b.vy : b.vy,
        },
      };
    }
    return z;
  },
  render(s, api) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
    c.strokeStyle = "#1b4660";
    c.setLineDash([10, 12]);
    c.beginPath();
    c.moveTo(C.NET_X, 0);
    c.lineTo(C.NET_X, C.FIELD_H);
    c.stroke();
    c.setLineDash([]);
    for (const o of s.obstacles) {
      c.fillStyle = "#f5a524";
      c.fillRect(o.cx - 10, o.cy - 70, 20, 140);
    }
    for (const [p, x, col] of [
      [s.paddles.left, C.P1_X0, "#2dd4bf"],
      [s.paddles.right, C.P2_X0, "#f472b6"],
    ] as const) {
      c.fillStyle = col;
      c.fillRect(x, p.cy - C.PADDLE_HALF, 16, 110);
    }
    if (s.ball) {
      c.fillStyle = "#e8fbff";
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, C.BALL_R, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "center";
    c.fillStyle = "#e8fbff";
    c.font = "900 80px system-ui";
    if (s.screen === "title") c.fillText(C.TITLE_TEXT, C.FIELD_CX, 220);
    const m = items(s.screen);
    if (m) {
      c.font = "700 26px system-ui";
      m.forEach((x, i) => {
        c.fillStyle = i === s.menuIndex ? "#67e8f9" : "#b6cad5";
        c.fillText(x, C.FIELD_CX, 330 + i * 58);
      });
    }
    if (s.screen === "playing" || s.screen === "countdown") {
      c.font = "700 40px system-ui";
      c.fillText(String(s.score.p1), 560, 70);
      c.fillText(String(s.score.p2), 720, 70);
    }
  },
};
