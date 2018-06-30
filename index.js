const EventEmitter = require('events').EventEmitter;
const inherits = require('inherits');


module.exports = Boids;

function Boids(opts, callback) {
  if (!(this instanceof Boids)) {
    return new Boids(opts, callback);
  }

  EventEmitter.call(this);

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
inherits(Boids, EventEmitter);

Boids.prototype.tick = function () {
  const boids = this.boids;
  const sepDist = this.separationDistance;
  const sepForce = this.separationForce;
  const cohDist = this.cohesionDistance;
  const cohForce = this.cohesionForce;
  const aliDist = this.alignmentDistance;
  const aliForce = this.alignmentForce;
  const speedLimit = this.speedLimit;
  const accelerationLimit = this.accelerationLimit;
  const accelerationLimitRoot = this.accelerationLimitRoot;
  const speedLimitRoot = this.speedLimitRoot;
  const size = boids.length;
  let current = size;
  let sforceX, sforceY;
  let cforceX, cforceY;
  let aforceX, aforceY;
  let spareX, spareY;
  const attractors = this.attractors;
  const attractorCount = attractors.length;
  let attractor;
  let distSquared;
  let currPos;
  let length;
  let target;
  let ratio;

  while (current--) {
    sforceX = 0; sforceY = 0;
    cforceX = 0; cforceY = 0;
    aforceX = 0; aforceY = 0;
    currPos = boids[current];

    // Attractors
    target = attractorCount;
    while (target--) {
      attractor = attractors[target];
      spareX = currPos.posX - attractor.posX;
      spareY = currPos.posY - attractor.posY;
      distSquared = (spareX * spareX) + (spareY * spareY);

      if (distSquared < attractor.dist * attractor.dist) {
        length = hypot(spareX, spareY);
        boids[current].spdX -= (attractor.spd * spareX / length) || 0;
        boids[current].spdY -= (attractor.spd * spareY / length) || 0;
      }
    }

    target = size;
    while (target--) {
      if (target === current) {
        continue;
      }
      spareX = currPos.posX - boids[target].posX;
      spareY = currPos.posY - boids[target].posY;
      distSquared = (spareX * spareX) + (spareY * spareY);

      if (distSquared < sepDist) {
        sforceX += spareX;
        sforceY += spareY;
      }
      else {
        if (distSquared < cohDist) {
          cforceX += spareX;
          cforceY += spareY;
        }
        if (distSquared < aliDist) {
          aforceX += boids[target].spdX;
          aforceY += boids[target].spdY;
        }
      }
    }

    // Separation
    length = hypot(sforceX, sforceY);
    boids[current].accX += (sepForce * sforceX / length) || 0;
    boids[current].accY += (sepForce * sforceY / length) || 0;
    // Cohesion
    length = hypot(cforceX, cforceY);
    boids[current].accX -= (cohForce * cforceX / length) || 0;
    boids[current].accY -= (cohForce * cforceY / length) || 0;
    // Alignment
    length = hypot(aforceX, aforceY);
    boids[current].accX -= (aliForce * aforceX / length) || 0;
    boids[current].accY -= (aliForce * aforceY / length) || 0;
  }
  current = size;

  // Apply speed/acceleration for
  // this tick
  while (current--) {
    if (accelerationLimit) {
      distSquared = (boids[current].accX * boids[current].accX) +
        (boids[current].accY * boids[current].accY);
      if (distSquared > accelerationLimit) {
        ratio = accelerationLimitRoot / hypot(boids[current].accX, boids[current].accY);
        boids[current].accX *= ratio;
        boids[current].accY *= ratio;
      }
    }

    boids[current].spdX += boids[current].accX;
    boids[current].spdY += boids[current].accY;

    if (speedLimit) {
      distSquared = (boids[current].spdX * boids[current].spdX) +
        (boids[current].spdY * boids[current].spdY);
      if (distSquared > speedLimit) {
        ratio = speedLimitRoot / hypot(boids[current].spdX, boids[current].spdY);
        boids[current].spdX *= ratio;
        boids[current].spdY *= ratio;
      }
    }

    boids[current].posX += boids[current].spdX;
    boids[current].posY += boids[current].spdY;
  }

  this.emit('tick', boids);
}

// double-dog-leg hypothenuse approximation
// http://forums.parallax.com/discussion/147522/dog-leg-hypotenuse-approximation
function hypot(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  var lo = Math.min(a, b);
  var hi = Math.max(a, b);
  return hi + ((3 * lo) / 32) + (Math.max(0, (2 * lo) - hi) / 8) + (Math.max(0, (4 * lo) - hi) / 16);
}
