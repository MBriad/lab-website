"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useMotionPrefs } from "./motion-prefs";

/** Permission and availability state for the optional mobile sensor input. */
export type OrientationStatus =
  | "unknown"
  | "unsupported"
  | "available"
  | "granted"
  | "denied"
  | "reduced";

export interface GravityMotionContextValue {
  orientationAvailable: boolean;
  orientationStatus: OrientationStatus;
  /** Whether the first-viewport sensor affordance should be rendered. */
  canEnableOrientation: boolean;
  /** Requests permission only when called from the visible user action. */
  requestOrientation: () => Promise<void>;
}

const DEFAULT_CONTEXT: GravityMotionContextValue = {
  orientationAvailable: false,
  orientationStatus: "unknown",
  canEnableOrientation: false,
  requestOrientation: async () => undefined,
};

interface OrientationConstructor {
  requestPermission?: () => Promise<"granted" | "denied" | "prompt">;
}

interface OrientationCalibration {
  beta: number;
  gamma: number;
}

export interface SpringState {
  position: number;
  velocity: number;
}

/** Clamp a normalized or pixel value without allowing NaN to escape. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

/** Convert an orientation reading around its calibrated neutral point to [-1, 1]. */
export function normalizeOrientation(
  value: number,
  neutral: number,
  range = 35,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(neutral) || range <= 0) return 0;
  return clamp((value - neutral) / range, -1, 1);
}

/** Decay the signed scroll impulse as time passes. */
export function decayScrollForce(value: number, seconds: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(seconds) || seconds <= 0) {
    return Number.isFinite(value) ? value : 0;
  }
  return value * Math.exp(-seconds * 5.5);
}

/** Advance one critically-damped-ish spring step for a single axis. */
export function stepSpring(
  state: SpringState,
  target: number,
  seconds: number,
  stiffness = 38,
  damping = 10,
): SpringState {
  const dt = clamp(seconds, 0, 0.064);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const acceleration = (safeTarget - state.position) * stiffness;
  const velocity = (state.velocity + acceleration * dt) * Math.exp(-damping * dt);
  return {
    position: state.position + velocity * dt,
    velocity,
  };
}

function getOrientationConstructor(): OrientationConstructor | null {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return null;
  }
  return window.DeviceOrientationEvent as unknown as OrientationConstructor;
}

function writeMotionVariables(root: HTMLElement, x: number, y: number, rx: number, ry: number, force: number) {
  root.style.setProperty("--glass-x", x.toFixed(3));
  root.style.setProperty("--glass-y", y.toFixed(3));
  root.style.setProperty("--glass-rx", rx.toFixed(3));
  root.style.setProperty("--glass-ry", ry.toFixed(3));
  root.style.setProperty("--scroll-force", force.toFixed(3));
}

/**
 * One bounded motion loop for the public glass artwork.
 *
 * Motion values remain in refs and are published as CSS variables. The hook
 * intentionally exposes only discrete sensor state to React consumers, so
 * scrolling and pointer movement never trigger component renders.
 */
export function useGravityMotion(
  rootRef: RefObject<HTMLElement | null>,
): GravityMotionContextValue {
  const { animate, reduced, finePointer, large } = useMotionPrefs();
  const [orientationAvailable, setOrientationAvailable] = useState(false);
  const [orientationStatus, setOrientationStatus] =
    useState<OrientationStatus>("unknown");
  const orientationStatusRef = useRef<OrientationStatus>("unknown");
  const orientationAvailableRef = useRef(false);
  const orientationEnabledRef = useRef(false);
  const calibrationRef = useRef<OrientationCalibration | null>(null);
  const attachOrientationRef = useRef<(() => void) | null>(null);

  const updateOrientationStatus = useCallback((next: OrientationStatus) => {
    orientationStatusRef.current = next;
    setOrientationStatus((current) => (current === next ? current : next));
  }, []);

  const requestOrientation = useCallback(async () => {
    if (reduced) {
      updateOrientationStatus("reduced");
      return;
    }
    if (!orientationAvailableRef.current) {
      updateOrientationStatus("unsupported");
      return;
    }

    try {
      const constructor = getOrientationConstructor();
      const permission = constructor?.requestPermission
        ? await constructor.requestPermission()
        : "granted";
      if (permission !== "granted") {
        orientationEnabledRef.current = false;
        updateOrientationStatus("denied");
        return;
      }

      orientationEnabledRef.current = true;
      calibrationRef.current = null;
      attachOrientationRef.current?.();
      updateOrientationStatus("granted");
    } catch {
      orientationEnabledRef.current = false;
      updateOrientationStatus("denied");
    }
  }, [reduced, updateOrientationStatus]);

  // Detect capability after mount. Permission is never requested here.
  useEffect(() => {
    if (reduced) {
      orientationAvailableRef.current = false;
      orientationEnabledRef.current = false;
      const timer = window.setTimeout(() => {
        setOrientationAvailable(false);
        updateOrientationStatus("reduced");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const supported = Boolean(getOrientationConstructor()) && !finePointer;
    orientationAvailableRef.current = supported;
    if (!supported) {
      orientationEnabledRef.current = false;
      const timer = window.setTimeout(() => {
        setOrientationAvailable(false);
        updateOrientationStatus("unsupported");
      }, 0);
      return () => window.clearTimeout(timer);
    } else if (orientationStatusRef.current !== "granted") {
      const timer = window.setTimeout(() => {
        setOrientationAvailable(true);
        updateOrientationStatus("available");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setOrientationAvailable(true), 0);
    return () => window.clearTimeout(timer);
  }, [finePointer, reduced, updateOrientationStatus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !animate || reduced) {
      if (root) writeMotionVariables(root, 0, 0, 0, 0, 0);
      return;
    }

    let raf = 0;
    let running = false;
    let visible = document.visibilityState === "visible";
    let lastFrame = performance.now();
    let lastScroll = window.scrollY;
    let lastScrollTime = lastFrame;
    let orientationAttached = false;

    const pointer = { x: 0, y: 0 };
    const orientation = { x: 0, y: 0 };
    const scroll = { force: 0 };
    const xState: SpringState = { position: 0, velocity: 0 };
    const yState: SpringState = { position: 0, velocity: 0 };
    const rxState: SpringState = { position: 0, velocity: 0 };
    const ryState: SpringState = { position: 0, velocity: 0 };

    const frame = (now: number) => {
      if (!running || !visible) return;
      const seconds = Math.min(64, Math.max(0, now - lastFrame)) / 1000;
      lastFrame = now;
      scroll.force = decayScrollForce(scroll.force, seconds);

      const sensorEnabled = orientationEnabledRef.current && orientationAvailableRef.current;
      let targetX = 0;
      let targetY = scroll.force;
      if (large && finePointer) {
        targetX = pointer.x * 0.35;
        targetY = scroll.force * 0.65 + pointer.y * 0.35;
      } else if (sensorEnabled) {
        targetX = orientation.x * 0.65;
        targetY = scroll.force * 0.35 + orientation.y * 0.65;
      }

      const maxShift = large && finePointer ? 18 : 12;
      const x = stepSpring(xState, clamp(targetX, -1, 1) * maxShift, seconds);
      const y = stepSpring(yState, clamp(targetY, -1, 1) * maxShift, seconds);
      const rx = stepSpring(rxState, clamp(targetY, -1, 1) * 2, seconds);
      const ry = stepSpring(ryState, clamp(targetX, -1, 1) * 2, seconds);
      xState.position = clamp(x.position, -maxShift, maxShift);
      xState.velocity = x.velocity;
      yState.position = clamp(y.position, -maxShift, maxShift);
      yState.velocity = y.velocity;
      rxState.position = clamp(rx.position, -2, 2);
      rxState.velocity = rx.velocity;
      ryState.position = clamp(ry.position, -2, 2);
      ryState.velocity = ry.velocity;
      writeMotionVariables(
        root,
        xState.position,
        yState.position,
        rxState.position,
        ryState.position,
        scroll.force,
      );

      // Stop the loop once the spring has settled. Input handlers call
      // `start()` again whenever a new pointer, scroll, or sensor event
      // arrives, so idle pages do not pay for a permanent animation frame.
      const settled =
        Math.abs(scroll.force) < 0.001 &&
        Math.abs(xState.velocity) < 0.01 &&
        Math.abs(yState.velocity) < 0.01 &&
        Math.abs(rxState.velocity) < 0.01 &&
        Math.abs(ryState.velocity) < 0.01 &&
        Math.abs(xState.position - targetX * maxShift) < 0.01 &&
        Math.abs(yState.position - targetY * maxShift) < 0.01 &&
        Math.abs(rxState.position - clamp(targetY, -1, 1) * 2) < 0.01 &&
        Math.abs(ryState.position - clamp(targetX, -1, 1) * 2) < 0.01;
      if (settled) {
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(16, now - lastScrollTime);
      const delta = window.scrollY - lastScroll;
      const impulse = clamp((delta / elapsed) * 0.72, -1, 1);
      scroll.force = clamp(scroll.force * 0.42 + impulse, -1, 1);
      lastScroll = window.scrollY;
      lastScrollTime = now;
      start();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = clamp((event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2, -1, 1);
      pointer.y = clamp((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2, -1, 1);
      start();
    };

    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
      start();
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!orientationEnabledRef.current) return;
      const beta = event.beta;
      const gamma = event.gamma;
      if (typeof beta !== "number" || typeof gamma !== "number") return;
      if (!calibrationRef.current) {
        calibrationRef.current = { beta, gamma };
      }
      const calibration = calibrationRef.current;
      orientation.x = normalizeOrientation(gamma, calibration.gamma);
      orientation.y = normalizeOrientation(beta, calibration.beta);
      start();
    };

    const attachOrientation = () => {
      if (orientationAttached || !orientationAvailableRef.current) return;
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
      orientationAttached = true;
    };
    const detachOrientation = () => {
      if (!orientationAttached) return;
      window.removeEventListener("deviceorientation", onOrientation);
      orientationAttached = false;
    };
    attachOrientationRef.current = attachOrientation;

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) start();
      else stop();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (orientationEnabledRef.current) attachOrientation();
    start();

    return () => {
      stop();
      detachOrientation();
      attachOrientationRef.current = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      writeMotionVariables(root, 0, 0, 0, 0, 0);
    };
  }, [animate, finePointer, large, reduced, rootRef]);

  const value = useMemo<GravityMotionContextValue>(
    () => ({
      orientationAvailable,
      orientationStatus,
      canEnableOrientation:
        orientationAvailable &&
        orientationStatus !== "reduced" &&
        orientationStatus !== "unsupported" &&
        orientationStatus !== "granted",
      requestOrientation,
    }),
    [orientationAvailable, orientationStatus, requestOrientation],
  );
  return value;
}

export const GravityMotionContext = createContext<GravityMotionContextValue>(DEFAULT_CONTEXT);

export function useGravityMotionContext(): GravityMotionContextValue {
  return useContext(GravityMotionContext);
}
