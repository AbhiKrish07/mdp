/**
 * form. — AI Desk Companion CAD Suite
 * Minimal, Professional 3D CAD Inspection Suite & Engineering Inspector
 * Powered by Three.js & Open CASCADE CAD Models
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    bundleFile: 'components_pack.bin',
    nominalCenter: new THREE.Vector3(0, 132, 0),
    modelBbox: {
      width: 178.01,
      depth: 100.21,
      height: 264.05
    }
  };

  let scene, camera, renderer, controls;
  let componentsGroup = new THREE.Group();
  let wiringGroup = new THREE.Group();
  let componentMeshes = [];
  let meshLookup = new Map();
  let bboxHelper = null;
  let groundGrid = null;
  let axesHelper = null;
  let highlightBox = null;
  let isAutoRotating = false;

  // Assembly Explosion ("exbands")
  let explodeProgress = 0.0;
  let explodeAnimId = null;

  // Skeleton / X-Ray Mode
  let isSkeletonMode = false;

  // 3D Callout Labels
  let labelsVisible = true;
  let calloutPins = [];

  // Internal Wiring Conduits
  let isWiringVisible = false;

  // Kinematics Animation
  let isAnimating = false;
  let animTime = 0;

  // Raycaster for 3D selection & hover
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  let isPointerDown = false;
  let pointerDownPos = { x: 0, y: 0 };

  // 3D Cross-Section Clipping Planes
  const clipPlaneZ = new THREE.Plane(new THREE.Vector3(0, -1, 0), 275);
  const clipPlaneY = new THREE.Plane(new THREE.Vector3(0, 0, -1), 60);
  const clipPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
  let activeClipping = false;

  // Camera Presets
  const CAMERA_PRESETS = {
    iso: { pos: [240, 240, 310], target: [0, 132, 0] },
    front: { pos: [0, 132, 380], target: [0, 132, 0] },
    right: { pos: [380, 132, 0], target: [0, 132, 0] },
    top: { pos: [0, 480, 10], target: [0, 132, 0] },
    back: { pos: [0, 132, -380], target: [0, 132, 0] }
  };

  // Subsystem Camera Targets
  const SUBSYSTEM_TARGETS = {
    head: { pos: [0, 230, 220], target: [0, 224, 0] },
    body: { pos: [0, 140, 210], target: [0, 140, 0] },
    arms: { pos: [190, 150, 190], target: [0, 145, 0] },
    legs: { pos: [0, 60, 240], target: [0, 50, 0] },
    feet: { pos: [0, 30, 220], target: [0, 10, 0] }
  };

  // --- Material Generators ---
  function getComponentMaterial(item, isSkeleton, shaderStyle) {
    const isDark = document.body.dataset.theme !== 'light';
    const planes = activeClipping ? [clipPlaneZ, clipPlaneY, clipPlaneX] : [];

    // Skeleton / X-Ray Mode:
    if (isSkeleton) {
      if (item.isShell) {
        // Translucent outer shell
        return new THREE.MeshStandardMaterial({
          color: isDark ? 0x38bdf8 : 0x0284c7,
          transparent: true,
          opacity: 0.12,
          roughness: 0.25,
          metalness: 0.1,
          depthWrite: false,
          wireframe: false,
          clippingPlanes: planes
        });
      } else {
        // Vivid internal solid components
        const colorHex = item.color || '#48c7c3';
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorHex),
          metalness: 0.55,
          roughness: 0.3,
          emissive: new THREE.Color(colorHex).multiplyScalar(0.18),
          clippingPlanes: planes,
          clipShadows: true
        });
      }
    }

    // Standard styling
    switch (shaderStyle) {
      case 'cad_color': {
        const c = new THREE.Color(item.color || '#33383d');
        const isEmissive = item.name.includes('Eye') || item.name.includes('LED') || item.name.includes('Glass');
        return new THREE.MeshStandardMaterial({
          color: c,
          metalness: item.name.includes('Bezel') || item.name.includes('Pogo') || item.name.includes('Servo') ? 0.75 : 0.35,
          roughness: item.name.includes('Rubber') ? 0.9 : 0.35,
          emissive: isEmissive ? c.clone().multiplyScalar(0.4) : new THREE.Color(0x000000),
          clippingPlanes: planes,
          clipShadows: true
        });
      }
      case 'cyberpunk': {
        const isAccent = item.name.includes('Eye') || item.name.includes('accent') || item.name.includes('Glass');
        return new THREE.MeshStandardMaterial({
          color: isAccent ? new THREE.Color(0x00f2fe) : new THREE.Color(0x111927),
          metalness: 0.88,
          roughness: 0.22,
          emissive: isAccent ? new THREE.Color(0x00f2fe).multiplyScalar(0.5) : new THREE.Color(0x000000),
          clippingPlanes: planes,
          clipShadows: true
        });
      }
      case 'clay':
        return new THREE.MeshStandardMaterial({
          color: isDark ? 0xdfe6ed : 0xecf0f3,
          metalness: 0.05,
          roughness: 0.85,
          clippingPlanes: planes,
          clipShadows: true
        });
      case 'wireframe':
        return new THREE.MeshStandardMaterial({
          color: isDark ? 0x48c7c3 : 0x138b88,
          wireframe: true,
          clippingPlanes: planes
        });
      case 'ghost':
        return new THREE.MeshStandardMaterial({
          color: 0x48c7c3,
          transparent: true,
          opacity: 0.32,
          roughness: 0.3,
          metalness: 0.4,
          depthWrite: false,
          clippingPlanes: planes
        });
      case 'studio':
      default: {
        const isShell = item.isShell;
        const base = isDark
          ? (isShell ? 0x242d3a : 0x1a212b)
          : (isShell ? 0x424e5e : 0x2f3844);
        const isAccent = item.name.includes('Eye') || item.name.includes('accent') || item.name.includes('Glass');
        return new THREE.MeshStandardMaterial({
          color: isAccent ? new THREE.Color(0x48c7c3) : new THREE.Color(base),
          metalness: isAccent ? 0.2 : 0.62,
          roughness: isAccent ? 0.1 : 0.34,
          emissive: isAccent ? new THREE.Color(0x48c7c3).multiplyScalar(0.4) : new THREE.Color(0x000000),
          clippingPlanes: planes,
          clipShadows: true
        });
      }
    }
  }

  // --- Initialize Application ---
  function init() {
    const container = document.getElementById('viewport-container');
    const canvas = document.getElementById('three-canvas');

    // 1. Scene
    scene = new THREE.Scene();
    scene.add(componentsGroup);
    scene.add(wiringGroup);
    wiringGroup.visible = false;
    updateSceneBackground();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.set(240, 240, 310);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    // 4. OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.copy(CONFIG.nominalCenter);
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minDistance = 30;
    controls.maxDistance = 1000;

    // 5. Lighting & Helpers
    setupLighting();
    setupHelpers();
    setupWiring();

    // 6. Load Binary Components Package
    loadComponents();

    // 7. Setup UI & Listeners
    setupUI();
    populateBOMTable();
    populateParametersTable();

    // 8. Resize & Pointer Events
    window.addEventListener('resize', onWindowResize);
    setupRaycasting(canvas);

    // 9. Start Render Loop
    animate();
  }

  function updateSceneBackground() {
    if (!scene) return;
    const isDark = document.body.dataset.theme !== 'light';
    const bgColor = isDark ? 0x10151b : 0xe9edf0;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.001);
  }

  // --- Lighting Setup ---
  function setupLighting() {
    const isDark = document.body.dataset.theme !== 'light';

    const ambientLight = new THREE.AmbientLight(isDark ? 0x94a3b8 : 0x8a99a8, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(220, 420, 260);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 50;
    keyLight.shadow.camera.far = 1000;
    const d = 220;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x48c7c3, 0.5);
    fillLight.position.set(-250, 160, 200);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6ee7b7, 0.65);
    rimLight.position.set(0, 320, -360);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0x1e293b, 0.35);
    bounceLight.position.set(0, -100, 0);
    scene.add(bounceLight);
  }

  // --- Helpers Setup ---
  function setupHelpers() {
    const isDark = document.body.dataset.theme !== 'light';

    groundGrid = new THREE.GridHelper(500, 50, isDark ? 0x48c7c3 : 0x138b88, isDark ? 0x222a36 : 0xc7d0d8);
    groundGrid.position.y = 0;
    scene.add(groundGrid);

    const planeGeo = new THREE.PlaneGeometry(600, 600);
    const planeMat = new THREE.ShadowMaterial({ opacity: isDark ? 0.45 : 0.22 });
    const groundShadow = new THREE.Mesh(planeGeo, planeMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -0.1;
    groundShadow.receiveShadow = true;
    scene.add(groundShadow);

    axesHelper = new THREE.AxesHelper(80);
    axesHelper.position.set(-130, 0, -80);
    scene.add(axesHelper);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x48c7c3, linewidth: 2 });
    highlightBox = new THREE.LineSegments(boxEdges, boxMat);
    highlightBox.visible = false;
    scene.add(highlightBox);
  }

  // --- 3D Internal Wiring Conduits Setup ---
  function setupWiring() {
    // Conduit Materials
    const cyanWireMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.6
    });

    const amberWireMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xff8c00,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.6
    });

    function addCable(points, mat, radius = 1.3) {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      const geom = new THREE.TubeGeometry(curve, 36, radius, 8, false);
      const tube = new THREE.Mesh(geom, mat);
      wiringGroup.add(tube);
    }

    // 1. Head Core Wiring (Battery -> Pi5 -> Display -> Dock)
    addCable([
      [0, 225, -20],
      [0, 218, -8],
      [0, 205, 5],
      [0, 196, 12],
      [0, 185, 4]
    ], amberWireMat, 1.4);

    addCable([
      [0, 252, -18],
      [0, 240, -10],
      [0, 224, 38],
      [0, 198, 38],
      [0, 185, 0]
    ], cyanWireMat, 1.2);

    // 2. Neck Dock Connector to Torso (Vertical bus line)
    addCable([
      [0, 185, 4],
      [0, 172, 2],
      [0, 160, 0],
      [0, 148, -4],
      [0, 138, -6]
    ], amberWireMat, 1.5);

    addCable([
      [-3, 185, 0],
      [-2, 172, 0],
      [-1, 160, 0],
      [0, 146, 2],
      [0, 136, 6]
    ], cyanWireMat, 1.2);

    // 3. Arm Servo Wiring (Torso logic bay -> Shoulder -> Upper arm -> Elbow)
    // Left arm
    addCable([
      [-8, 140, 0],
      [-24, 144, 0],
      [-38, 146, 0],
      [-52, 136, 0],
      [-66, 125, 0],
      [-82, 112, 0]
    ], cyanWireMat, 1.2);

    // Right arm
    addCable([
      [8, 140, 0],
      [24, 144, 0],
      [38, 146, 0],
      [52, 136, 0],
      [66, 125, 0],
      [82, 112, 0]
    ], cyanWireMat, 1.2);

    // 4. Structural Leg Cable Routing (ESP32 down hollow channels to feet)
    // Left leg
    addCable([
      [-10, 128, 0],
      [-22, 115, 0],
      [-31, 100, 0],
      [-31, 60, 0],
      [-31, 25, 0],
      [-31, 12, 12],
      [-31, 6, 24]
    ], amberWireMat, 1.4);

    // Right leg
    addCable([
      [10, 128, 0],
      [22, 115, 0],
      [31, 100, 0],
      [31, 60, 0],
      [31, 25, 0],
      [31, 12, 12],
      [31, 6, 24]
    ], amberWireMat, 1.4);
  }

  // --- Load Packed Components Binary ---
  function loadComponents() {
    const progressBar = document.getElementById('loader-progress-bar');
    const statusText = document.getElementById('loader-status-text');
    const loaderOverlay = document.getElementById('loader-overlay');

    statusText.textContent = 'Fetching 75-component CAD bundle...';

    fetch(CONFIG.bundleFile)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        statusText.textContent = 'Generating individual component geometry & normals...';
        progressBar.style.width = '70%';

        const manifest = window.COMPONENTS_MANIFEST || [];
        const shaderStyle = document.getElementById('render-style-select').value;
        let totalTris = 0;

        manifest.forEach((item) => {
          const vertFloats = new Float32Array(buffer, item.byteOffset, item.vertexCount * 3);
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.BufferAttribute(vertFloats, 3));
          geom.computeVertexNormals();
          geom.computeBoundingBox();

          const mat = getComponentMaterial(item, isSkeletonMode, shaderStyle);
          const mesh = new THREE.Mesh(geom, mat);

          // Rotate around X by -90 deg (CAD Z is up, front is -Y)
          mesh.rotation.x = -Math.PI / 2;

          // Assembled nominal position
          const assembledPos = new THREE.Vector3(item.tx, item.tz, -item.ty);
          mesh.position.copy(assembledPos);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Exploded position
          const expVector = item.explode || [0, 0, 0];
          const explodedPos = assembledPos.clone().add(
            new THREE.Vector3(expVector[0], expVector[2], -expVector[1])
          );

          // Center for callout pin anchoring
          const boxCenter = new THREE.Vector3();
          geom.boundingBox.getCenter(boxCenter);
          boxCenter.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

          mesh.userData = {
            item: item,
            name: item.name,
            module: item.module,
            isShell: item.isShell,
            label: item.label,
            assembledPos: assembledPos,
            explodedPos: explodedPos,
            localCenter: boxCenter,
            initialRot: mesh.rotation.clone()
          };

          componentsGroup.add(mesh);
          componentMeshes.push(mesh);
          meshLookup.set(item.name, mesh);
          totalTris += item.triangles;
        });

        // Bounding Box Helper around all components
        bboxHelper = new THREE.BoxHelper(componentsGroup, 0x48c7c3);
        scene.add(bboxHelper);

        const triEl = document.getElementById('triangles-readout');
        if (triEl) triEl.textContent = `TRIANGLES: ${totalTris.toLocaleString()}`;

        // Initialize 3D Callout Pins
        createCalloutPins();

        progressBar.style.width = '100%';
        setTimeout(() => {
          loaderOverlay.classList.add('fade-out');
          notify('75 CAD Components & Wiring Engine Initialized');
        }, 300);
      })
      .catch((err) => {
        console.error('Failed to load components pack:', err);
        statusText.textContent = 'Failed to load CAD components pack. Please refresh.';
      });
  }

  // --- Explode Assembly Handler ("exbands") ---
  function setExplodeProgress(val) {
    explodeProgress = Math.max(0, Math.min(1, val));
    const slider = document.getElementById('slider-explode');
    if (slider) slider.value = Math.round(explodeProgress * 100);
    const valEl = document.getElementById('explode-val');
    if (valEl) valEl.textContent = `${Math.round(explodeProgress * 100)}%`;

    componentMeshes.forEach((mesh) => {
      mesh.position.lerpVectors(
        mesh.userData.assembledPos,
        mesh.userData.explodedPos,
        explodeProgress
      );
    });

    if (bboxHelper) bboxHelper.update();
  }

  function animateExplodeToggle() {
    const target = explodeProgress < 0.5 ? 1.0 : 0.0;
    const start = explodeProgress;
    const duration = 750;
    const startTime = performance.now();

    if (explodeAnimId) cancelAnimationFrame(explodeAnimId);

    function step() {
      const now = performance.now();
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setExplodeProgress(start + (target - start) * ease);

      if (t < 1) {
        explodeAnimId = requestAnimationFrame(step);
      } else {
        explodeAnimId = null;
        notify(target === 1.0 ? 'Assembly Exploded (Expanded)' : 'Assembly Assembled');
      }
    }
    step();
  }

  // --- Skeleton / X-Ray Mode Handler ---
  function toggleSkeletonMode() {
    isSkeletonMode = !isSkeletonMode;
    const btn = document.getElementById('btn-toggle-skeleton');
    if (btn) {
      btn.classList.toggle('selected', isSkeletonMode);
      btn.classList.toggle('active-skeleton', isSkeletonMode);
    }

    updateAllMaterials();
    notify(isSkeletonMode ? 'X-Ray View: Outer shells translucent, internal parts visible' : 'X-Ray View disabled');
  }

  function updateAllMaterials() {
    const shaderStyle = document.getElementById('render-style-select').value;
    componentMeshes.forEach((mesh) => {
      mesh.material = getComponentMaterial(mesh.userData.item, isSkeletonMode, shaderStyle);
    });
  }

  // --- 3D Callout Labels Creation & Projection (Color-Coordinated) ---
  function createCalloutPins() {
    const overlay = document.getElementById('labels-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    calloutPins = [];

    componentMeshes.forEach((mesh) => {
      const label = mesh.userData.label;
      if (!label) return;

      const color = label.color || '#48c7c3';
      const badge = label.badge || 'PART';

      const pin = document.createElement('div');
      pin.className = 'callout-pin';
      pin.innerHTML = `
        <div class="callout-dot" style="background:${color}; box-shadow:0 0 9px ${color};"></div>
        <div class="callout-card" style="border-left:3px solid ${color};">
          <div style="display:flex; align-items:center; gap:5px;">
            <span class="callout-badge" style="background:${color}24; color:${color}; border:1px solid ${color}44;">${badge}</span>
            <span class="callout-title">${label.title}</span>
          </div>
          <span class="callout-sub">${label.sub}</span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        focusPart(mesh);
      });

      overlay.appendChild(pin);
      calloutPins.push({ pin: pin, mesh: mesh });
    });
  }

  function updateCalloutPins() {
    if (!labelsVisible || !calloutPins.length) return;

    const container = document.getElementById('viewport-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const worldPos = new THREE.Vector3();

    calloutPins.forEach((item) => {
      worldPos.copy(item.mesh.position).add(item.mesh.userData.localCenter);
      worldPos.project(camera);

      const isVisible = worldPos.z < 1.0 &&
        worldPos.x >= -1.1 && worldPos.x <= 1.1 &&
        worldPos.y >= -1.1 && worldPos.y <= 1.1;

      if (!isVisible) {
        item.pin.classList.add('hidden');
        return;
      }

      const screenX = (worldPos.x * 0.5 + 0.5) * width;
      const screenY = (-worldPos.y * 0.5 + 0.5) * height;

      item.pin.style.left = `${screenX}px`;
      item.pin.style.top = `${screenY}px`;
      item.pin.classList.remove('hidden');
    });
  }

  // --- Raycasting for 3D Hover & Click ---
  function setupRaycasting(canvas) {
    const tooltip = document.getElementById('part-3d-tooltip');

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(componentMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hoveredMesh = hit;
        canvas.style.cursor = 'pointer';

        if (tooltip) {
          const lbl = hit.userData.label ? `${hit.userData.label.title} &bull; ` : '';
          const cat = hit.userData.label ? `<span style="color:${hit.userData.label.color}">[${hit.userData.label.badge}]</span> ` : '';
          tooltip.innerHTML = `${cat}<strong>${lbl}${hit.userData.name}</strong> <span style="color:var(--muted)">(${hit.userData.module.toUpperCase()})</span>`;
          tooltip.style.left = `${e.clientX - rect.left + 12}px`;
          tooltip.style.top = `${e.clientY - rect.top + 12}px`;
          tooltip.classList.add('show');
        }
      } else {
        hoveredMesh = null;
        canvas.style.cursor = 'grab';
        if (tooltip) tooltip.classList.remove('show');
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist < 5 && hoveredMesh) {
        focusPart(hoveredMesh);
      }
      isPointerDown = false;
    });

    canvas.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('show');
    });
  }

  // --- Focus & Highlight Component ---
  function focusPart(mesh) {
    const item = mesh.userData.item;
    highlightPart(item, mesh);
  }

  function highlightPart(item, optMesh) {
    const mesh = optMesh || meshLookup.get(item.name);
    if (!mesh) return;

    const geom = mesh.geometry;
    geom.computeBoundingBox();
    const bb = geom.boundingBox;

    const size = new THREE.Vector3();
    bb.getSize(size);

    highlightBox.scale.set(size.x * 1.05, size.z * 1.05, size.y * 1.05);
    highlightBox.position.copy(mesh.position).add(mesh.userData.localCenter);
    highlightBox.visible = true;

    // Show details card in Inspector
    const card = document.getElementById('selected-part-card');
    const spName = document.getElementById('sp-name');
    const spMod = document.getElementById('sp-mod');
    const spDetails = document.getElementById('sp-details');

    if (card) {
      card.style.display = 'block';
      const lbl = mesh.userData.label;
      spName.textContent = lbl ? `${lbl.title} (${item.name})` : item.name;
      spMod.textContent = item.module.toUpperCase();
      spDetails.innerHTML = `
        <div>Envelope: <strong>${item.bbox_x_mm || size.x.toFixed(1)} &times; ${item.bbox_y_mm || size.y.toFixed(1)} &times; ${item.bbox_z_mm || size.z.toFixed(1)} mm</strong></div>
        <div>Triangles: <strong>${item.triangles ? item.triangles.toLocaleString() : 'N/A'}</strong></div>
        <div>Category: <strong style="color:${lbl ? lbl.color : 'var(--accent)'};">${lbl ? lbl.badge : item.module.toUpperCase()}</strong></div>
        <div>Status: <strong style="color:var(--accent-emerald);">Solids Validated &bull; Manifold</strong></div>
      `;
    }

    // Highlight row in BOM table
    document.querySelectorAll('.parts-table tr').forEach((r) => {
      r.classList.toggle('selected', r.dataset.name === item.name);
      if (r.dataset.name === item.name) {
        r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Smoothly frame camera on highlighted component
    const targetLookAt = mesh.position.clone().add(mesh.userData.localCenter);
    const offset = new THREE.Vector3(80, 50, 110);
    const targetPos = targetLookAt.clone().add(offset);
    tweenCamera([targetPos.x, targetPos.y, targetPos.z], [targetLookAt.x, targetLookAt.y, targetLookAt.z], 600);

    const title = mesh.userData.label ? mesh.userData.label.title : item.name;
    notify(`Inspecting: ${title}`);
  }

  // --- Smooth Camera Transitions ---
  let camTween = null;

  function tweenCamera(targetPos, targetLookAt, duration = 750) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = new THREE.Vector3(...targetPos);
    const endTarget = new THREE.Vector3(...targetLookAt);
    const startTime = performance.now();

    if (camTween) cancelAnimationFrame(camTween);

    function step() {
      const now = performance.now();
      const elapsed = (now - startTime) / duration;
      const t = Math.min(1, Math.max(0, elapsed));
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (t < 1) {
        camTween = requestAnimationFrame(step);
      } else {
        camTween = null;
      }
    }
    step();
  }

  // --- Setup UI Handlers ---
  function setupUI() {
    // 1. Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    function setTheme(theme) {
      document.body.dataset.theme = theme;
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      themeToggle.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
      themeToggle.querySelector('.theme-glyph').textContent = isDark ? '☼' : '◐';
      themeToggle.querySelector('.theme-label').textContent = isDark ? 'Light mode' : 'Dark mode';

      updateSceneBackground();
      updateAllMaterials();
      if (bboxHelper) {
        bboxHelper.material.color.setHex(isDark ? 0x48c7c3 : 0x138b88);
      }
    }

    const savedTheme = localStorage.getItem('form-theme') || 'dark';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem('form-theme', next);
      notify(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    });

    // 2. Sidebar Navigation Rail & Collapsing
    const workspaceEl = document.querySelector('.workspace');
    const sidebarToggle = document.getElementById('sidebarToggle');
    sidebarToggle.addEventListener('click', () => {
      const collapsed = workspaceEl.classList.toggle('sidebar-collapsed');
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
      sidebarToggle.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
      setTimeout(onWindowResize, 240);
    });

    // Inspector Sidebar Toggle (prevents right-side overlap)
    const inspectorToggle = document.getElementById('btn-toggle-inspector');
    if (inspectorToggle) {
      inspectorToggle.addEventListener('click', () => {
        const collapsed = workspaceEl.classList.toggle('inspector-collapsed');
        inspectorToggle.classList.toggle('selected', collapsed);
        notify(collapsed ? 'Inspector sidebar collapsed (Full Canvas)' : 'Inspector sidebar restored');
        setTimeout(onWindowResize, 240);
      });
    }

    document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar .nav-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');

        const tabId = item.dataset.tab;
        switchTab(tabId);

        if (item.dataset.sub === 'assemblies') {
          const subHeading = document.querySelector('.list-heading');
          if (subHeading) subHeading.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // 3. Inspector Tabs
    document.querySelectorAll('.inspector .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        switchTab(tabId);
      });
    });

    function switchTab(tabId) {
      document.querySelectorAll('.inspector .tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === tabId);
      });
      document.querySelectorAll('.tab-pane').forEach((p) => {
        p.classList.toggle('active', p.id === tabId);
      });

      document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.tab === tabId && !item.dataset.sub);
      });

      const activeTabEl = document.querySelector(`.inspector .tab[data-tab="${tabId}"]`);
      if (activeTabEl) {
        notify(`${activeTabEl.textContent.trim()} selected`);
      }
    }

    // 4. View Choice Buttons (ISO, Front, Right, Top, Rear)
    document.querySelectorAll('.view-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-choice').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const view = btn.dataset.view;
        const target = CAMERA_PRESETS[view];
        if (target) {
          tweenCamera(target.pos, target.target);
          notify(`${btn.textContent} view`);
        }
      });
    });

    // 5. Wiring Toggle (⚡ Wiring)
    const wiringBtn = document.getElementById('btn-toggle-wiring');
    if (wiringBtn) {
      wiringBtn.addEventListener('click', () => {
        isWiringVisible = !isWiringVisible;
        wiringGroup.visible = isWiringVisible;
        wiringBtn.classList.toggle('selected', isWiringVisible);
        wiringBtn.classList.toggle('active-wiring', isWiringVisible);
        notify(isWiringVisible ? '3D Internal Wiring & Harness Conduits illuminated' : 'Wiring hidden');
      });
    }

    // 6. Kinematics Animation Toggle (▶ Animate)
    const animateBtn = document.getElementById('btn-toggle-animate');
    if (animateBtn) {
      animateBtn.addEventListener('click', () => {
        isAnimating = !isAnimating;
        animateBtn.classList.toggle('selected', isAnimating);
        animateBtn.classList.toggle('active-anim', isAnimating);
        animateBtn.innerHTML = isAnimating
          ? '<span class="tiny-icon">⏸</span> Animating'
          : '<span class="tiny-icon">▶</span> Animate';
        notify(isAnimating ? 'Expressive Motion Cycle active' : 'Animation paused');
      });
    }

    // 7. Skeleton / X-Ray Toggle (⛶ X-Ray)
    const skeletonBtn = document.getElementById('btn-toggle-skeleton');
    if (skeletonBtn) {
      skeletonBtn.addEventListener('click', toggleSkeletonMode);
    }

    // 8. 3D Labels Toggle (🏷 Labels)
    const labelsBtn = document.getElementById('btn-toggle-labels');
    const overlay = document.getElementById('labels-overlay');
    if (labelsBtn) {
      labelsBtn.addEventListener('click', () => {
        labelsVisible = !labelsVisible;
        labelsBtn.classList.toggle('selected', labelsVisible);
        if (overlay) overlay.style.display = labelsVisible ? 'block' : 'none';
        notify(labelsVisible ? 'Color-coded 3D labels shown' : '3D Labels hidden');
      });
    }

    // 9. Explode Controls (💥 Explode & Slider)
    const sliderExplode = document.getElementById('slider-explode');
    if (sliderExplode) {
      sliderExplode.addEventListener('input', (e) => {
        setExplodeProgress(parseFloat(e.target.value) / 100);
      });
    }

    const btnAnimateExplode = document.getElementById('btn-animate-explode');
    if (btnAnimateExplode) {
      btnAnimateExplode.addEventListener('click', () => {
        animateExplodeToggle();
      });
    }

    // 10. Secondary Dock Viewport Actions
    const bboxBtn = document.getElementById('btn-toggle-bbox');
    bboxBtn.addEventListener('click', () => {
      if (bboxHelper) {
        bboxHelper.visible = !bboxHelper.visible;
        bboxBtn.classList.toggle('selected', bboxHelper.visible);
        notify(`Bounds ${bboxHelper.visible ? 'shown' : 'hidden'}`);
      }
    });

    const gridBtn = document.getElementById('btn-toggle-grid');
    gridBtn.addEventListener('click', () => {
      if (groundGrid) {
        groundGrid.visible = !groundGrid.visible;
        gridBtn.classList.toggle('selected', groundGrid.visible);
        notify(`Grid ${groundGrid.visible ? 'shown' : 'hidden'}`);
      }
    });

    const axesBtn = document.getElementById('btn-toggle-axes');
    axesBtn.addEventListener('click', () => {
      if (axesHelper) {
        axesHelper.visible = !axesHelper.visible;
        axesBtn.classList.toggle('selected', axesHelper.visible);
        notify(`Axes ${axesHelper.visible ? 'shown' : 'hidden'}`);
      }
    });

    const styleSelect = document.getElementById('render-style-select');
    styleSelect.addEventListener('change', () => {
      updateAllMaterials();
      notify(`Style: ${styleSelect.options[styleSelect.selectedIndex].text}`);
    });

    const orbitBtn = document.getElementById('btn-toggle-autorotate');
    orbitBtn.addEventListener('click', () => {
      isAutoRotating = !isAutoRotating;
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 2.0;
      orbitBtn.classList.toggle('selected', isAutoRotating);
      notify(`Auto-Orbit ${isAutoRotating ? 'enabled' : 'paused'}`);
    });

    const resetBtn = document.getElementById('btn-reset-cam');
    resetBtn.addEventListener('click', () => {
      const p = CAMERA_PRESETS.iso;
      tweenCamera(p.pos, p.target);
      if (highlightBox) highlightBox.visible = false;
      const card = document.getElementById('selected-part-card');
      if (card) card.style.display = 'none';

      document.querySelectorAll('.view-choice').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === 'iso');
      });
      setExplodeProgress(0.0);
      notify('View reset to ISO (Assembled)');
    });

    const snapBtn = document.getElementById('btn-snapshot');
    snapBtn.addEventListener('click', () => {
      const prevBbox = bboxHelper ? bboxHelper.visible : false;
      const prevAxes = axesHelper ? axesHelper.visible : false;
      const prevBox = highlightBox ? highlightBox.visible : false;

      if (bboxHelper) bboxHelper.visible = false;
      if (axesHelper) axesHelper.visible = false;
      if (highlightBox) highlightBox.visible = false;

      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = `AI_Desk_Companion_CAD_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      if (bboxHelper) bboxHelper.visible = prevBbox;
      if (axesHelper) axesHelper.visible = prevAxes;
      if (highlightBox) highlightBox.visible = prevBox;

      notify('Snapshot captured & downloaded');
    });

    // 11. Cross-Section Slicing
    const sliceBtn = document.getElementById('btn-toggle-slice');
    const slicingPanel = document.getElementById('slicing-panel');
    const closeSliceBtn = document.getElementById('btn-close-slice');

    sliceBtn.addEventListener('click', () => {
      activeClipping = !activeClipping;
      sliceBtn.classList.toggle('selected', activeClipping);
      slicingPanel.classList.toggle('hidden', !activeClipping);
      updateAllMaterials();
      notify(activeClipping ? '3D Slicing enabled' : 'Slicing disabled');
    });

    closeSliceBtn.addEventListener('click', () => {
      activeClipping = false;
      sliceBtn.classList.remove('selected');
      slicingPanel.classList.add('hidden');
      updateAllMaterials();
    });

    const sliderZ = document.getElementById('slider-slice-z');
    const sliderY = document.getElementById('slider-slice-y');
    const sliderX = document.getElementById('slider-slice-x');
    const valZ = document.getElementById('slice-z-val');
    const valY = document.getElementById('slice-y-val');
    const valX = document.getElementById('slice-x-val');

    sliderZ.addEventListener('input', (e) => {
      clipPlaneZ.constant = parseFloat(e.target.value);
      valZ.textContent = `${e.target.value} mm`;
    });
    sliderY.addEventListener('input', (e) => {
      clipPlaneY.constant = parseFloat(e.target.value);
      valY.textContent = `${e.target.value} mm`;
    });
    sliderX.addEventListener('input', (e) => {
      clipPlaneX.constant = parseFloat(e.target.value);
      valX.textContent = `${e.target.value} mm`;
    });

    document.getElementById('btn-reset-slices').addEventListener('click', () => {
      sliderZ.value = 270;
      sliderY.value = 50;
      sliderX.value = 90;
      clipPlaneZ.constant = 270;
      clipPlaneY.constant = 50;
      clipPlaneX.constant = 90;
      valZ.textContent = '270 mm';
      valY.textContent = '50 mm';
      valX.textContent = '90 mm';
      notify('Slicing planes reset');
    });

    // 12. Subsystems list focus cards
    document.querySelectorAll('.subsystem').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subsystem').forEach((b) => (b.style.borderColor = ''));
        btn.style.borderColor = 'var(--accent)';

        const sub = btn.dataset.subsystem;
        const target = SUBSYSTEM_TARGETS[sub];
        if (target) {
          tweenCamera(target.pos, target.target);
          notify(`Focus: ${btn.querySelector('strong').textContent}`);
        }
      });
    });

    document.getElementById('btn-view-all-subsystems').addEventListener('click', () => {
      switchTab('tab-bom');
      notify('Showing all 75 components');
    });

    document.getElementById('btn-goto-files').addEventListener('click', () => {
      switchTab('tab-files');
    });

    // 13. Technical Drawings Lightbox
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = document.getElementById('modal-close');

    document.querySelectorAll('.drawing-card').forEach((card) => {
      card.addEventListener('click', () => {
        modalImg.src = card.dataset.img;
        modalCaption.textContent = card.dataset.title;
        modal.classList.add('open');
      });
    });

    modalClose.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // --- Populate BOM Table & 3D Highlighting ---
  function populateBOMTable() {
    const tbody = document.getElementById('bom-tbody');
    const items = window.MANIFEST_DATA || [];
    if (!tbody || !items.length) return;

    function renderRows(filteredItems) {
      tbody.innerHTML = '';
      filteredItems.forEach((part) => {
        const tr = document.createElement('tr');
        tr.dataset.name = part.name;
        tr.dataset.module = part.module;
        tr.innerHTML = `
          <td><strong>${part.name}</strong></td>
          <td><span class="sp-module-badge">${part.module}</span></td>
          <td class="dim-cell">${part.bbox_x_mm} &times; ${part.bbox_y_mm} &times; ${part.bbox_z_mm}</td>
        `;

        tr.addEventListener('click', () => {
          document.querySelectorAll('.parts-table tr').forEach((r) => r.classList.remove('selected'));
          tr.classList.add('selected');
          highlightPart(part);
        });

        tbody.appendChild(tr);
      });
    }

    renderRows(items);

    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        const query = document.getElementById('bom-search').value.toLowerCase();
        applyFilter(filter, query);
      });
    });

    document.getElementById('bom-search').addEventListener('input', (e) => {
      const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;
      applyFilter(activeFilter, e.target.value.toLowerCase());
    });

    function applyFilter(filter, query) {
      const filtered = items.filter((part) => {
        const matchesMod = filter === 'all' || part.module.toLowerCase() === filter;
        const matchesQuery =
          !query ||
          part.name.toLowerCase().includes(query) ||
          part.module.toLowerCase().includes(query);
        return matchesMod && matchesQuery;
      });
      renderRows(filtered);
    }
  }

  // --- Populate Parameters Table ---
  function populateParametersTable() {
    const table = document.getElementById('params-table');
    const params = window.DESIGN_PARAMS || {};
    if (!table) return;

    let html = '';
    for (const [key, val] of Object.entries(params)) {
      const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      html += `
        <tr>
          <td class="param-key">${cleanKey}</td>
          <td class="param-val">${val}</td>
        </tr>
      `;
    }
    table.innerHTML = html;
  }

  // --- Resize Handler ---
  function onWindowResize() {
    const container = document.getElementById('viewport-container');
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function notify(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // --- Main Render Loop with Kinematics ---
  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Kinematics Expressive Motion Cycle
    if (isAnimating) {
      animTime += 0.025;
      const headYaw = Math.sin(animTime * 1.2) * 0.18;
      const headPitch = Math.sin(animTime * 2.0) * 0.06;
      const headRoll = Math.cos(animTime * 0.9) * 0.04;

      const armSwingL = Math.sin(animTime * 1.5) * 0.22;
      const armSwingR = -Math.sin(animTime * 1.5) * 0.22;

      componentMeshes.forEach((mesh) => {
        const mod = mesh.userData.module;
        const name = mesh.userData.name;

        if (mod === 'head') {
          // Rotate head parts around neck pivot (0, 185, 0)
          mesh.rotation.y = headYaw;
          mesh.rotation.z = headRoll;
          mesh.rotation.x = -Math.PI / 2 + headPitch;
        } else if (mod === 'arms') {
          if (name.includes('_L') || name.endsWith('L')) {
            mesh.rotation.x = -Math.PI / 2 + armSwingL;
          } else if (name.includes('_R') || name.endsWith('R')) {
            mesh.rotation.x = -Math.PI / 2 + armSwingR;
          }
        }
      });
    }

    // Update 3D Callout Pins Screen Positions
    updateCalloutPins();

    const camPosEl = document.getElementById('cam-pos-readout');
    if (camPosEl) {
      camPosEl.textContent = `CAM: (${Math.round(camera.position.x)}, ${Math.round(camera.position.y)}, ${Math.round(camera.position.z)})`;
    }

    renderer.render(scene, camera);
  }

  // Boot
  window.addEventListener('DOMContentLoaded', init);
})();
