import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from 'gsap';

let sleighModel, coinModel,drumModel,speedModel;
const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    //console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onLoad = function () {
    console.log('Loading complete!');
    document.getElementById('startButton').textContent = 'Start Game';
    document.getElementById('startButton').disabled = false;
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    //console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onError = function (url) {
    //console.log('There was an error loading ' + url);
};
let loader = new GLTFLoader(manager);
loader.load("./assets/player.glb", (gltf) => {
    sleighModel = gltf.scene;
    sleighModel.traverse(function (child) {
        child.castShadow = true;
        if (child.isMesh) {

        }
    });

});
loader.load("./assets/coin.glb", (gltf) => {
    coinModel = gltf.scene;
    coinModel.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.material.roughness = 0;
            child.material.metalness = 1;
            child.material.needsUpdate = true;
        }

    });
});
loader.load("./assets/drum.glb", (gltf) => {
    drumModel = gltf.scene;
    drumModel.scale.set(2,2,2);
});
loader.load("./assets/arrow_speed.glb", (gltf) => {
    speedModel = gltf.scene;
    speedModel.scale.set(0.01,0.01,0.01);
});
export class Game {
    constructor() {
        this.speed = 0.5;
        this.jumpVelocity = 0.25;
        this.gravity = 0.01;
        this.isJumping = false;
        this.velocityY = 0;
        this.roadWidth = 10;
        this.roadLength = 100;
        this.randomObstacles = [];
        this.roadSegmentWidth = 20;
        this.roadSegmentHeight = 100;
        this.numSegments = 3;
        this.roadSegments = [];

        let handleKeyDown = (event) => {


            if (event.keyCode == 37) {
                this.movePlayer('left');
            }
            else if (event.keyCode == 39) {
                this.movePlayer('right');
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
        this.scene.fog = new THREE.Fog('#050F26', 100, 150);
        this.scene.environment = new THREE.TextureLoader().load('./assets/envMap.jpg');
        this.scene.environment.mapping = THREE.EquirectangularReflectionMapping;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200);
        //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.GameObj = new THREE.Group();
        //this.GameObj.rotation.y = 3.15;
        this.scene.add(this.GameObj);
        this.addLights();
        this.addMoon();
        this.addPlayer();
        this.addRoad();
        this.placeObstacles(5);
        this.SpeedObstacle(1);
        this.placeEnimies(2);



    }
    animate() {
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.reGenerate();
        this.checkCollision();
        this.particles.rotation.x += 0.005;
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
    handleSwipe(event) {
        if (event == 'left') {
            this.movePlayer('left');
        }
        else if (event == 'right') {
            this.movePlayer('right')
        }

        else if (event == 'jump') {
            if (!this.isJumping) {
                this.isJumping = true;
                this.velocityY = this.jumpVelocity;
            }
        }

    }
    movePlayer(direction) {
        const distance = 0.5; // Distance to move
        const duration = 0.2; // Duration of the animation in seconds
        let targetPosition = this.player.position.x + (direction === 'left' ? -distance : +distance);
        if (targetPosition >= 3)
            targetPosition = 3;
        if (targetPosition <= -3)
            targetPosition = -3;
        gsap.to(this.player.position, { x: targetPosition, duration: duration, ease: 'power1.out' });

    }
    // Move the player forward
    reGenerate() {
        //player.position.z += speed; // Move the player forward along the z-axis
        //this.road.position.z -= this.speed; // Move the road backward along the z-axis
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].position.z += this.speed; // Move segments forward

            // Reposition segment if it goes behind the camera
            if (this.roadSegments[i].position.z > this.camera.position.z + this.roadSegmentHeight) {
                this.roadSegments[i].position.z -= this.roadSegmentHeight * this.numSegments;
                //this.roadSegments[i].material.color.setHex(Math.random() * 0xffffff);
            }
        }
        for (let i = 0; i < this.randomObstacles.length; i++) {
            this.randomObstacles[i].rotation.y+=0.01;
            this.randomObstacles[i].position.z += this.speed; // Move segments forward

            // Reposition obstacles if it goes behind the camera
            if (this.randomObstacles[i].position.z > this.camera.position.z) {
                this.randomObstacles[i].position.z -= this.roadSegmentHeight + this.getRandomInRange(1, 20);
                this.randomObstacles[i].position.x = this.getRandomInRange(-8, 8);

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
                 
                    this.randomObstacles[i].position.z -= this.roadSegmentHeight;
                    this.randomObstacles[i].position.x = this.getRandomInRange(-8, 8);
                    document.getElementById('score').textContent = 'Score:' + this.score++;

                }
                else if (this.randomObstacles[i].userData.type == 'speedCoin') {
                    this.randomObstacles[i].position.z -= this.roadSegmentHeight;
                    this.randomObstacles[i].position.x = this.getRandomInRange(-8, 8);
                    this.speed += 0.1;
                }
                
                else if (this.randomObstacles[i].userData.type == 'enimy') {
                    this.randomObstacles[i].position.z -= this.roadSegmentHeight;
                    this.stop();
                    document.getElementById('container').innerHTML = '';
                    document.getElementById('repopup').style.visibility = 'visible';
                }


            }

        }
    }
    addLights() {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 5);
        hemiLight.position.set(0, 20, 0);
        this.GameObj.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 5);
        dirLight.position.set(0, 10, -10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = - 50;
        dirLight.shadow.camera.left = - 10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        this.GameObj.add(dirLight);

    }
    addPlayer() {
        // console.log("sleighModel",sleighModel);
        // const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
        // const playerMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
        // this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        sleighModel.scale.set(1, 1, 1);
        sleighModel.rotation.y = 3.14;
        sleighModel.castShadow = true;
        this.player = sleighModel
        this.GameObj.add(this.player);
        this.particles = this.makeParticles();
        this.particles.position.z = -100;
        this.scene.add(this.particles);
        this.player.position.set(0, 0, -5);

        //this.camera.position.set(0,5,5);
        //this.camera.lookAt(this.scene.position)
        this.cameraOffset = new THREE.Vector3(0, 5, 15); // Offset camera position behind the player
        //cameraTarget = new THREE.Vector3(0, 0, 0); // Look at the player's position
        this.camera.position.copy(this.player.position).add(this.cameraOffset);
        //this.camera.lookAt(this.player.position);


    }

    addMoon = () => {
        let moon = new THREE.Mesh(
            new THREE.SphereGeometry(2, 30, 30),
            new THREE.MeshStandardMaterial({ color: "white", emissiveIntensity: 10, emissiveColor: 'white' })
        );
        moon.position.x = -5;
        moon.position.y = 18;
        moon.position.z = -40;
        this.scene.add(moon);
    };

    addRoad() {
        const texture = new THREE.TextureLoader().load('./assets/road.jpg');
        for (let i = 0; i < this.numSegments; i++) {
            const geometry = new THREE.PlaneGeometry(this.roadSegmentWidth, this.roadSegmentHeight);
            const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture});
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
            plane.position.z = i * this.roadSegmentHeight;
            plane.position.y = -0.1;
            plane.receiveShadow = true;
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
                positions[i] = (Math.random() - 0.5) * 100;
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
        obstacle.castShadow = true;
        return obstacle;
    }

    // Function to place randomObstacles on the road
    placeObstacles(numberOfObstacles) {
        for (let i = 0; i < numberOfObstacles; i++) {

            const obstacle = coinModel.clone();
            obstacle.position.set(this.getRandomInRange(-8, 8), 0, -this.getRandomInRange(this.roadSegmentHeight, this.roadSegmentHeight * 2));
            this.scene.add(obstacle);
            obstacle.userData.type = 'obstacle';
            this.randomObstacles.push(obstacle);

        }

    }
    SpeedObstacle(numberOfObstacles) {
        for (let i = 0; i < numberOfObstacles; i++) {
            //const obstacle = this.createObstacle();
            const obstacle=speedModel.clone();
            obstacle.position.set(this.getRandomInRange(-8, 8), 1, -this.getRandomInRange(this.roadSegmentHeight, this.roadSegmentHeight * 2));
            this.scene.add(obstacle);
            obstacle.userData.type = 'speedCoin';
            this.randomObstacles.push(obstacle);

        }
    }
    placeEnimies(numberOfObstacles) {
        for (let i = 0; i < numberOfObstacles; i++) {
            //const obstacle = this.createObstacle();
            //obstacle.material.color.setHex(0xFF0000)
            const obstacle=drumModel.clone();
            obstacle.position.set(this.getRandomInRange(-8, 8), 0, -this.getRandomInRange(this.roadSegmentHeight, this.roadSegmentHeight * 2));
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
