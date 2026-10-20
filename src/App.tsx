import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Contact, Hero, Organisations, PartnerProducts, SoloProducts, TeamProducts } from './components/Sections';
import { useReveal } from './hooks/useReveal';
import { ParticleScene, type Density, type Motion } from './scene/ParticleScene';

interface Props {
  density?: Density;
  motion?: Motion;
  trails?: boolean;
}

const WIDE_MIN = 900;

export default function App({ density = 'medium', motion = 'normal', trails = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ParticleScene | null>(null);
  const [active, setActive] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [wide, setWide] = useState(() => innerWidth >= WIDE_MIN);

  useReveal();

  useEffect(() => {
    const scene = new ParticleScene(canvasRef.current!, { density, motion, trails, onActiveChange: setActive });
    sceneRef.current = scene;
    const onResize = () => setWide(innerWidth >= WIDE_MIN);
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('resize', onResize);
      scene.dispose();
      sceneRef.current = null;
      setSoundOn(false);
    };
    // Options are pushed in by the effect below; the scene is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setOptions({ density, motion, trails });
  }, [density, motion, trails]);

  const toggleSound = () => {
    if (sceneRef.current) setSoundOn(sceneRef.current.toggleSound());
  };

  return (
    <div dir="rtl" className="page">
      <canvas ref={canvasRef} className="scene-canvas" />
      <Header active={active} wide={wide} soundOn={soundOn} onToggleSound={toggleSound} />
      <main id="top" className="main">
        <Hero />
        <PartnerProducts />
        <TeamProducts />
        <SoloProducts />
        <Organisations />
        <Contact />
      </main>
    </div>
  );
}
