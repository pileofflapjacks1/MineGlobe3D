import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import {
  companyById,
  countryById,
  getLatestSiteMetrics,
  getSiteVolumeScore,
  miningSites,
} from '../../data/miningData';
import { METAL_COLORS, metalMatchesFilter } from '../../utils/colors';
import { formatProduction } from '../../utils/format';
import { useAppStore } from '../../store/useAppStore';
import type { MiningSite } from '../../data/types';

interface MarkerPoint {
  id: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  site: MiningSite;
  label: string;
  /** Radius in deg for three-globe points (surface-bound) */
  radius: number;
}

/**
 * Site markers use native pointsData (Three.js spheres on the globe mesh).
 * HTML markers were abandoned — they project in screen space and float off
 * the Earth when on the limb or far side of the globe.
 */
export function GlobeView() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  const metalFilter = useAppStore((s) => s.metalFilter);
  const period = useAppStore((s) => s.period);
  const autoRotate = useAppStore((s) => s.autoRotate);
  const showArcs = useAppStore((s) => s.showArcs);
  const flyTo = useAppStore((s) => s.flyTo);
  const highlightedSiteIds = useAppStore((s) => s.highlightedSiteIds);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectSite = useAppStore((s) => s.selectSite);
  const selectCountry = useAppStore((s) => s.selectCountry);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.max(320, width), h: Math.max(320, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointOfView({ lat: 20, lng: -20, altitude: 2.4 }, 0);
    const controls = g.controls();
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;
      controls.minDistance = 120;
      controls.maxDistance = 500;
    }
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!flyTo || !globeRef.current) return;
    globeRef.current.pointOfView(
      { lat: flyTo.lat, lng: flyTo.lng, altitude: flyTo.altitude ?? 1.6 },
      1200,
    );
  }, [flyTo]);

  const points: MarkerPoint[] = useMemo(() => {
    const filtered = miningSites.filter((s) =>
      metalMatchesFilter(s.primaryMetal, metalFilter),
    );

    const volumes = filtered.map((s) => getSiteVolumeScore(s.id, period));
    const maxVol = Math.max(...volumes, 1);

    return filtered.map((site, i) => {
      const vol = volumes[i];
      const highlighted =
        !highlightedSiteIds ||
        highlightedSiteIds.length === 0 ||
        highlightedSiteIds.includes(site.id);
      const selected = selectedSiteId === site.id;
      // Relative production scale → point radius (deg units for three-globe)
      const base = 0.22 + (vol / maxVol) * 0.55;
      const size = selected ? base * 1.35 : highlighted ? base : base * 0.55;
      return {
        id: site.id,
        lat: site.lat,
        lng: site.lng,
        size,
        radius: size,
        color: selected
          ? METAL_COLORS[site.primaryMetal]
          : highlighted
            ? METAL_COLORS[site.primaryMetal]
            : `${METAL_COLORS[site.primaryMetal]}88`,
        site,
        label: site.name,
      };
    });
  }, [metalFilter, period, highlightedSiteIds, selectedSiteId]);

  const rings = useMemo(() => {
    if (!selectedSiteId) return [];
    const site = miningSites.find((s) => s.id === selectedSiteId);
    if (!site) return [];
    return [
      {
        lat: site.lat,
        lng: site.lng,
        maxR: 2.5,
        propagationSpeed: 2,
        repeatPeriod: 1200,
        color: METAL_COLORS[site.primaryMetal],
      },
    ];
  }, [selectedSiteId]);

  const arcs = useMemo(() => {
    if (!showArcs) return [];
    const list: {
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      color: string[];
    }[] = [];
    for (const site of miningSites) {
      if (metalFilter !== 'all' && !metalMatchesFilter(site.primaryMetal, metalFilter)) continue;
      for (const cid of site.companyIds) {
        const co = companyById[cid];
        if (!co) continue;
        list.push({
          startLat: co.hqLat,
          startLng: co.hqLng,
          endLat: site.lat,
          endLng: site.lng,
          color: [`${METAL_COLORS[site.primaryMetal]}44`, `${METAL_COLORS[site.primaryMetal]}aa`],
        });
      }
    }
    return list;
  }, [showArcs, metalFilter]);

  const countryLabels = useMemo(
    () =>
      Object.values(countryById).map((c) => ({
        ...c,
        size: 0.55,
      })),
    [],
  );

  const handlePointClick = useCallback(
    (point: object) => {
      const p = point as MarkerPoint;
      selectSite(p.site.id);
      requestFlyTo(p.site.lat, p.site.lng, 1.45);
      setHighlightedSites([p.site.id]);
    },
    [selectSite, requestFlyTo, setHighlightedSites],
  );

  const handleLabelClick = useCallback(
    (label: object) => {
      const c = label as (typeof countryLabels)[0];
      selectCountry(c.id);
      requestFlyTo(c.lat, c.lng, 1.9);
      const ids = miningSites.filter((s) => s.countryId === c.id).map((s) => s.id);
      setHighlightedSites(ids);
    },
    [selectCountry, requestFlyTo, setHighlightedSites],
  );

  const pointLabel = useCallback((d: object) => {
    const p = d as MarkerPoint;
    const metrics = getLatestSiteMetrics(p.site.id);
    const primary = metrics.find((m) => m.metal === p.site.primaryMetal) ?? metrics[0];
    const tickers = p.site.companyIds
      .map((id) => companyById[id]?.ticker)
      .filter(Boolean)
      .join('/');
    const prod = primary
      ? `${formatProduction(primary.production, primary.unit)} (${primary.period})`
      : '';
    return `
      <div style="
        font-family:Inter,system-ui,sans-serif;
        background:#121a2e;
        border:1px solid #1e2a42;
        border-radius:8px;
        padding:8px 10px;
        box-shadow:0 8px 24px rgba(0,0,0,.45);
        max-width:240px;
      ">
        <div style="font-weight:600;font-size:12px;color:${p.color}">${p.site.name}</div>
        <div style="color:#8b9bb4;font-size:11px;margin-top:3px">${tickers} · ${p.site.primaryMetal}</div>
        ${prod ? `<div style="color:#a8b5c4;font-size:11px;margin-top:2px">${prod}</div>` : ''}
      </div>
    `;
  }, []);

  return (
    <div ref={containerRef} className="globe-container relative h-full w-full">
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        atmosphereColor="#0ea5e9"
        atmosphereAltitude={0.18}
        // Surface-bound Three.js points (no HTML midair float)
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="radius"
        pointResolution={16}
        pointsMerge={false}
        pointLabel={pointLabel}
        onPointClick={handlePointClick}
        // Soft pulse on selected site
        ringsData={rings}
        ringColor={(d: object) => (d as { color: string }).color}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2500}
        arcStroke={0.35}
        arcAltitudeAutoScale={0.3}
        labelsData={countryLabels}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={0.5}
        labelDotRadius={0.15}
        labelColor={() => 'rgba(168,181,196,0.5)'}
        labelResolution={2}
        labelAltitude={0.012}
        onLabelClick={handleLabelClick as (label: object) => void}
        enablePointerInteraction
      />
    </div>
  );
}
