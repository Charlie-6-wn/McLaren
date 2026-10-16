export const SCROLL_SEGMENTS = {
  hero: [0, 0.2],
  drivers: [0.2, 0.4],
  specs: [0.4, 0.6],
  roster: [0.6, 0.8],
  cta: [0.8, 1],
}

export const RIG_DEFAULTS = {
  // The GLB's long axis is X. Start from the Z side so the car reads as a
  // horizontal side profile, matching the reference image.
  orbit: Math.PI / 2,
  radius: 7.8,
  height: 1.2,
  lookX: 0,
  lookY: 0.35,
  lookZ: 0,
  carYaw: 0,
  carPitch: 0,
  carLift: 0,
}

export const RIG_POSES = {
  hero: { orbit: Math.PI / 2, radius: 7.8, height: 1.2, lookY: 0.35, carYaw: 0 },
  // From the side-profile hero pose, travel one continuous clockwise orbit.
  drivers: { orbit: Math.PI * 2.5, radius: 8.1, height: 1.45, lookY: 0.38, carYaw: Math.PI * 2 },
  specs: { orbit: Math.PI * 2.72, radius: 5.7, height: 0.82, lookY: 0.42, carYaw: Math.PI * 2.12 },
  roster: { orbit: Math.PI * 2.98, radius: 10.2, height: 2.4, lookY: 0.2, carYaw: Math.PI * 2.3 },
  cta: { orbit: Math.PI * 3.18, radius: 8.5, height: 1.4, lookY: 0.28, carYaw: Math.PI * 2.46 },
}

export const NAV_ITEMS = [
  { label: 'Archive', target: 'hero' },
  { label: 'Drivers', target: 'drivers' },
  { label: 'Machine', target: 'specs' },
  { label: 'Roster', target: 'roster' },
]
