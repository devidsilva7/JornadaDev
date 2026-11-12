import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import type { NpcLook } from "@/game/people";

/** Bonequinho leve (sem texturas) usado pelos NPCs e pelo guia. Frente = +z. */
export const NpcFigure = memo(function NpcFigure({
  look,
  seated = false,
  label,
  sublabel,
  motion,
}: {
  look: NpcLook;
  seated?: boolean;
  label?: string | undefined;
  sublabel?: string | undefined;
  /** quando presente, anima a caminhada enquanto motion.current.moving for true */
  motion?: { current: { moving: boolean } } | undefined;
}) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const phase = useRef(Math.random() * 10);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase.current;
    if (seated) {
      // respiração leve
      if (root.current) root.current.position.y = Math.sin(t * 1.6) * 0.008;
      return;
    }
    const moving = Boolean(motion?.current.moving);
    const stride = moving ? Math.sin(t * 10) * 0.6 : Math.sin(t * 2) * 0.04;
    if (leftArm.current) leftArm.current.rotation.x = stride;
    if (rightArm.current) rightArm.current.rotation.x = -stride;
    if (leftLeg.current) leftLeg.current.rotation.x = moving ? -stride : 0;
    if (rightLeg.current) rightLeg.current.rotation.x = moving ? stride : 0;
    if (root.current) root.current.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.05 : 0;
  });

  const { skin, shirt, pants, girl } = look;
  // sentado: o corpo desce até o assento da cadeira
  const drop = seated ? -0.1 : 0;

  return (
    <group>
      <group ref={root}>
        <group position={[0, drop, 0]}>
          {/* Tronco */}
          <mesh position={[0, 0.88, 0]} castShadow>
            <capsuleGeometry args={[girl ? 0.27 : 0.29, 0.46, 4, 12]} />
            <meshStandardMaterial color={shirt} roughness={0.8} />
          </mesh>
          {/* Cabeça */}
          <mesh position={[0, 1.57, 0]} castShadow>
            <sphereGeometry args={[0.23, 16, 12]} />
            <meshStandardMaterial color={skin} roughness={0.72} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`eye${side}`} position={[side * 0.075, 1.6, 0.205]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshBasicMaterial color="#1e1532" />
            </mesh>
          ))}
          <Hair look={look} />
          {look.glasses && (
            <group position={[0, 1.6, 0.215]}>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.08, 0, 0]}>
                  <torusGeometry args={[0.055, 0.012, 6, 16]} />
                  <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.3} />
                </mesh>
              ))}
              <mesh>
                <boxGeometry args={[0.06, 0.012, 0.012]} />
                <meshStandardMaterial color="#111827" />
              </mesh>
            </group>
          )}

          {/* Braços */}
          {[-1, 1].map((side) => (
            <group
              key={`arm${side}`}
              ref={side === -1 ? leftArm : rightArm}
              position={[side * 0.37, 1.2, 0]}
              rotation={[seated ? -0.95 : 0, 0, 0]}
            >
              <mesh position={[0, -0.21, 0]} castShadow>
                <capsuleGeometry args={[0.09, 0.32, 4, 8]} />
                <meshStandardMaterial color={shirt} roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.44, 0]}>
                <sphereGeometry args={[0.08, 10, 8]} />
                <meshStandardMaterial color={skin} roughness={0.72} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Pernas */}
        {[-1, 1].map((side) =>
          seated ? (
            <group key={`leg${side}`} position={[side * 0.15, 0.5, 0]}>
              {/* coxa para frente */}
              <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
                <meshStandardMaterial color={pants} roughness={0.85} />
              </mesh>
              {/* canela para baixo */}
              <mesh position={[0, -0.22, 0.36]} castShadow>
                <capsuleGeometry args={[0.095, 0.3, 4, 8]} />
                <meshStandardMaterial color={pants} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.44, 0.42]}>
                <boxGeometry args={[0.22, 0.1, 0.32]} />
                <meshStandardMaterial color="#111827" roughness={0.5} />
              </mesh>
            </group>
          ) : (
            <group
              key={`leg${side}`}
              ref={side === -1 ? leftLeg : rightLeg}
              position={[side * 0.15, 0.6, 0]}
            >
              <mesh position={[0, -0.25, 0]} castShadow>
                <capsuleGeometry args={[0.1, 0.34, 4, 8]} />
                <meshStandardMaterial color={pants} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.51, 0.045]}>
                <boxGeometry args={[0.22, 0.12, 0.36]} />
                <meshStandardMaterial color="#111827" roughness={0.5} />
              </mesh>
            </group>
          ),
        )}
      </group>

      {label && (
        <Html
          position={[0, (seated ? 1.9 : 2.05) + drop, 0]}
          center
          distanceFactor={9}
          zIndexRange={[6, 0]}
        >
          <span className="pointer-events-none flex flex-col items-center whitespace-nowrap rounded-md bg-[#120e24]/85 px-1.5 py-0.5 text-center leading-tight text-white shadow">
            <span className="text-[11px] font-bold">{label}</span>
            {sublabel && <span className="text-[9px] text-amber-200">{sublabel}</span>}
          </span>
        </Html>
      )}
    </group>
  );
});

function Hair({ look }: { look: NpcLook }) {
  const mat = <meshStandardMaterial color={look.hairColor} roughness={0.9} />;
  switch (look.hair) {
    case "bald":
      // calvo: só uma faixa de cabelo na nuca e nas laterais
      return (
        <mesh position={[0, 1.55, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.215, 0.035, 6, 20, Math.PI]} />
          {mat}
        </mesh>
      );
    case "straight":
      // cabelo liso e comprido
      return (
        <group>
          <mesh position={[0, 1.66, -0.02]}>
            <sphereGeometry args={[0.245, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            {mat}
          </mesh>
          <mesh position={[0, 1.4, -0.12]}>
            <boxGeometry args={[0.46, 0.5, 0.16]} />
            {mat}
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.2, 1.45, 0.02]}>
              <boxGeometry args={[0.07, 0.4, 0.2]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
    case "bun":
      // cabelo liso preso (coque)
      return (
        <group>
          <mesh position={[0, 1.66, -0.02]}>
            <sphereGeometry args={[0.245, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            {mat}
          </mesh>
          <mesh position={[0, 1.72, -0.25]}>
            <sphereGeometry args={[0.11, 12, 10]} />
            {mat}
          </mesh>
        </group>
      );
    case "curly":
      return (
        <group>
          <mesh position={[0, 1.7, -0.03]}>
            <sphereGeometry args={[0.26, 14, 10]} />
            {mat}
          </mesh>
          {[
            [-0.17, 1.62, -0.1],
            [0.17, 1.62, -0.1],
            [0, 1.62, -0.2],
            [-0.12, 1.84, 0.02],
            [0.12, 1.84, 0.02],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <sphereGeometry args={[0.11, 10, 8]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
    case "short":
    default:
      return (
        <mesh position={[0, 1.69, -0.035]}>
          <sphereGeometry args={[0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {mat}
        </mesh>
      );
  }
}
