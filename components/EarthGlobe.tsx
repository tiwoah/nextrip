'use client';

import { useEffect, useRef, useState } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

type Phase = 'explore' | 'planning';

type TargetLocation = {
  lon: number;
  lat: number;
  height?: number;
};

type EarthGlobeProps = {
  phase: Phase;
  targetLocation?: TargetLocation;
  onReady?: (viewer: any) => void;
};

export function EarthGlobe({ phase, targetLocation, onReady }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const cesiumRef = useRef<any>(null);
  const phaseRef = useRef<Phase>(phase);
  const onReadyRef = useRef(onReady);

  onReadyRef.current = onReady;
  phaseRef.current = phase;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Cesium setup — run only on mount so the viewer is not destroyed on phase change
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const initCesium = async () => {
      try {
        (window as any).CESIUM_BASE_URL = '/cesium';

        const Cesium = await import('cesium');
        cesiumRef.current = Cesium;

        const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN;
        if (!token) {
          throw new Error(
            'Cesium token is missing. Add NEXT_PUBLIC_CESIUM_TOKEN to .env.local'
          );
        }
        Cesium.Ion.defaultAccessToken = token;

        // Create viewer with default ion imagery first (so we never get a blue ball).
        // Custom base imagery (e.g. Blue Marble 3845) is applied asynchronously below.
        const viewerOptions: any = {
          timeline: false,
          animation: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          infoBox: false,
          fullscreenButton: false,
          scene3DOnly: true,
        };

        const viewer = new Cesium.Viewer(containerRef.current!, viewerOptions);
        viewerRef.current = viewer;

        // Replace base layer with Blue Marble (3845) using the async API.
        // Using new IonImageryProvider({ assetId }) can leave the globe blue; fromAssetId is required.
        Cesium.IonImageryProvider.fromAssetId(3845)
          .then((provider: any) => {
            if (destroyed || !viewerRef.current) return;
            const layers = viewer.imageryLayers;
            layers.removeAll();
            layers.addImageryProvider(provider);
          })
          .catch((err: unknown) => {
            console.warn(
              'Blue Marble (3845) failed, keeping default imagery:',
              err
            );
          });

        // Camera: nice global view
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 20, 25_000_000),
        });

        // Interaction: allow rotate, disable zoom
        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableZoom = false;
        controller.enableRotate = true;
        controller.enableTilt = false;
        controller.enableTranslate = false;

        // Slow auto-rotation in explore phase (phaseRef is updated on each render)
        const spinRate = Cesium.Math.toRadians(0.03);
        viewer.clock.onTick.addEventListener(() => {
          if (destroyed) return;
          if (phaseRef.current !== 'explore') return;

          const camera = viewer.camera;
          camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate);
        });

        onReadyRef.current?.(viewer);
        setLoading(false);
      } catch (err) {
        console.error('Cesium initialization failed:', err);
        setError(
          err instanceof Error ? err.message : 'Unknown error initialising Cesium'
        );
        setLoading(false);
      }
    };

    void initCesium();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Respond to phase / target changes (fly-to in planning mode)
  useEffect(() => {
    phaseRef.current = phase;

    if (phase !== 'planning' || !targetLocation) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;

    if (!viewer || !Cesium) return;

    const height = targetLocation.height ?? 1_500_000;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        targetLocation.lon,
        targetLocation.lat,
        height
      ),
      duration: 2.5,
    });
  }, [phase, targetLocation]);

  if (error) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black text-sm text-red-400"
        style={{ minHeight: '300px' }}
      >
        <h2 className="text-base font-medium">Error loading 3D Earth</h2>
        <p>{error}</p>
        <p className="text-xs text-zinc-500">
          Check the browser console for more details.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#aaa',
            zIndex: 10,
            fontSize: '14px',
          }}
        >
          Loading 3D Earth...
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

