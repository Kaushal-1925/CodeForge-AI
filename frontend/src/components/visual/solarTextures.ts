import * as THREE from "three";

/**
 * Procedural astronomical texture generator for the CodeForge AI Solar System.
 * Generates scientifically inspired, high-resolution planetary texture maps
 * entirely in-memory via HTML5 canvas, requiring zero external image downloads.
 */

// 1. Sun Photosphere Texture (Granulation + Convective Plasma)
export function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Base golden-white gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#fef08a");
  grad.addColorStop(0.5, "#facc15");
  grad.addColorStop(1, "#fef08a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Solar convective plasma granulation
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 6 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.6 ? "#ea580c" : Math.random() > 0.3 ? "#f97316" : "#fef9c3";
    ctx.globalAlpha = Math.random() * 0.35 + 0.1;
    ctx.fill();
  }

  // Solar flares and magnetic active regions
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 1024;
    const y = 200 + (Math.random() - 0.5) * 120;
    const r = Math.random() * 35 + 15;
    const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
    radial.addColorStop(0, "#ffffff");
    radial.addColorStop(0.4, "#fed7aa");
    radial.addColorStop(1, "transparent");
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle CodeForge AI Central Identity Marker embedded in equatorial plasma
  ctx.globalAlpha = 0.22;
  ctx.font = "bold 26px 'Courier New', monospace";
  ctx.fillStyle = "#7c2d12";
  ctx.textAlign = "center";
  ctx.fillText("CODEFORGE AI", 256, 262);
  ctx.fillText("CODEFORGE AI", 768, 262);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 2. Mercury Texture (Charcoal & Grey, Heavily Cratered, Lunar Highland Terrain)
export function createMercuryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#4b5563";
  ctx.fillRect(0, 0, 1024, 512);

  // Varied basalt terrain patches
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 70 + 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? "#374151" : "#6b7280";
    ctx.globalAlpha = Math.random() * 0.35 + 0.1;
    ctx.fill();
  }

  // Multi-scale Impact Craters with Bright Ejecta Rays
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 280; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 16 + 2;

    // Crater depression (dark center)
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#1f2937";
    ctx.fill();

    // Raised crater rim (bright crescent)
    ctx.lineWidth = Math.max(1, r * 0.25);
    ctx.strokeStyle = "#9ca3af";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI);
    ctx.stroke();

    // Radial ejecta lines on larger craters
    if (r > 10) {
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.25;
      for (let ray = 0; ray < 6; ray++) {
        const angle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * (r * 3.5), y + Math.sin(angle) * (r * 3.5));
        ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 3. Venus Texture (Dense Sulfur-Yellow and Ivory Cloud Bands, Atmospheric Swirls)
export function createVenusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Smooth creamy golden base
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#fef3c7");
  grad.addColorStop(0.3, "#fde68a");
  grad.addColorStop(0.5, "#fed7aa");
  grad.addColorStop(0.7, "#fde68a");
  grad.addColorStop(1, "#fef3c7");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Aerodynamic horizontal cloud shear bands
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 45; i++) {
    const y = Math.random() * 512;
    const h = Math.random() * 24 + 6;
    ctx.fillStyle = Math.random() > 0.5 ? "#f59e0b" : "#ffffff";
    ctx.fillRect(0, y, 1024, h);
  }

  // Diagonal super-rotational atmospheric chevron waves (distinct Venusian cloud shape)
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 1024;
    const y = 256 + (Math.random() - 0.5) * 160;
    ctx.beginPath();
    ctx.moveTo(x - 120, y - 60);
    ctx.lineTo(x, y);
    ctx.lineTo(x - 120, y + 60);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 4. Earth Texture (Deep Blue Oceans, Recognizable Continents, Swirling Clouds, Polar Ice)
export function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Deep oceanic blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, "#1e3a8a");
  oceanGrad.addColorStop(0.5, "#1d4ed8");
  oceanGrad.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Continents: Americas (Left), Eurasia/Africa (Center), Australia (Right)
  ctx.fillStyle = "#15803d"; // Vegetation green
  ctx.globalAlpha = 0.9;

  // North America
  ctx.beginPath();
  ctx.ellipse(220, 170, 95, 60, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.ellipse(280, 330, 55, 95, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia (Europe + Asia)
  ctx.beginPath();
  ctx.ellipse(650, 160, 150, 70, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Africa
  ctx.beginPath();
  ctx.ellipse(560, 270, 65, 90, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Arid Sahara / Middle East highlands
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.ellipse(550, 230, 50, 30, 0, 0, Math.PI * 2);
  ctx.ellipse(640, 210, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.ellipse(820, 350, 50, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arctic & Antarctic Polar Ice Caps
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.95;
  ctx.fillRect(0, 0, 1024, 38);
  ctx.fillRect(0, 474, 1024, 38);

  // Weather Cloud Layer (Swirling white storms)
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = 80 + Math.random() * 350;
    const len = Math.random() * 140 + 40;
    const h = Math.random() * 22 + 6;
    ctx.beginPath();
    ctx.ellipse(x, y, len, h, Math.sin(x * 0.02) * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 5. Moon Texture (Lunar Regolith, Dark Maria Basalts, Impact Craters)
export function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, 0, 512, 256);

  // Dark Lunar Maria
  ctx.fillStyle = "#4b5563";
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = Math.random() * 45 + 15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Craters
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = Math.random() * 8 + 2;
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 6. Mars Texture (Rust-Red Iron Oxide, Dark Basalt Canyons, White Polar Caps)
export function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Oxidized red soil
  const marsGrad = ctx.createLinearGradient(0, 0, 0, 512);
  marsGrad.addColorStop(0, "#c2410c");
  marsGrad.addColorStop(0.5, "#ea580c");
  marsGrad.addColorStop(1, "#c2410c");
  ctx.fillStyle = marsGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Dark volcanic regions (Syrtis Major / Acidalia Planitia)
  ctx.fillStyle = "#431407";
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * 1024;
    const y = 140 + Math.random() * 230;
    const r = Math.random() * 65 + 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Valles Marineris canyon feature
  ctx.strokeStyle = "#290802";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(320, 270);
  ctx.lineTo(540, 280);
  ctx.stroke();

  // White CO2 Polar Ice Caps
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.95;
  ctx.fillRect(0, 0, 1024, 30);
  ctx.fillRect(0, 482, 1024, 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 7. Jupiter Texture (Latitudinal Belts, Storm Turbulence, The Great Red Spot)
export function createJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Cream base zone
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(0, 0, 1024, 512);

  // Alternating Equatorial & Temperate Cloud Belts
  const belts = [
    { y: 60, h: 40, col: "#92400e" },
    { y: 120, h: 50, col: "#b45309" },
    { y: 190, h: 55, col: "#78350f" }, // North Equatorial Belt
    { y: 260, h: 60, col: "#854d0e" }, // South Equatorial Belt
    { y: 340, h: 45, col: "#b45309" },
    { y: 410, h: 40, col: "#92400e" },
  ];

  belts.forEach((b) => {
    ctx.fillStyle = b.col;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, b.y, 1024, b.h);

    // Turbulence shear along belt margins
    ctx.globalAlpha = 0.25;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.arc(x, b.y + b.h, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#fffbeb";
      ctx.fill();
    }
  });

  // THE GREAT RED SPOT (22 degrees South, distinctive oval anticyclone)
  const spotX = 640;
  const spotY = 295;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 42, 26, 0.05, 0, Math.PI * 2);
  ctx.fillStyle = "#b91c1c"; // Deep crimson-orange storm
  ctx.fill();

  // Storm boundary halo
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner storm core
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(spotX + 2, spotY, 18, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 8. Saturn Atmosphere Texture (Subtle Butterscotch & Tan Cloud Belts)
export function createSaturnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fef08a";
  ctx.fillRect(0, 0, 1024, 512);

  // Soft muted horizontal belts
  for (let i = 0; i < 28; i++) {
    const y = Math.random() * 512;
    const h = Math.random() * 22 + 6;
    ctx.fillStyle = Math.random() > 0.5 ? "#ca8a04" : "#fef9c3";
    ctx.globalAlpha = Math.random() * 0.35 + 0.1;
    ctx.fillRect(0, y, 1024, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 9. Saturn Ring Texture (Cassini Division, Ring A, Ring B, Ring C)
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  // Horizontal gradient representing radial distance from inner to outer ring edge
  // Left = inner edge (C ring), Right = outer edge (A ring)
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);

  // C Ring (Innermost, faint and translucent)
  grad.addColorStop(0.0, "rgba(148, 163, 184, 0.0)");
  grad.addColorStop(0.12, "rgba(203, 213, 225, 0.28)");
  grad.addColorStop(0.24, "rgba(226, 232, 240, 0.45)");

  // B Ring (The widest, brightest, and most opaque main ring)
  grad.addColorStop(0.25, "rgba(254, 243, 199, 0.88)");
  grad.addColorStop(0.45, "rgba(255, 255, 255, 0.95)");
  grad.addColorStop(0.62, "rgba(254, 243, 199, 0.90)");

  // CASSINI DIVISION (The 4,800 km wide dark gap!)
  grad.addColorStop(0.63, "rgba(0, 0, 0, 0.05)");
  grad.addColorStop(0.69, "rgba(0, 0, 0, 0.05)");

  // A Ring (Outer dense ring)
  grad.addColorStop(0.70, "rgba(226, 232, 240, 0.72)");
  grad.addColorStop(0.85, "rgba(241, 245, 249, 0.78)");
  grad.addColorStop(0.96, "rgba(203, 213, 225, 0.55)");
  grad.addColorStop(1.0, "rgba(148, 163, 184, 0.0)"); // Outer edge dropoff

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 64);

  // Add micro-ringlet density variations
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 1024;
    ctx.fillRect(x, 0, Math.random() * 3 + 1, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 10. Uranus Texture (Pale Cyan & Blue-Green Ice Giant)
export function createUranusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#a5f3fc");
  grad.addColorStop(0.5, "#67e8f9");
  grad.addColorStop(1, "#a5f3fc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle atmospheric striations
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(0, Math.random() * 256, 512, Math.random() * 12 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 11. Neptune Texture (Deep Azure Blue, Cirrus Clouds, Great Dark Spot)
export function createNeptuneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#1d4ed8");
  grad.addColorStop(0.5, "#2563eb");
  grad.addColorStop(1, "#1e40af");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Great Dark Spot
  ctx.fillStyle = "#0f172a";
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(320, 140, 28, 16, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // White high-altitude methane cirrus clouds
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillRect(x, y, Math.random() * 50 + 20, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

