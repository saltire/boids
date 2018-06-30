const EventEmitter = require('events').EventEmitter;


class Boids extends EventEmitter {
  constructor(opts, callback) {
    super();

    opts = opts || {};
    callback = callback || (() => {});

    this.speedLimitRoot = opts.speedLimit || 0;
    this.accelerationLimitRoot = opts.accelerationLimit || 1;
    this.speedLimit = Math.pow(this.speedLimitRoot, 2);
    this.accelerationLimit = Math.pow(this.accelerationLimitRoot, 2);
    this.separationDistance = Math.pow(opts.separationDistance || 60, 2);
    this.alignmentDistance = Math.pow(opts.alignmentDistance || 180, 2);
    this.cohesionDistance = Math.pow(opts.cohesionDistance || 180, 2);
    this.separationForce = opts.separationForce || 0.15;
    this.cohesionForce = opts.cohesionForce || 0.1;
    this.alignmentForce = opts.alignmentForce || opts.alignment || 0.25;
    this.attractors = opts.attractors || [];

    const boids = this.boids = [];
    let l = opts.boids === undefined ? 50 : opts.boids;
    for (let i = 0; i < l; i += 1) {
      boids.push({
        posX: Math.random() * 25,
        posY: Math.random() * 25,
        spdX: 0,
        spdY: 0,
        accX: 0,
        accY: 0,
      });
    }

    this.on('tick', () => callback(boids));
  }

  tick() {
    let current = this.boids.length;
    while (current--) {
      const boid = this.boids[current];

      // Attractors
      let atarget = this.attractors.length;
      while (atarget--) {
        const attractor = this.attractors[atarget];
        const spareX = boid.posX - attractor.posX;
        const spareY = boid.posY - attractor.posY;
        const distSquared = (spareX * spareX) + (spareY * spareY);

        if (distSquared < attractor.dist * attractor.dist) {
          const length = hypot(spareX, spareY);
          boid.spdX -= (attractor.spd * spareX / length) || 0;
          boid.spdY -= (attractor.spd * spareY / length) || 0;
        }
      }

      let sforceX = 0;
      let sforceY = 0;
      let cforceX = 0;
      let cforceY = 0;
      let aforceX = 0;
      let aforceY = 0;

      // Other boids
      let otarget = this.boids.length;
      while (otarget--) {
        if (otarget === current) {
          continue;
        }
        const other = this.boids[otarget];
        const spareX = boid.posX - other.posX;
        const spareY = boid.posY - other.posY;
        const distSquared = (spareX * spareX) + (spareY * spareY);

        if (distSquared < this.separationDistance) {
          sforceX += spareX;
          sforceY += spareY;
        }
        else {
          if (distSquared < this.cohesionDistance) {
            cforceX += spareX;
            cforceY += spareY;
          }
          if (distSquared < this.alignmentDistance) {
            aforceX += other.spdX;
            aforceY += other.spdY;
          }
        }
      }

      // Separation
      const sLength = hypot(sforceX, sforceY);
      boid.accX += (this.separationForce * sforceX / sLength) || 0;
      boid.accY += (this.separationForce * sforceY / sLength) || 0;
      // Cohesion
      const cLength = hypot(cforceX, cforceY);
      boid.accX -= (this.cohesionForce * cforceX / cLength) || 0;
      boid.accY -= (this.cohesionForce * cforceY / cLength) || 0;
      // Alignment
      const aLength = hypot(aforceX, aforceY);
      boid.accX -= (this.alignmentForce * aforceX / aLength) || 0;
      boid.accY -= (this.alignmentForce * aforceY / aLength) || 0;
    }

    // Apply speed/acceleration for this tick
    current = this.boids.length;
    while (current--) {
      const boid = this.boids[current];

      if (this.accelerationLimit) {
        const distSquared = (boid.accX * boid.accX) + (boid.accY * boid.accY);
        if (distSquared > this.accelerationLimit) {
          const ratio = this.accelerationLimitRoot / hypot(boid.accX, boid.accY);
          boid.accX *= ratio;
          boid.accY *= ratio;
        }
      }

      boid.spdX += boid.accX;
      boid.spdY += boid.accY;

      if (this.speedLimit) {
        const distSquared = (boid.spdX * boid.spdX) + (boid.spdY * boid.spdY);
        if (distSquared > this.speedLimit) {
          const ratio = this.speedLimitRoot / hypot(boid.spdX, boid.spdY);
          boid.spdX *= ratio;
          boid.spdY *= ratio;
        }
      }

      boid.posX += boid.spdX;
      boid.posY += boid.spdY;
    }

    this.emit('tick', this.boids);
  }
}

module.exports = Boids;

// double-dog-leg hypothenuse approximation
// http://forums.parallax.com/discussion/147522/dog-leg-hypotenuse-approximation
function hypot(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return hi + ((3 * lo) / 32) + (Math.max(0, (2 * lo) - hi) / 8) + (Math.max(0, (4 * lo) - hi) / 16);
}
