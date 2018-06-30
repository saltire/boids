const fps = require('fps');
const ticker = require('ticker');
const debounce = require('debounce');
const Boids = require('./');

const attractors = [[
  Infinity, // x
  Infinity, // y
  150, // dist
  0.25, // spd
]];

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const boids = Boids({
  boids: 150,
  speedLimit: 2,
  accelerationLimit: 0.5,
  attractors: attractors,
});

document.body.onmousemove = (e) => {
  const halfHeight = canvas.height / 2;
  const halfWidth = canvas.width / 2;

  attractors[0][0] = e.x - halfWidth;
  attractors[0][1] = e.y - halfHeight;
}

window.onresize = debounce(() => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}, 100);
window.onresize();

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.appendChild(canvas);

ticker(window, 60)
  .on('tick', () => {
    frames.tick()
    boids.tick()
  })
  .on('draw', () => {
    const boidData = boids.boids;
    const halfHeight = canvas.height / 2;
    const halfWidth = canvas.width / 2;

    ctx.fillStyle = 'rgba(255,241,235,0.25)'; // '#FFF1EB'
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#543D5E'
    for (let i = 0; i < boidData.length; i += 1) {
      const x = boidData[i][0];
      const y = boidData[i][1];
      // wrap around the screen
      boidData[i][0] = x > halfWidth ? -halfWidth : (-x > halfWidth ? halfWidth : x);
      boidData[i][1] = y > halfHeight ? -halfHeight : (-y > halfHeight ? halfHeight : y);
      ctx.fillRect(x + halfWidth, y + halfHeight, 2, 2);
    }
  });

const frameText = document.querySelector('[data-fps]');
const countText = document.querySelector('[data-count]');
const frames = fps({ every: 10, decay: 0.04 })
  .on('data', (rate) => {
    for (let i = 0; i < 3; i += 1) {
      if (rate <= 56 && boids.boids.length > 10) {
        boids.boids.pop();
      }
      if (rate >= 60 && boids.boids.length < 500) {
        boids.boids.push([0, 0, (Math.random() * 6) - 3, (Math.random() * 6) - 3, 0, 0]);
      }
    }
    frameText.innerHTML = String(Math.round(rate));
    countText.innerHTML = String(boids.boids.length);
  });
