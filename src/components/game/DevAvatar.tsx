import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Vector2, type CanvasTexture, type Group } from "three";
import { FARDA_BASE, makeFardaTexture, type FardaId } from "./fardaTextures";
import { skinColor, type AvatarLook, type OutfitId } from "@/game/avatar";

export type { AvatarKind, AvatarLook } from "@/game/avatar";

/* ------------------------------------------------------------------ */
/* Estilo de cada roupa                                                */
/* ------------------------------------------------------------------ */

type Style = {
  shirt: string;
  sleeves: "short" | "long";
  sleeveColor?: string | undefined;
  pants: string;
  shoe: string;
  sole?: string | undefined;
  rough?: number | undefined;
  polo?: boolean | undefined;
  /** estampa completa da farda */
  farda?: FardaId | undefined;
  /** cor da gola polo */
  collar?: string | undefined;
  /** listras na gola e na barra das mangas */
  stripes?: { color: string; count: 1 | 2 } | undefined;
};

function outfitStyle(outfit: OutfitId): Style {
  switch (outfit) {
    case "farda-ds":
      return {
        shirt: FARDA_BASE.ds,
        sleeves: "short",
        pants: "#1e3a5f",
        shoe: "#111827",
        sole: "#f8fafc",
        polo: true,
        farda: "ds",
        collar: FARDA_BASE.ds,
        stripes: { color: "#ffffff", count: 2 },
        rough: 0.8,
      };
    case "farda":
    default:
      return {
        shirt: FARDA_BASE.eeep,
        sleeves: "short",
        pants: "#1e3a5f",
        shoe: "#111827",
        sole: "#f8fafc",
        polo: true,
        farda: "eeep",
        collar: FARDA_BASE.eeep,
        stripes: { color: "#14532d", count: 1 },
        rough: 0.8,
      };
  }
}

/* ------------------------------------------------------------------ */
/* Estampas da farda (desenhadas em canvas)                            */
/* ------------------------------------------------------------------ */

/** Textura completa da farda (frente, laterais e costas), recriada ao trocar de farda. */
function useFardaTexture(id: FardaId | undefined) {
  const texture = useMemo(() => (id ? makeFardaTexture(id) : null), [id]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/* ------------------------------------------------------------------ */
/* Peças (formato original do boneco)                                  */
/* ------------------------------------------------------------------ */

const TORSO_Y = 0.88;
const TORSO_R = 0.29;

function Mat({ color, rough = 0.6 }: { color: string; rough?: number | undefined }) {
  return <meshStandardMaterial color={color} roughness={rough} />;
}

/**
 * Molde da camisa: segue o perfil da cápsula do tronco, dos ombros (y = 1,25)
 * até a barra (y = 0,45), para a textura da farda cobrir o tronco inteiro.
 */
const FARDA_PROFILE = (() => {
  const r = TORSO_R + 0.005;
  const bottom = TORSO_Y - 0.24; // centro da semiesfera de baixo
  const top = TORSO_Y + 0.24; // centro da semiesfera de cima
  const points: Vector2[] = [];
  for (let y = 0.45; y <= 1.2501; y += 0.025) {
    const dy = y < bottom ? bottom - y : y > top ? y - top : 0;
    points.push(new Vector2(Math.sqrt(Math.max(0, r * r - dy * dy)), y));
  }
  return points;
})();

function FardaWrap({ map }: { map: CanvasTexture }) {
  return (
    <mesh>
      <latheGeometry args={[FARDA_PROFILE, 48, -Math.PI, Math.PI * 2]} />
      <meshStandardMaterial
        map={map}
        roughness={0.8}
        side={DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

/** Estado de ação lido a cada quadro (sem re-render). */
export type AvatarAction = {
  running: boolean;
  airborne: boolean;
  /** instante (clock.elapsedTime) do último soco; -1 = nenhum */
  punchAt: number;
  /** 1 = mão direita, -1 = mão esquerda */
  punchSide: 1 | -1;
};

export const PUNCH_DURATION = 0.32;

export function DevAvatar({
  look,
  moving = false,
  action,
}: {
  look: AvatarLook;
  moving?: boolean;
  action?: { current: AvatarAction };
}) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const a = action?.current;
    const running = Boolean(a?.running) && moving;
    const freq = running ? 15 : 10;
    const amp = running ? 0.95 : 0.62;
    const stride = moving ? Math.sin(time * freq) * amp : Math.sin(time * 2) * 0.035;
    let leftArmX = stride;
    let rightArmX = -stride;
    let leftLegX = -stride;
    let rightLegX = stride;

    if (a?.airborne) {
      // pose de pulo: pernas encolhidas, braços para cima
      leftLegX = -0.7;
      rightLegX = 0.35;
      leftArmX = -2.3;
      rightArmX = -2.3;
    }

    if (a && a.punchAt >= 0) {
      const t = (time - a.punchAt) / PUNCH_DURATION;
      if (t >= 0 && t < 1) {
        const jab = -1.55 * Math.sin(Math.PI * t);
        if (a.punchSide === 1) rightArmX = jab;
        else leftArmX = jab;
      }
    }

    if (root.current) {
      root.current.position.y =
        moving && !a?.airborne ? Math.abs(Math.sin(time * freq)) * (running ? 0.09 : 0.055) : 0;
      root.current.rotation.x = running ? 0.12 : 0;
    }
    if (leftArm.current) leftArm.current.rotation.x = leftArmX;
    if (rightArm.current) rightArm.current.rotation.x = rightArmX;
    if (leftLeg.current) leftLeg.current.rotation.x = leftLegX;
    if (rightLeg.current) rightLeg.current.rotation.x = rightLegX;
  });

  const girl = look.kind === "girl";
  const skin = skinColor(look.skin);
  const s = outfitStyle(look.outfit);
  const fardaMap = useFardaTexture(s.farda);
  const collar = s.collar ?? s.shirt;
  const hair = girl ? "#24142c" : "#1d1630";
  const sleeve = s.sleeveColor ?? s.shirt;

  return (
    <group ref={root}>
      {/* Tronco */}
      <mesh position={[0, TORSO_Y, 0]} castShadow>
        <capsuleGeometry args={[TORSO_R, 0.48, 5, 16]} />
        <Mat color={s.shirt} rough={s.rough} />
      </mesh>

      {/* Farda: gola polo, botões e estampas */}
      {s.polo && (
        <group>
          <mesh position={[0, 1.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.035, 8, 24]} />
            <Mat color={collar} rough={0.8} />
          </mesh>
          {/* friso / listras da gola */}
          {s.stripes &&
            (s.stripes.count === 2 ? [0.012, -0.012] : [0]).map((dy) => (
              <mesh key={`gola${dy}`} position={[0, 1.335 + dy, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.163, 0.006, 6, 32]} />
                <meshStandardMaterial color={s.stripes!.color} roughness={0.7} />
              </mesh>
            ))}
          {[-1, 1].map((side) => (
            <group
              key={`collar${side}`}
              position={[side * 0.06, 1.3, 0.14]}
              rotation={[-0.6, 0, side * 0.5]}
            >
              <mesh>
                <boxGeometry args={[0.11, 0.08, 0.015]} />
                <Mat color={collar} rough={0.8} />
              </mesh>
              {s.stripes &&
                (s.stripes.count === 2 ? [-0.022, -0.034] : [-0.034]).map((y) => (
                  <mesh key={y} position={[0, y, 0.009]}>
                    <boxGeometry args={[0.112, 0.007, 0.003]} />
                    <meshStandardMaterial color={s.stripes!.color} roughness={0.7} />
                  </mesh>
                ))}
            </group>
          ))}
          <mesh position={[0, 1.2, 0.29]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[0.05, 0.15, 0.01]} />
            <Mat color={s.farda === "ds" ? "#5b21b6" : "#e2e8f0"} />
          </mesh>
          {[1.23, 1.17].map((y) => (
            <mesh key={`btn${y}`} position={[0, y, 0.3]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <Mat color="#cbd5e1" />
            </mesh>
          ))}
        </group>
      )}
      {fardaMap && <FardaWrap map={fardaMap} />}

      {/* Cabeça */}
      <mesh position={[0, 1.57, 0]} castShadow>
        <sphereGeometry args={[0.23, 18, 14]} />
        <meshStandardMaterial color={skin} roughness={0.72} />
      </mesh>
      {
        <mesh position={[0, 1.69, -0.035]} castShadow>
          <sphereGeometry args={[0.235, 18, 12]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
      }
      {girl && (
        <group>
          {[-1, 1].map((side) => (
            <mesh key={`hair${side}`} position={[side * 0.18, 1.47, -0.02]} castShadow>
              <capsuleGeometry args={[0.085, 0.25, 4, 8]} />
              <meshStandardMaterial color={hair} roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
      {
        <group>
          {[-1, 1].map((side) => (
            <mesh key={`eye${side}`} position={[side * 0.075, 1.6, 0.205]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshBasicMaterial color="#1e1532" />
            </mesh>
          ))}
        </group>
      }

      {/* Braços (pivô no ombro) */}
      {[-1, 1].map((side) => (
        <group
          key={`arm${side}`}
          ref={side === -1 ? leftArm : rightArm}
          position={[side * 0.38, 1.2, 0]}
        >
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.34, 4, 8]} />
            {s.sleeves === "short" ? (
              <meshStandardMaterial color={skin} roughness={0.72} />
            ) : (
              <Mat color={sleeve} rough={s.rough} />
            )}
          </mesh>
          {s.sleeves === "short" && (
            <mesh position={[0, -0.06, 0]} castShadow>
              <cylinderGeometry args={[0.112, 0.106, 0.2, 14]} />
              <Mat color={sleeve} rough={s.rough} />
            </mesh>
          )}
          {/* friso / listras na barra da manga */}
          {s.sleeves === "short" &&
            s.stripes &&
            (s.stripes.count === 2 ? [-0.122, -0.144] : [-0.144]).map((y) => (
              <mesh key={`punho${y}`} position={[0, y, 0]}>
                <cylinderGeometry args={[0.109, 0.109, 0.012, 14, 1, true]} />
                <meshStandardMaterial color={s.stripes!.color} roughness={0.7} />
              </mesh>
            ))}
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshStandardMaterial color={skin} roughness={0.72} />
          </mesh>
        </group>
      ))}

      {/* Pernas (pivô no quadril) */}
      {[-1, 1].map((side) => (
        <group
          key={`leg${side}`}
          ref={side === -1 ? leftLeg : rightLeg}
          position={[side * 0.15, 0.6, 0]}
        >
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.105, 0.34, 4, 8]} />
            <Mat color={s.pants} rough={s.rough} />
          </mesh>
          <mesh position={[0, -0.51, 0.045]} castShadow>
            <boxGeometry args={[0.23, 0.12, 0.38]} />
            <Mat color={s.shoe} rough={0.45} />
          </mesh>
          {s.sole && (
            <mesh position={[0, -0.565, 0.045]}>
              <boxGeometry args={[0.24, 0.03, 0.39]} />
              <Mat color={s.sole} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
