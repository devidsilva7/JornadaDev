import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";

export type AvatarKind = "boy" | "girl";

export function DevAvatar({ kind, moving = false }: { kind: AvatarKind; moving?: boolean }) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Mesh>(null);
  const rightArm = useRef<Mesh>(null);
  const leftLeg = useRef<Mesh>(null);
  const rightLeg = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const stride = moving ? Math.sin(time * 10) * 0.62 : Math.sin(time * 2) * 0.035;
    if (root.current) root.current.position.y = moving ? Math.abs(Math.sin(time * 10)) * 0.055 : 0;
    if (leftArm.current) leftArm.current.rotation.x = stride;
    if (rightArm.current) rightArm.current.rotation.x = -stride;
    if (leftLeg.current) leftLeg.current.rotation.x = -stride;
    if (rightLeg.current) rightLeg.current.rotation.x = stride;
  });

  const hair = kind === "girl" ? "#24142c" : "#1d1630";

  return (
    <group ref={root}>
      <mesh position={[0, 0.88, 0]} castShadow>
        <capsuleGeometry args={[0.29, 0.48, 5, 10]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.57, 0]} castShadow>
        <sphereGeometry args={[0.23, 18, 14]} />
        <meshStandardMaterial color="#d9a27f" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.69, -0.035]} castShadow>
        <sphereGeometry args={[0.235, 18, 12]} />
        <meshStandardMaterial color={hair} roughness={0.9} />
      </mesh>
      {kind === "girl" && (
        <>
          <mesh position={[-0.18, 1.47, -0.02]} castShadow>
            <capsuleGeometry args={[0.085, 0.25, 4, 8]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0.18, 1.47, -0.02]} castShadow>
            <capsuleGeometry args={[0.085, 0.25, 4, 8]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
        </>
      )}
      <mesh position={[0, 1.585, 0.205]}>
        <sphereGeometry args={[0.023, 8, 8]} />
        <meshBasicMaterial color="#1e1532" />
      </mesh>
      <mesh position={[-0.075, 1.61, 0.202]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#1e1532" />
      </mesh>
      <mesh ref={leftArm} position={[-0.38, 0.99, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.34, 4, 8]} />
        <meshStandardMaterial color="#9333ea" roughness={0.58} />
      </mesh>
      <mesh ref={rightArm} position={[0.38, 0.99, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.34, 4, 8]} />
        <meshStandardMaterial color="#9333ea" roughness={0.58} />
      </mesh>
      <mesh ref={leftLeg} position={[-0.15, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.105, 0.34, 4, 8]} />
        <meshStandardMaterial color="#241b38" roughness={0.8} />
      </mesh>
      <mesh ref={rightLeg} position={[0.15, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.105, 0.34, 4, 8]} />
        <meshStandardMaterial color="#241b38" roughness={0.8} />
      </mesh>
      <mesh position={[-0.15, 0.09, 0.045]} castShadow>
        <boxGeometry args={[0.23, 0.12, 0.38]} />
        <meshStandardMaterial color="#f4efff" roughness={0.45} />
      </mesh>
      <mesh position={[0.15, 0.09, 0.045]} castShadow>
        <boxGeometry args={[0.23, 0.12, 0.38]} />
        <meshStandardMaterial color="#f4efff" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.04, 0.295]}>
        <boxGeometry args={[0.13, 0.17, 0.035]} />
        <meshStandardMaterial color="#f4efff" emissive="#a78bfa" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
