(function () {
  "use strict";

  const THREE = window.THREE;
  if (!THREE) throw new Error("Three.js precisa ser carregado antes de accordion-3d.js");

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  class Accordion3D {
    constructor(canvas, app, zone) {
      this.canvas = canvas;
      this.app = app;
      this.zone = zone;
      this.viewHeight = 10;
      this.viewWidth = 5;
      this.pulseStartedAt = -Infinity;
      this.lastLeft = { x: .32, y: .73 };
      this.lastRight = { x: .68, y: .73 };

      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-2.5, 2.5, 5, -5, .1, 50);
      this.camera.position.set(0, -.65, 17);
      this.camera.lookAt(0, 0, 0);

      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.addLights();
      this.addAccordion();
      this.addMagicWaves();

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    addLights() {
      const hemisphere = new THREE.HemisphereLight(0x8fc7ff, 0x2a0803, 1.45);
      this.scene.add(hemisphere);

      const key = new THREE.DirectionalLight(0xffd27a, 4.1);
      key.position.set(-4, 6, 9);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      this.scene.add(key);

      this.magicLight = new THREE.PointLight(0xff9d20, 9, 18, 2);
      this.magicLight.position.set(0, .2, 5);
      this.scene.add(this.magicLight);

      const rim = new THREE.PointLight(0x22b8b0, 4, 14, 2);
      rim.position.set(4, 2, -1);
      this.scene.add(rim);
    }

    addAccordion() {
      this.gold = new THREE.MeshStandardMaterial({ color: 0xf0ae38, emissive: 0x4b1d00, emissiveIntensity: .48, metalness: .72, roughness: .25 });
      this.ribMaterial = new THREE.MeshStandardMaterial({ color: 0x8d3c17, metalness: .38, roughness: .42 });
      this.darkGold = new THREE.MeshStandardMaterial({ color: 0x8d4c12, metalness: .55, roughness: .38 });
      this.wood = new THREE.MeshStandardMaterial({ color: 0x7f2417, metalness: .08, roughness: .34 });
      this.woodDark = new THREE.MeshStandardMaterial({ color: 0x2a0907, metalness: .12, roughness: .45 });
      this.ivory = new THREE.MeshStandardMaterial({ color: 0xffe8b3, metalness: .04, roughness: .28 });
      this.black = new THREE.MeshStandardMaterial({ color: 0x100a08, metalness: .38, roughness: .24 });
      this.teal = new THREE.MeshStandardMaterial({ color: 0x167d79, metalness: .55, roughness: .28 });

      this.leftEnd = this.createEnd("left");
      this.rightEnd = this.createEnd("right");
      this.root.add(this.leftEnd, this.rightEnd);

      this.bellowsMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: .12,
        roughness: .48,
        flatShading: true,
        side: THREE.DoubleSide
      });
      this.bellowsMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.bellowsMaterial);
      this.bellowsMesh.castShadow = true;
      this.bellowsMesh.receiveShadow = true;
      this.root.add(this.bellowsMesh);

      const ribGeometry = new THREE.BoxGeometry(.075, 2.35, .62, 1, 1, 1);
      this.ribs = new THREE.InstancedMesh(ribGeometry, this.ribMaterial, 24);
      this.ribs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.ribs.castShadow = true;
      this.ribs.frustumCulled = false;
      this.root.add(this.ribs);

      this.spineMaterial = new THREE.MeshBasicMaterial({ color: 0xffce59, transparent: true, opacity: .74, blending: THREE.AdditiveBlending, depthWrite: false });
      this.spine = new THREE.Mesh(new THREE.BufferGeometry(), this.spineMaterial);
      this.root.add(this.spine);

      // Este medalhão marca o ponto que prende o meio do fole à tela.
      // As duas metades da sanfona dobram ao redor dele sem arrastá-lo.
      this.anchorHub = new THREE.Group();
      const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .038, 8, 28), this.gold);
      const anchorDisc = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .055, 20), this.teal);
      anchorDisc.rotation.x = Math.PI / 2;
      const anchorStar = new THREE.Mesh(this.createStarGeometry(.09, .04, .035), this.ivory);
      anchorStar.position.z = .06;
      this.anchorHub.add(anchorRing, anchorDisc, anchorStar);
      this.root.add(this.anchorHub);

      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false });
      this.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 2.8), shadowMaterial);
      this.contactShadow.position.set(0, -2.05, -1.2);
      this.contactShadow.rotation.x = -.08;
      this.root.add(this.contactShadow);
    }

    createRoundedGeometry(width, height, radius, depth) {
      const x = -width / 2;
      const y = -height / 2;
      const shape = new THREE.Shape();
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        steps: 1,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: .075,
        bevelThickness: .075,
        curveSegments: 7
      });
      geometry.center();
      return geometry;
    }

    createEnd(side) {
      const group = new THREE.Group();
      group.name = `${side}-accordion-end`;

      const outer = new THREE.Mesh(this.createRoundedGeometry(1.5, 3.35, .25, .72), [this.gold, this.darkGold]);
      outer.castShadow = true;
      group.add(outer);

      const inner = new THREE.Mesh(this.createRoundedGeometry(1.28, 3.08, .2, .79), [this.wood, this.woodDark]);
      inner.position.z = .1;
      inner.castShadow = true;
      group.add(inner);

      const inset = new THREE.Mesh(this.createRoundedGeometry(1.02, 2.72, .15, .1), this.woodDark);
      inset.position.z = .54;
      group.add(inset);

      const railGeometry = new THREE.BoxGeometry(.055, 2.72, .11);
      for (const x of [-.54, .54]) {
        const rail = new THREE.Mesh(railGeometry, this.gold);
        rail.position.set(x, 0, .61);
        group.add(rail);
      }

      if (side === "left") this.decorateBassSide(group);
      else this.decorateKeyboardSide(group);

      const cornerGeometry = new THREE.SphereGeometry(.085, 12, 8);
      for (const x of [-.53, .53]) {
        for (const y of [-1.3, 1.3]) {
          const stud = new THREE.Mesh(cornerGeometry, this.gold);
          stud.position.set(x, y, .7);
          group.add(stud);
        }
      }

      return group;
    }

    decorateBassSide(group) {
      const buttonGeometry = new THREE.SphereGeometry(.095, 16, 10);
      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 3; column++) {
          const button = new THREE.Mesh(buttonGeometry, (row + column) % 3 === 0 ? this.teal : this.ivory);
          button.scale.z = .55;
          button.position.set(-.28 + column * .28, .78 - row * .5 + (column % 2) * .08, .69);
          group.add(button);
        }
      }

      const medallion = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .075, 24), this.gold);
      medallion.rotation.x = Math.PI / 2;
      medallion.position.set(0, -1.02, .69);
      group.add(medallion);
      const star = new THREE.Mesh(this.createStarGeometry(.18, .08, .07), this.woodDark);
      star.position.set(0, -1.02, .75);
      group.add(star);
    }

    decorateKeyboardSide(group) {
      const whiteGeometry = new THREE.BoxGeometry(.5, .29, .13);
      const blackGeometry = new THREE.BoxGeometry(.3, .12, .18);
      for (let row = 0; row < 8; row++) {
        const key = new THREE.Mesh(whiteGeometry, this.ivory);
        key.position.set(-.2, 1.05 - row * .31, .69);
        group.add(key);
        if (![1, 4, 6].includes(row)) {
          const blackKey = new THREE.Mesh(blackGeometry, this.black);
          blackKey.position.set(-.06, .91 - row * .31, .81);
          group.add(blackKey);
        }
      }

      const buttonGeometry = new THREE.SphereGeometry(.07, 12, 8);
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 2; column++) {
          const button = new THREE.Mesh(buttonGeometry, this.gold);
          button.position.set(.3 + column * .2, .7 - row * .35 + column * .06, .69);
          group.add(button);
        }
      }
    }

    createStarGeometry(outerRadius, innerRadius, depth) {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2 });
      geometry.center();
      return geometry;
    }

    addMagicWaves() {
      this.waveGroup = new THREE.Group();
      this.waveGroup.visible = false;
      this.scene.add(this.waveGroup);
      this.waveMaterials = [];
      for (let index = 0; index < 3; index++) {
        const material = new THREE.MeshBasicMaterial({ color: index === 1 ? 0xffe391 : 0xffa51f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05 + index * .23, .035, 8, 72), material);
        ring.position.z = 1.2 + index * .04;
        this.waveGroup.add(ring);
        this.waveMaterials.push(material);
      }
    }

    resize() {
      const rect = this.zone.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (this.lastWidth === width && this.lastHeight === height) return;
      this.lastWidth = width;
      this.lastHeight = height;
      this.renderer.setSize(width, height, false);
      this.viewHeight = 10;
      this.viewWidth = this.viewHeight * width / height;
      this.camera.left = -this.viewWidth / 2;
      this.camera.right = this.viewWidth / 2;
      this.camera.top = this.viewHeight / 2;
      this.camera.bottom = -this.viewHeight / 2;
      this.camera.updateProjectionMatrix();
      this.update(this.lastLeft, this.lastRight);
    }

    screenToWorld(position) {
      const appRect = this.app.getBoundingClientRect();
      const zoneRect = this.zone.getBoundingClientRect();
      const pixelX = position.x * appRect.width + appRect.left - zoneRect.left;
      const pixelY = position.y * appRect.height + appRect.top - zoneRect.top;
      return new THREE.Vector3(
        (pixelX / Math.max(1, zoneRect.width) - .5) * this.viewWidth,
        (.5 - pixelY / Math.max(1, zoneRect.height)) * this.viewHeight,
        0
      );
    }

    update(left, right) {
      this.lastLeft = { ...left };
      this.lastRight = { ...right };
      const leftWorld = this.screenToWorld(left);
      const rightWorld = this.screenToWorld(right);
      const anchor = this.screenToWorld({ x: .5, y: .72 });
      const leftToAnchor = anchor.clone().sub(leftWorld);
      const rightToAnchor = anchor.clone().sub(rightWorld);
      const leftDistance = Math.max(.01, leftToAnchor.length());
      const rightDistance = Math.max(.01, rightToAnchor.length());
      const start = leftWorld.clone().addScaledVector(leftToAnchor.normalize(), Math.min(.72, leftDistance * .31));
      const end = rightWorld.clone().addScaledVector(rightToAnchor.normalize(), Math.min(.72, rightDistance * .31));
      const points = this.makeCenterline(start, anchor, end);

      const startTangent = points[1].clone().sub(points[0]).normalize();
      const endTangent = points.at(-1).clone().sub(points.at(-2)).normalize();
      const startAngle = clamp(Math.atan2(startTangent.y, startTangent.x), -.48, .48);
      const endAngle = clamp(Math.atan2(endTangent.y, endTangent.x), -.48, .48);

      this.leftEnd.position.copy(leftWorld);
      this.rightEnd.position.copy(rightWorld);
      this.leftEnd.rotation.set(-.055 + (left.y - .72) * .3, -.09, startAngle);
      this.rightEnd.rotation.set(-.055 + (right.y - .72) * .3, .09, endAngle);

      this.updateBellows(points, left, right);
      this.anchorHub.position.copy(anchor);
      this.anchorHub.position.z = 1.02;
      this.contactShadow.position.x = anchor.x;
      this.contactShadow.scale.x = clamp((leftDistance + rightDistance) / 6.5, .45, 1.2);
    }

    makeCenterline(start, anchor, end) {
      const points = [];
      const segmentsPerSide = 12;
      const leftControl = new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, anchor.x, .64),
        anchor.y,
        anchor.z
      );
      const rightControl = new THREE.Vector3(
        THREE.MathUtils.lerp(anchor.x, end.x, .36),
        anchor.y,
        anchor.z
      );
      const quadraticPoint = (from, control, to, t) => {
        const inverse = 1 - t;
        return new THREE.Vector3(
          inverse * inverse * from.x + 2 * inverse * t * control.x + t * t * to.x,
          inverse * inverse * from.y + 2 * inverse * t * control.y + t * t * to.y,
          inverse * inverse * from.z + 2 * inverse * t * control.z + t * t * to.z
        );
      };

      for (let index = 0; index <= segmentsPerSide; index++) {
        const t = index / segmentsPerSide;
        const point = quadraticPoint(start, leftControl, anchor, t);
        point.z += Math.sin(Math.PI * t) * .12;
        points.push(point);
      }
      for (let index = 1; index <= segmentsPerSide; index++) {
        const t = index / segmentsPerSide;
        const point = quadraticPoint(anchor, rightControl, end, t);
        point.z += Math.sin(Math.PI * t) * .12;
        points.push(point);
      }
      return points;
    }

    updateBellows(points, left, right) {
      const positions = [];
      const colors = [];
      const top = [];
      const bottom = [];
      const count = points.length;
      const bendStrength = clamp((Math.abs(left.y - right.y) - .035) / .14, 0, 1);
      const halfHeight = 1.06 - bendStrength * .44;

      for (let index = 0; index < count; index++) {
        const previous = points[Math.max(0, index - 1)];
        const next = points[Math.min(count - 1, index + 1)];
        const tangent = next.clone().sub(previous).normalize();
        // As extremidades do fole permanecem verticais. A linha central pode
        // fazer um S, mas a seção não gira a ponto de torcer ou se cruzar.
        const topPoint = points[index].clone();
        const bottomPoint = points[index].clone();
        topPoint.y += halfHeight;
        bottomPoint.y -= halfHeight;
        const pleat = index % 2 === 0 ? .13 : -.1;
        topPoint.z += pleat;
        bottomPoint.z += pleat;
        top.push(topPoint);
        bottom.push(bottomPoint);
      }

      const addVertex = (point, color, zOffset = 0) => {
        positions.push(point.x, point.y, point.z + zOffset);
        colors.push(color.r, color.g, color.b);
      };
      const addQuad = (a, b, c, d, color, zOffset = 0) => {
        addVertex(a, color, zOffset); addVertex(b, color, zOffset); addVertex(c, color, zOffset);
        addVertex(a, color, zOffset); addVertex(c, color, zOffset); addVertex(d, color, zOffset);
      };

      for (let index = 0; index < count - 1; index++) {
        const foldColor = new THREE.Color(index % 2 === 0 ? 0xa43822 : 0x4b1410);
        const edgeColor = new THREE.Color(index % 2 === 0 ? 0xe28b2c : 0x7a3315);
        addQuad(top[index], bottom[index], bottom[index + 1], top[index + 1], foldColor, .34);
        addQuad(bottom[index], top[index], top[index + 1], bottom[index + 1], new THREE.Color(0x170504), -.34);
        addQuad(top[index], top[index + 1], top[index + 1].clone().setZ(top[index + 1].z - .66), top[index].clone().setZ(top[index].z - .66), edgeColor);
        addQuad(bottom[index + 1], bottom[index], bottom[index].clone().setZ(bottom[index].z - .66), bottom[index + 1].clone().setZ(bottom[index + 1].z - .66), edgeColor);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      this.bellowsMesh.geometry.dispose();
      this.bellowsMesh.geometry = geometry;

      const spinePoints = points.map((point) => point.clone().setZ(point.z + .96));
      const spineGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spinePoints), 48, .052, 7, false);
      this.spine.geometry.dispose();
      this.spine.geometry = spineGeometry;

      const dummy = new THREE.Object3D();
      for (let index = 0; index < this.ribs.count; index++) {
        const pointIndex = Math.round(index / (this.ribs.count - 1) * (count - 1));
        const previous = points[Math.max(0, pointIndex - 1)];
        const next = points[Math.min(count - 1, pointIndex + 1)];
        const tangent = next.clone().sub(previous).normalize();
        const angle = clamp(Math.atan2(tangent.y, tangent.x) * .12, -.08, .08);
        dummy.position.copy(points[pointIndex]);
        dummy.position.z += .58;
        dummy.rotation.set(0, 0, angle);
        dummy.scale.set(1, halfHeight * 2 / 2.35, 1);
        dummy.updateMatrix();
        this.ribs.setMatrixAt(index, dummy.matrix);
      }
      this.ribs.instanceMatrix.needsUpdate = true;
    }

    pulse() {
      this.pulseStartedAt = performance.now();
      const middle = this.screenToWorld({ x: .5, y: .72 });
      this.waveGroup.position.set(middle.x, middle.y, .5);
      this.waveGroup.visible = true;
    }

    animate(now) {
      const pulseAge = now - this.pulseStartedAt;
      if (pulseAge < 720) {
        const progress = pulseAge / 720;
        this.waveGroup.visible = true;
        this.waveGroup.scale.setScalar(.4 + progress * 2.8);
        this.waveMaterials.forEach((material, index) => {
          material.opacity = Math.sin(progress * Math.PI) * (.72 - index * .12);
        });
        this.magicLight.intensity = 9 + Math.sin(progress * Math.PI) * 14;
        const bounce = 1 + Math.sin(progress * Math.PI) * .035;
        this.root.scale.setScalar(bounce);
      } else {
        this.waveGroup.visible = false;
        this.magicLight.intensity = 9;
        this.root.scale.setScalar(1);
      }

      this.root.rotation.x = -.045 + Math.sin(now * .0014) * .008;
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.animate);
    }
  }

  window.Accordion3D = Accordion3D;
})();
