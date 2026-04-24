'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import Lenis from '@studio-freight/lenis';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import styles from './Scene3D.module.css';

gsap.registerPlugin(ScrollTrigger);

type Vec3 = [number, number, number];

type PlaneConfig = {
  id: string;
  imageSrc: string;
  position: Vec3;
  rotation: Vec3;
  scale: number;
};

type ChapterCopy = {
  kicker: string;
  title: string;
  body: string;
};

const CAMERA_START_Z = 5;
const CAMERA_END_Z = -15;

const IMAGE_PLANES: PlaneConfig[] = [
  {
    id: 'hero',
    imageSrc: '/hero.jpg',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1.12,
  },
  {
    id: 'pic2',
    imageSrc: '/pic2.png',
    position: [0.32, -0.14, -5],
    rotation: [0, -0.025, 0.006],
    scale: 1.03,
  },
  {
    id: 'pic3',
    imageSrc: '/pic3.png',
    position: [-0.28, 0.16, -10],
    rotation: [0, 0.026, -0.008],
    scale: 1.06,
  },
  {
    id: 'pic4',
    imageSrc: '/pic4.png',
    position: [0.2, 0.02, -15],
    rotation: [0, -0.018, 0.004],
    scale: 1.1,
  },
];

const CHAPTERS: ChapterCopy[] = [
  {
    kicker: 'Protibeshi',
    title: 'Where every lane feels alive',
    body: 'A neighborhood-first space for trusted updates, services, and people nearby.',
  },
  {
    kicker: 'Stories',
    title: 'Every window has a story',
    body: 'Move through the familiar rhythm of homes, streets, and shared local moments.',
  },
  {
    kicker: 'Connection',
    title: 'Connect instantly',
    body: 'Neighbors, services, alerts, and conversations come into view as you move deeper.',
  },
  {
    kicker: 'Community',
    title: 'Build your community',
    body: 'A calmer, faster way to respond, organize, and belong where you live.',
  },
];

const getPlaneSize = (texture: THREE.Texture, scale: number): [number, number] => {
  const image = texture.image as HTMLImageElement | undefined;
  const aspect = image?.width && image.height ? image.width / image.height : 16 / 9;
  const height = 4.48 * scale;

  return [height * aspect, height];
};

const SceneAtmosphere = () => {
  const { scene } = useThree();

  useEffect(() => {
    const previousFog = scene.fog;
    const previousBackground = scene.background;

    scene.fog = new THREE.Fog('#03121b', 5.2, 26);
    scene.background = new THREE.Color('#03121b');

    return () => {
      scene.fog = previousFog;
      scene.background = previousBackground;
    };
  }, [scene]);

  return null;
};

const CameraController = ({ scrollRootRef }: { scrollRootRef: RefObject<HTMLElement> }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const scrollRoot = scrollRootRef.current;

    if (!scrollRoot) {
      return undefined;
    }

    camera.position.set(0, 0, CAMERA_START_Z);
    camera.lookAt(0, 0, 0);

    const ctx = gsap.context(() => {
      gsap.to(camera.position, {
        z: CAMERA_END_Z,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollRoot,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }, scrollRoot);

    return () => {
      ctx.revert();
    };
  }, [camera, scrollRootRef]);

  useFrame(() => {
    const progress = THREE.MathUtils.clamp((CAMERA_START_Z - camera.position.z) / 20, 0, 1);
    const driftX = Math.sin(progress * Math.PI * 2.1) * 0.22;
    const driftY = Math.sin(progress * Math.PI * 1.35) * 0.07;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, driftX, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, driftY, 0.045);
    camera.lookAt(camera.position.x * 0.14, camera.position.y * 0.08, camera.position.z - 8);
  });

  return null;
};

const ImagePlane = ({ imageSrc, position, rotation, scale }: PlaneConfig) => {
  const texture = useLoader(THREE.TextureLoader, imageSrc);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const { camera } = useThree();
  const size = useMemo(() => getPlaneSize(texture, scale), [scale, texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    const mesh = meshRef.current;

    if (!material || !mesh) {
      return;
    }

    const cameraDistance = camera.position.z - position[2];
    const fadeIn = 1 - THREE.MathUtils.smoothstep(cameraDistance, 5.8, 8.2);
    const fadeOut = THREE.MathUtils.smoothstep(cameraDistance, 0.55, 1.7);
    const targetOpacity = THREE.MathUtils.clamp(fadeIn * fadeOut, 0, 1);
    const floatTime = clock.elapsedTime * (0.18 + Math.abs(position[2]) * 0.003);

    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.08);
    mesh.position.x = position[0] + Math.sin(floatTime + position[2]) * 0.024;
    mesh.position.y = position[1] + Math.cos(floatTime * 0.82 + position[0]) * 0.018;
    mesh.rotation.x = rotation[0];
    mesh.rotation.y = rotation[1];
    mesh.rotation.z = rotation[2] + Math.sin(floatTime * 0.64) * 0.004;
    mesh.scale.setScalar(1 + targetOpacity * 0.018);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        fog
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

const DepthScene = ({ scrollRootRef }: { scrollRootRef: RefObject<HTMLElement> }) => (
  <>
    <SceneAtmosphere />
    <CameraController scrollRootRef={scrollRootRef} />
    <group>
      {IMAGE_PLANES.map((plane) => (
        <ImagePlane key={plane.id} {...plane} />
      ))}
    </group>
  </>
);

export const Scene3D = () => {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      duration: shouldReduceMotion ? 0.7 : 1.18,
      smoothWheel: !shouldReduceMotion,
      touchMultiplier: 1.05,
      wheelMultiplier: 0.86,
    });

    const handleLenisScroll = () => {
      ScrollTrigger.update();
    };

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', handleLenisScroll);
    gsap.ticker.add(raf);

    return () => {
      lenis.off('scroll', handleLenisScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-scene-chapter]'));
    const stickyScene = root.querySelector<HTMLElement>('[data-scene-sticky]');

    const setChapterState = (progress: number) => {
      const chapterProgress = progress * Math.max(chapters.length - 0.001, 1);

      chapters.forEach((chapter, index) => {
        const distance = Math.abs(index - chapterProgress);
        const opacity = THREE.MathUtils.clamp(1 - distance * 1.55, 0, 1);

        gsap.set(chapter, {
          autoAlpha: opacity,
          y: (index - chapterProgress) * 18,
        });
      });
    };

    const ctx = gsap.context(() => {
      setChapterState(0);

      if (stickyScene) {
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          pin: stickyScene,
          pinType: 'transform',
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
      }

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => setChapterState(self.progress),
        onRefresh: (self) => setChapterState(self.progress),
      });

      ScrollTrigger.refresh();
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.scene} aria-label="Protibeshi cinematic neighborhood story">
      <div className={styles.stickyScene} data-scene-sticky>
        <Canvas
          className={styles.canvas}
          camera={{ position: [0, 0, CAMERA_START_Z], fov: 52, near: 0.01, far: 80 }}
          dpr={[1, 1.65]}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: import.meta.env.DEV,
            powerPreference: 'high-performance',
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <DepthScene scrollRootRef={rootRef} />
          </Suspense>
        </Canvas>

        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        <div className={styles.copyLayer}>
          {CHAPTERS.map((chapter) => (
            <article key={chapter.title} className={styles.chapter} data-scene-chapter>
              <p className={styles.kicker}>{chapter.kicker}</p>
              <h1>{chapter.title}</h1>
              <p>{chapter.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.depthMeter} aria-hidden="true">
          {IMAGE_PLANES.map((plane) => (
            <span key={plane.id} />
          ))}
        </div>
      </div>
    </section>
  );
};
