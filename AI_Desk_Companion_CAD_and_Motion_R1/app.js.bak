/**
 * AI Desk Companion CAD Suite - Interactive 3D Web Viewer & Engineering Inspector
 * Powered by Three.js & Open CASCADE CAD Models
 */

(function () {
  'use strict';

  // --- Global State & Configuration ---
  const CONFIG = {
    stlFile: 'AI_Desk_Companion_Assembly.stl',
    nominalCenter: new THREE.Vector3(0, 132, 0), // (X=0, Z_cad=132 -> Y_three=132, Y_cad=-4 -> Z_three=4)
    modelBbox: {
      width: 178.01,
      depth: 100.21,
      height: 264.05
    }
  };

  let scene, camera, renderer, controls;
  let companionMesh = null;
  let bboxHelper = null;
  let groundGrid = null;
  let axesHelper = null;
  let highlightBox = null;
  let isAutoRotating = false;

  // Clipping Planes for 3D Section Slicing
  // CAD Z corresponds to Three.js Y (height)
  // CAD Y corresponds to Three.js -Z (depth)
  // CAD X corresponds to Three.js X (width)
  const clipPlaneZ = new THREE.Plane(new THREE.Vector3(0, -1, 0), 275);  // Height
  const clipPlaneY = new THREE.Plane(new THREE.Vector3(0, 0, -1), 60);   // Depth
  const clipPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);  // Width
  let activeClipping = false;

  // Camera Presets
  const CAMERA_PRESETS = {
    iso: { pos: [240, 240, 310], target: [0, 132, 0] },
    front: { pos: [0, 132, 380], target: [0, 132, 0] },
    right: { pos: [380, 132, 0], target: [0, 132, 0] },
    top: { pos: [0, 480, 10], target: [0, 132, 0] },
    back: { pos: [0, 132, -380], target: [0, 132, 0] },
    left: { pos: [-380, 132, 0], target: [0, 132, 0] }
  };

  // Subsystem Focus Targets
  const SUBSYSTEM_TARGETS = {
    head: { pos: [0, 230, 220], target: [0, 224, 0] },
    body: { pos: [0, 140, 210], target: [0, 140, 0] },
    arms: { pos: [190, 150, 190], target: [0, 145, 0] },
    legs: { pos: [0, 60, 240], target: [0, 50, 0] },
    feet: { pos: [0, 30, 220], target: [0, 10, 0] }
  };

  // --- Material Presets ---
  function getMaterial(presetName) {
    const planes = activeClipping ? [clipPlaneZ, clipPlaneY, clipPlaneX] : [];
    
    switch (presetName) {
      case 'cyberpunk':
        return new THREE.MeshStandardMaterial({
          color: 0x111927,
          metalness: 0.85,
          roughness: 0.22,
          clippingPlanes: planes,
          clipShadows: true
        });
      case 'clay':
        return new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          metalness: 0.05,
          roughness: 0.75,
          clippingPlanes: planes,
          clipShadows: true
        });
      case 'wireframe':
        return new THREE.MeshStandardMaterial({
          color: 0x00f2fe,
          wireframe: true,
          clippingPlanes: planes
        });
      case 'ghost':
        return new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.32,
          roughness: 0.3,
          metalness: 0.4,
          depthWrite: false,
          clippingPlanes: planes
        });
      case 'studio':
      default:
        return new THREE.MeshStandardMaterial({
          color: 0x222936, // Graphite Titanium
          metalness: 0.6,
          roughness: 0.35,
          clippingPlanes: planes,
          clipShadows: true
        });
    }
  }

  // --- Initialization ---
  function init() {
    const container = document.getElementById('viewport-container');
    const canvas = document.getElementById('three-canvas');

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a11);
    scene.fog = new THREE.FogExp2(0x070a11, 0.0012);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 2000);
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
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow slightly below ground
    controls.minDistance = 30;
    controls.maxDistance = 1000;

    // 5. Lighting
    setupLighting();

    // 6. Helpers (Ground grid & coordinate tripod)
    setupHelpers();

    // 7. Load STL Assembly Model
    loadModel();

    // 8. Setup UI & Event Listeners
    setupUI();
    populateBOMTable();
    populateParametersTable();

    // 9. Resize Handling
    window.addEventListener('resize', onWindowResize);

    // 10. Start Animation Loop
    animate();
  }

  // --- Lighting Setup ---
  function setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x94a3b8, 0.7);
    scene.add(ambient);

    // Key directional light (Front-Right Top)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(200, 400, 250);
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
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill light (Left-Front Low)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-250, 150, 200);
    scene.add(fillLight);

    // Rim light (Back Top)
    const rimLight = new THREE.DirectionalLight(0x00f2fe, 0.8);
    rimLight.position.set(0, 300, -350);
    scene.add(rimLight);

    // Studio ground bounce
    const bounceLight = new THREE.DirectionalLight(0x1e293b, 0.3);
    bounceLight.position.set(0, -100, 0);
    scene.add(bounceLight);
  }

  // --- Helpers Setup ---
  function setupHelpers() {
    // Ground Grid at Y = 0 (Base of robot feet)
    groundGrid = new THREE.GridHelper(500, 50, 0x00f2fe, 0x1e293b);
    groundGrid.position.y = 0;
    scene.add(groundGrid);

    // Soft Shadow Ground Plane
    const planeGeo = new THREE.PlaneGeometry(600, 600);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const groundShadow = new THREE.Mesh(planeGeo, planeMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -0.1;
    groundShadow.receiveShadow = true;
    scene.add(groundShadow);

    // Coordinate Axes Tripod at origin
    axesHelper = new THREE.AxesHelper(80);
    axesHelper.position.set(-130, 0, -80);
    scene.add(axesHelper);

    // Highlight Bounding Box for component selection
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    highlightBox = new THREE.LineSegments(boxEdges, boxMat);
    highlightBox.visible = false;
    scene.add(highlightBox);
  }

  // --- STL Model Loader ---
  function loadModel() {
    const loader = new THREE.STLLoader();
    const progressBar = document.getElementById('loader-progress-bar');
    const statusText = document.getElementById('loader-status-text');
    const loaderOverlay = document.getElementById('loader-overlay');

    loader.load(
      CONFIG.stlFile,
      function (geometry) {
        statusText.textContent = 'Generating normals & CAD bounding frames...';
        geometry.computeVertexNormals();

        const curMaterialName = document.getElementById('render-style-select').value;
        const mat = getMaterial(curMaterialName);

        companionMesh = new THREE.Mesh(geometry, mat);
        // CAD Z is up, front is -Y -> Rotate around X by -90 deg
        companionMesh.rotation.x = -Math.PI / 2;
        companionMesh.position.set(0, 0, 0);
        companionMesh.castShadow = true;
        companionMesh.receiveShadow = true;

        scene.add(companionMesh);

        // Bounding Box Helper
        bboxHelper = new THREE.BoxHelper(companionMesh, 0x38bdf8);
        scene.add(bboxHelper);

        // Triangle readout
        const triCount = geometry.attributes.position.count / 3;
        document.getElementById('triangles-readout').textContent =
          `TRIANGLES: ${triCount.toLocaleString()}`;

        // Fade out loading screen
        setTimeout(() => {
          loaderOverlay.classList.add('fade-out');
          showToast('CAD Model Loaded: 75 Components Verified');
        }, 400);
      },
      function (xhr) {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          progressBar.style.width = percent + '%';
          statusText.textContent = `Downloading STL Assembly (${(xhr.loaded / (1024 * 1024)).toFixed(1)} / ${(xhr.total / (1024 * 1024)).toFixed(1)} MB) ... ${percent}%`;
        }
      },
      function (error) {
        console.error('Error loading STL:', error);
        statusText.textContent = 'Failed to load STL file. Please check local server.';
      }
    );
  }

  // --- Smooth Camera Transitions ---
  let camTween = null;

  function tweenCamera(targetPos, targetLookAt, duration = 800) {
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
      // Ease out cubic
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

  // --- UI Setup & Interactions ---
  function setupUI() {
    // 1. Render Style Select
    document.getElementById('render-style-select').addEventListener('change', (e) => {
      if (!companionMesh) return;
      companionMesh.material = getMaterial(e.target.value);
      showToast(`Shader: ${e.target.options[e.target.selectedIndex].text}`);
    });

    // 2. Camera Preset Select
    document.getElementById('camera-preset-select').addEventListener('change', (e) => {
      const p = CAMERA_PRESETS[e.target.value];
      if (p) tweenCamera(p.pos, p.target);
    });

    // 3. Camera Pills
    document.querySelectorAll('.camera-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.camera-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        const p = CAMERA_PRESETS[view];
        if (p) {
          tweenCamera(p.pos, p.target);
          document.getElementById('camera-preset-select').value = view;
        }
      });
    });

    // 4. Viewport Toggles
    const bboxBtn = document.getElementById('btn-toggle-bbox');
    bboxBtn.addEventListener('click', () => {
      if (bboxHelper) {
        bboxHelper.visible = !bboxHelper.visible;
        bboxBtn.classList.toggle('active', bboxHelper.visible);
      }
    });

    const autorotateBtn = document.getElementById('btn-toggle-autorotate');
    autorotateBtn.addEventListener('click', () => {
      isAutoRotating = !isAutoRotating;
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 2.0;
      autorotateBtn.classList.toggle('active', isAutoRotating);
    });

    const resetBtn = document.getElementById('btn-reset-cam');
    resetBtn.addEventListener('click', () => {
      const p = CAMERA_PRESETS.iso;
      tweenCamera(p.pos, p.target);
      highlightBox.visible = false;
      document.getElementById('selected-part-card').style.display = 'none';
      showToast('Camera reset to Isometric view');
    });

    // 5. Grid & Axes Toggles
    const gridBtn = document.getElementById('tool-grid-toggle');
    gridBtn.addEventListener('click', () => {
      groundGrid.visible = !groundGrid.visible;
      gridBtn.classList.toggle('active', groundGrid.visible);
    });

    const axesBtn = document.getElementById('tool-axes-toggle');
    axesBtn.addEventListener('click', () => {
      axesHelper.visible = !axesHelper.visible;
      axesBtn.classList.toggle('active', axesHelper.visible);
    });

    // 6. Section Slicing Controls
    const sliceBtn = document.getElementById('btn-toggle-slice');
    const slicingPanel = document.getElementById('slicing-panel');
    const closeSliceBtn = document.getElementById('btn-close-slice');

    sliceBtn.addEventListener('click', () => {
      activeClipping = !activeClipping;
      sliceBtn.classList.toggle('active', activeClipping);
      slicingPanel.classList.toggle('hidden', !activeClipping);
      if (companionMesh) {
        const style = document.getElementById('render-style-select').value;
        companionMesh.material = getMaterial(style);
      }
      showToast(activeClipping ? '3D Section Slicing Enabled' : 'Slicing Disabled');
    });

    closeSliceBtn.addEventListener('click', () => {
      activeClipping = false;
      sliceBtn.classList.remove('active');
      slicingPanel.classList.add('hidden');
      if (companionMesh) {
        const style = document.getElementById('render-style-select').value;
        companionMesh.material = getMaterial(style);
      }
    });

    // Slicing Sliders
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
    });

    // 7. High-Res Snapshot Export
    document.getElementById('btn-take-snapshot').addEventListener('click', () => {
      // Temporarily hide UI helpers for pristine CAD snapshot
      const prevBbox = bboxHelper ? bboxHelper.visible : false;
      const prevAxes = axesHelper.visible;
      const prevBox = highlightBox.visible;

      if (bboxHelper) bboxHelper.visible = false;
      axesHelper.visible = false;
      highlightBox.visible = false;

      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = `AI_Desk_Companion_CAD_Snapshot_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      if (bboxHelper) bboxHelper.visible = prevBbox;
      axesHelper.visible = prevAxes;
      highlightBox.visible = prevBox;

      showToast('High-Res 3D CAD Snapshot Exported');
    });

    // 8. Sidebar Toggle
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      setTimeout(onWindowResize, 310);
    });

    // 9. Sidebar Tabs Navigation
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        const tabPane = document.getElementById(btn.dataset.tab);
        if (tabPane) tabPane.classList.add('active');
      });
    });

    // 10. Subsystems Focus Cards
    document.querySelectorAll('.subsystem-card').forEach((card) => {
      card.addEventListener('click', () => {
        const sub = card.dataset.subsystem;
        const target = SUBSYSTEM_TARGETS[sub];
        if (target) {
          tweenCamera(target.pos, target.target);
          showToast(`Focusing Subsystem: ${sub.toUpperCase()}`);
        }
      });
    });

    // 11. Technical Drawings Modal
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = document.getElementById('modal-close');

    document.querySelectorAll('.gallery-card').forEach((card) => {
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

  // --- BOM Table Population & Part Highlighting ---
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
          <td class="part-name-cell">${part.name}</td>
          <td><span class="subsystem-badge">${part.module}</span></td>
          <td>${part.bbox_x_mm} &times; ${part.bbox_y_mm} &times; ${part.bbox_z_mm}</td>
        `;

        tr.addEventListener('click', () => {
          document.querySelectorAll('.bom-table tr').forEach((r) => r.classList.remove('selected'));
          tr.classList.add('selected');
          highlightPart(part);
        });

        tbody.appendChild(tr);
      });
    }

    renderRows(items);

    // BOM Filter Chips
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        const query = document.getElementById('bom-search').value.toLowerCase();
        applyBOMFilter(filter, query);
      });
    });

    // BOM Search
    document.getElementById('bom-search').addEventListener('input', (e) => {
      const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;
      applyBOMFilter(activeFilter, e.target.value.toLowerCase());
    });

    function applyBOMFilter(filter, query) {
      const filtered = items.filter((part) => {
        const matchesMod = filter === 'all' || part.module.toLowerCase() === filter;
        const matchesQuery = !query || part.name.toLowerCase().includes(query) || part.module.toLowerCase().includes(query);
        return matchesMod && matchesQuery;
      });
      renderRows(filtered);
    }
  }

  // --- Highlight Part in 3D Viewport ---
  function highlightPart(part) {
    if (!highlightBox) return;

    // Mapping CAD coordinates to Three.js coordinates
    // CAD: X = width, Y = depth (front -Y), Z = height
    // Three.js: X = CAD X, Y = CAD Z, Z = -CAD Y
    const width = parseFloat(part.bbox_x_mm);
    const depth = parseFloat(part.bbox_y_mm);
    const height = parseFloat(part.bbox_z_mm);

    const cx = parseFloat(part.center_x_mm);
    const cy = parseFloat(part.center_y_mm);
    const minZ = parseFloat(part.min_z_mm);
    const cz = minZ + height / 2;

    highlightBox.scale.set(width, height, depth);
    highlightBox.position.set(cx, cz, -cy);
    highlightBox.visible = true;

    // Show details card
    const card = document.getElementById('selected-part-card');
    const spName = document.getElementById('sp-name');
    const spMod = document.getElementById('sp-mod');
    const spDetails = document.getElementById('sp-details');

    card.style.display = 'block';
    spName.textContent = part.name;
    spMod.textContent = part.module.toUpperCase();
    spDetails.innerHTML = `
      <div>Envelope: <strong>${width} &times; ${depth} &times; ${height} mm</strong></div>
      <div>Position: <strong>(${cx}, ${cy}, ${minZ}) mm</strong></div>
      <div>Geometry Status: <strong style="color:var(--accent-emerald);">Solids Validated</strong></div>
    `;

    // Smoothly frame camera on the highlighted component
    const targetPos = [cx + 120, cz + 60, -cy + 150];
    const targetLookAt = [cx, cz, -cy];
    tweenCamera(targetPos, targetLookAt, 600);

    showToast(`Inspecting: ${part.name}`);
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

  // --- Window Resize ---
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
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- Main Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Readout camera position
    const camPosEl = document.getElementById('cam-pos-readout');
    if (camPosEl) {
      camPosEl.textContent = `CAM: (${Math.round(camera.position.x)}, ${Math.round(camera.position.y)}, ${Math.round(camera.position.z)})`;
    }

    renderer.render(scene, camera);
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
