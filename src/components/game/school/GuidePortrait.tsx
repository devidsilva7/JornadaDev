import { useState } from "react";
import { guide } from "@/game/people";

const PORTRAIT_SIZE = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-24 w-24 text-4xl",
} as const;

/** Foto do guia Chrystian (public/chrystian.jpg), com a inicial caso a foto não carregue. */
export function GuidePortrait({ size }: { size: keyof typeof PORTRAIT_SIZE }) {
  const [failed, setFailed] = useState(false);
  const cls = `${PORTRAIT_SIZE[size]} shrink-0 overflow-hidden rounded-full border-2 border-violet-300 bg-gradient-to-br from-violet-500 to-purple-700 shadow`;
  return failed ? (
    <span className={`${cls} flex items-center justify-center font-display font-bold`}>
      {guide.name[0]}
    </span>
  ) : (
    <img
      src={guide.photo}
      alt={`Foto do guia ${guide.name}`}
      onError={() => setFailed(true)}
      className={`${cls} object-cover`}
    />
  );
}
