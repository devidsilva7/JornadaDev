import { useRef, useState, type ReactNode } from "react";
import type { Vec2 } from "./SchoolWorld";

const RADIUS = 46;

/** Joystick analógico para celular. Escreve a direção em `input` (-1..1). */
export function Joystick({ input, disabled }: { input: { current: Vec2 }; disabled: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    input.current = { x: dx / RADIUS, z: dy / RADIUS };
  };

  const release = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.current = { x: 0, z: 0 };
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label="Joystick: arraste para andar"
      onPointerDown={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        active.current = event.pointerId;
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (active.current === event.pointerId) update(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      className={`relative h-32 w-32 touch-none select-none rounded-full border border-white/20 bg-[#120e24]/55 backdrop-blur ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-violet-200/60 bg-violet-500/70 shadow-[0_0_20px_rgba(124,58,237,0.5)]"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export function ActionButton({
  label,
  onPress,
  active = false,
  disabled,
  big = false,
  children,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled: boolean;
  big?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      onContextMenu={(event) => event.preventDefault()}
      className={`flex touch-none select-none flex-col items-center justify-center gap-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide shadow-lg backdrop-blur transition active:scale-90 disabled:opacity-35 ${
        big ? "h-[4.5rem] w-[4.5rem]" : "h-14 w-14"
      } ${
        active
          ? "border-amber-200 bg-amber-400/90 text-[#1c1206]"
          : "border-white/25 bg-[#120e24]/70 text-white"
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
