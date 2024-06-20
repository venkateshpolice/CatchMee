import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.min.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js";

// let sleighModel;
// let loader = new GLTFLoader();
// loader.load("./assets/player.glb", (gltf) => {
//   sleighModel = gltf.scene;
//   console.log("sleighModel",sleighModel);
// });
export class Game {
    constructor() {
        this.speed = 0.2;
        this.jumpVelocity = 0.2;
        this.gravity = 0.01;
        this.isJumping = false;
        this.velocityY = 0;
        this.roadWidth = 10;
        this.roadLength = 100;
        this.randomObstacles = [];
        this.roadSegmentWidth = 10;
        this.roadSegmentHeight = 100;
        this.numSegments = 3;
        this.roadSegments = [];

        let handleKeyDown = (event) => {
            if (event.keyCode == 37) {
                this.player.position.x -= this.speed;
            }
            else if (event.keyCode == 39) {
                this.player.position.x += this.speed;
            }

            else if (event.keyCode == 32) {
                if (!this.isJumping) {
                    this.isJumping = true;
                    this.velocityY = this.jumpVelocity;
                }
            }

        }
        document.onkeydown = handleKeyDown;
    }
    start() {
        this.score = 1;
        this.scene();
        this.animate();
    }
    stop() {
        this.renderer.setAnimationLoop(null);
    }
    scene() {
        const container = document.getElementById('container');
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#050F26');
        this.scene.fog = new THREE.Fog('#050F26', 30, 50);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
        this.GameObj = new THREE.Group();
        this.GameObj.rotation.y = 3.15;
        this.scene.add(this.GameObj);
        this.addLights();
        this.addPlayer();
        this.addRoad();
        this.placeObstacles(10);
        this.placeEnimies(5);



    }
    animate() {
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.movePlayer();
        this.checkCollision();
        //this.updateCamera();
        this.particles.rotation.x -= 0.005;
        if (this.isJumping) {
            this.player.position.y += this.velocityY;
            this.velocityY -= this.gravity;
            if (this.player.position.y <= 0) {
                this.player.position.y = 0;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }
        this.renderer.render(this.scene, this.camera);

    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    resetLevel() {

    }
    updateCamera() {
        //to follow the player camera 
        //camera.position.copy(player.position).add(cameraOffset);
        //camera.lookAt(cameraTarget);
    }
    handleSwipe(event) {
        if (event == 'left') {
            this.player.position.x -= 1.5;
        }
        else if (event == 'right') {
            this.player.position.x += 1.5;
        }

        else if (event == 'jump') {
            if (!this.isJumping) {
                this.isJumping = true;
                this.velocityY = this.jumpVelocity;
            }
        }

    }
    // Move the player forward
    movePlayer() {
        //player.position.z += speed; // Move the player forward along the z-axis
        //this.road.position.z -= this.speed; // Move the road backward along the z-axis
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].position.z += this.speed; // Move segments forward

            // Reposition segment if it goes behind the camera
            if (this.roadSegments[i].position.z > this.camera.position.z + this.roadSegmentHeight) {
                this.roadSegments[i].position.z -= this.roadSegmentHeight * this.numSegments;
                this.roadSegments[i].material.color.setHex(Math.random() * 0xffffff);
            }
        }
        for (let i = 0; i < this.randomObstacles.length; i++) {
            this.randomObstacles[i].position.z -= this.speed; // Move segments forward

            // Reposition obstacles if it goes behind the camera
            if (this.randomObstacles[i].position.z < this.camera.position.z) {
                this.randomObstacles[i].position.z += this.roadSegmentHeight+this.getRandomInRange(1,20);
                console.log("random",this.roadSegmentHeight+this.getRandomInRange(1,20));
            }
        }


    }
    checkBox3(obj1, obj2) {
        const obj1Box = new THREE.Box3().setFromObject(obj1);
        const obj2Box = new THREE.Box3().setFromObject(obj2);
        return obj1Box.intersectsBox(obj2Box);
    }
    checkCollision() {
        for (let i = 0; i < this.randomObstacles.length; i++) {
            let a = this.checkBox3(this.player, this.randomObstacles[i]);
            if (a) {
                if (this.randomObstacles[i].userData.type == 'obstacle') {
                    this.randomObstacles[i].position.z += this.roadSegmentHeight;
                    document.getElementById('score').textContent = 'Score:' + this.score++;
                    console.log("hit done");
                }
                else if (this.randomObstacles[i].userData.type == 'enimy') {
                    this.randomObstacles[i].position.z += this.roadSegmentHeight;
                    this.stop();
                    document.getElementById('container').innerHTML = '';
                    document.getElementById('repopup').style.visibility = 'visible';
                }


            }

        }
    }
    addLights() {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
        hemiLight.position.set(0, 20, 0);
        this.GameObj.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 3);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = - 2;
        dirLight.shadow.camera.left = - 2;
        dirLight.shadow.camera.right = 2;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        this.GameObj.add(dirLight);

    }
    addPlayer() {

        const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        // sleighModel.scale.set(0.5,0.5,0.5);
        // this.player=sleighModel;
        this.GameObj.add(this.player);
        this.particles = this.makeParticles();
        this.particles.position.z = 51;
        this.scene.add(this.particles);
        this.player.position.set(0, 0, 0);


        this.cameraOffset = new THREE.Vector3(0, 5, -10); // Offset camera position behind the player
        //cameraTarget = new THREE.Vector3(0, 0, 0); // Look at the player's position
        this.camera.position.copy(this.player.position).add(this.cameraOffset);
        this.camera.lookAt(this.player.position);


    }
    addRoad() {
        const texture = new THREE.TextureLoader().load('https://s3.ap-south-1.amazonaws.com/dev-plugxrassets/uploads/user_files/HJRJB1/road_dg546.jpg');
        for (let i = 0; i < this.numSegments; i++) {
            const geometry = new THREE.PlaneGeometry(this.roadSegmentWidth, this.roadSegmentHeight);
            const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture,color:Math.random() * 0xffffff });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2; // Rotate plane to be horizontal
            plane.position.z = -i * this.roadSegmentHeight;
            this.GameObj.add(plane);
            this.roadSegments.push(plane);
        }
    }
    makeParticles() {
        // PARTICLES
        let bgParticlesGeometry = new THREE.BufferGeometry();
        let count = 1500;
        let positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            if (i % 3 == 0) {
                // x
                positions[i] = (Math.random() - 0.5) * 10;
            }
            if (i % 3 == 1) {
                // y
                positions[i] = (Math.random() - 0.5) * 100;
            }
            if (i % 3 == 2) {
                // z
                positions[i] = (Math.random() - 0.5) * 100;
            }
        }
        bgParticlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        let bgParticlesMaterial = new THREE.PointsMaterial();
        bgParticlesMaterial.size = 0.05;
        bgParticlesMaterial.sizeAttenuation = true;
        bgParticlesMaterial.transparent = true;
        // bgParticlesMaterial.alphaMap = ;
        bgParticlesMaterial.depthWrite = false;
        bgParticlesMaterial.color = new THREE.Color("white");
        let bgParticles = new THREE.Points(bgParticlesGeometry, bgParticlesMaterial);
        return bgParticles;
    }
    getRandomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 2)) + min;
        
    }
    createObstacle() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const obstacle = new THREE.Mesh(geometry, material);
        return obstacle;
    }

    // Function to place randomObstacles on the road
    placeObstacles(numberOfObstacles) {
        for (let i = 0; i < numberOfObstacles; i++) {
            const obstacle = this.createObstacle();
            obstacle.position.set(this.getRandomInRange(-3, 3), 0, this.getRandomInRange(this.roadSegmentHeight / 4, this.roadSegmentHeight * 2));
            this.scene.add(obstacle);
            obstacle.userData.type = 'obstacle';
            this.randomObstacles.push(obstacle);

        }

    }
    placeEnimies(numberOfObstacles) {
        for (let i = 0; i < numberOfObstacles; i++) {
            const obstacle = this.createObstacle();
            obstacle.material.color.setHex(0xFF0000)
            obstacle.position.set(this.getRandomInRange(-3, 3), 0, this.getRandomInRange(this.roadSegmentHeight / 4, this.roadSegmentHeight * 2));
            obstacle.userData.type = 'enimy';
            this.scene.add(obstacle);
            this.randomObstacles.push(obstacle);
        }
    }
    makeOneTree() {
        let colors = ["#008000", "#228B22", "#006400"];
        let tree = new THREE.Group();
        let r = 1;
        for (let i = 0; i < 3; i++) {
            let color = colors[i];
            let leaves = new THREE.Mesh(
                new THREE.ConeGeometry(r, 1, 32),
                new THREE.MeshStandardMaterial({ color: color })
            );
            leaves.position.y = i * 0.5;
            tree.add(leaves);
            r -= 0.25;
        }
        let trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 1, 10),
            new THREE.MeshBasicMaterial({ color: "#3A271A" })
        );
        trunk.position.y -= 0.5;
        tree.add(trunk);
        return tree;
    }

    //place trees
    makeTrees(treeNum) {
        let trees = new THREE.Group();
        let posx = 5;
        for (let i = 0; i < treeNum; i++) {
            if (i % 2 == 0)
                posx = -5;
            else
                posx = 5;
            let tree = this.makeOneTree();
            tree.position.set(
                posx,
                ((Math.random() * 150) / 2) *
                (Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1),
                -1

            );
            tree.rotation.set(-1.57, 0, 0);
            trees.add(tree);

        }
        this.randomObstacles.push(trees);
        return trees;
    }
}
