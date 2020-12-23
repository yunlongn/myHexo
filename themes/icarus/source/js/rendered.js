const flocks = [];

function createFlock() {
    flocks.push(new Flock(randomPointFromScreen()))
}

function setup() {
    createCanvas(windowWidth, windowHeight)

    createFlock();

    setTimeout(createFlock, 400);
    setTimeout(createFlock, 700);
    setTimeout(createFlock, 2000);
}

function draw() {
    background("black");
    fill("white");

    for (const flock of flocks) {
        flock.update();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

const randomPointFromScreen = () => ({
    x: windowWidth * Math.random(),
    y: windowHeight * Math.random()
});


class Dot {
    constructor(parent, {x, y}) {
        this.parent = parent;

        [this.px, this.py] = [0, 0];

        this.vx = 2 * Math.random() * 2;
        this.vy = this.vx;

        this.angle = Math.random() * (Math.PI * 2);
        this.life = 0.5 + Math.random();

        this.color =
            Math.random() > 0.9 ? Math.random() > 0.6 ? "#D77DA9" : "#74b9ff" : "white";
    }

    tick() {
        this.update();
        this.draw();

        return this;
    }

    update() {
        this.px += this.vx * Math.cos(this.angle);
        this.py += this.vy * Math.sin(this.angle);

        this.x = this.parent.x + this.px;
        this.y = this.parent.y + this.py;

        this.vx *= 0.98;
        this.vy *= 0.98;

        this.vy += this.angle > Math.PI ? -0.025 : 0.02;

        // this.angle += 0.05

        if (this.life < 0) {
            this.dead = true;
        }

        this.life -= 0.009;
    }

    draw() {
        if (this.dead === true || Math.random() > 0.95) return;

        fill(this.color);

        circle(this.x, this.y, 1 + 4 * this.life - this.vy * 0.1);
    }
}


class Flock {
    constructor({x, y}) {
        this.revive({x, y});

        console.log(this);
    }

    revive({x, y}) {
        [this.x, this.y] = [x, y];

        this.dots = Array(150).fill(0).map(() => new Dot(this, {x, y}));
    }

    update() {
        const allDead = this.dots.map(dot => dot.tick().dead).every(dead => dead);

        if (allDead) {
            this.revive(randomPointFromScreen());
        }
    }
}

//# sourceURL=pen.js
