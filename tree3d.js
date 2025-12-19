// 3D Tree Animation with Scroll
let scene, camera, renderer, tree;
let scrollProgress = 0;

function init3DTree() {
  // Scene setup
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 8; // Closer camera for bigger tree
  
  // Renderer
  const canvas = document.getElementById('tree3d');
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Fully transparent background
  
  // Create tree geometry
  tree = createTree();
  scene.add(tree);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Handle scroll
  window.addEventListener('scroll', onScroll);
  
  // Start animation
  animate();
}

function createTree() {
  const treeGroup = new THREE.Group();
  
  // Trunk (cylinder) - bigger
  const trunkGeometry = new THREE.CylinderGeometry(0.6, 1, 5, 8);
  const trunkMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = -3;
  treeGroup.add(trunk);
  
  // Foliage layers (cones) - bigger
  const colors = [0x2ecc71, 0x27ae60, 0x1e8449];
  const sizes = [
    { radius: 4, height: 5, y: 0 },
    { radius: 3, height: 4, y: 3.5 },
    { radius: 2, height: 3, y: 6 }
  ];
  
  sizes.forEach((size, i) => {
    const coneGeometry = new THREE.ConeGeometry(size.radius, size.height, 8);
    const coneMaterial = new THREE.MeshPhongMaterial({ 
      color: colors[i],
      flatShading: true
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = size.y;
    treeGroup.add(cone);
  });
  
  // Add decorative spheres (ornaments) - bigger and more
  for (let i = 0; i < 12; i++) {
    const sphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const sphereMaterial = new THREE.MeshPhongMaterial({ 
      color: Math.random() * 0xffffff,
      emissive: Math.random() * 0x444444
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Random position around tree
    const angle = (i / 12) * Math.PI * 2;
    const radius = 1 + Math.random() * 2;
    const height = Math.random() * 7 - 2;
    
    sphere.position.x = Math.cos(angle) * radius;
    sphere.position.z = Math.sin(angle) * radius;
    sphere.position.y = height;
    
    treeGroup.add(sphere);
  }
  
  return treeGroup;
}

function onScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = scrollTop / docHeight;
}

function animate() {
  requestAnimationFrame(animate);
  
  // Rotate tree based on time and scroll
  tree.rotation.y += 0.005;
  tree.rotation.x = Math.sin(Date.now() * 0.001) * 0.1 + (scrollProgress * Math.PI * 2);
  tree.rotation.z = Math.cos(Date.now() * 0.001) * 0.05;
  
  // Move tree based on scroll
  tree.position.y = scrollProgress * -5;
  tree.position.x = Math.sin(scrollProgress * Math.PI) * 3;
  
  // Scale tree based on scroll
  const scale = 1 + scrollProgress * 0.5;
  tree.scale.set(scale, scale, scale);
  
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DTree);
} else {
  init3DTree();
}