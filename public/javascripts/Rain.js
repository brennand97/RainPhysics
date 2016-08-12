/**
 * Created by Brennan on 8/11/2016.
 */
requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000/60);
        };
})();

var canvas = document.getElementById("the-rain-canvas");
var context = canvas.getContext("2d");

var width = 0;
var height = 0;

window.onresize = function onresize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
};

window.onresize();

var mouse = new Point(0, 0)

window.onmousemove = function onmousemove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};

var getSign = function(number) {
    if(number >= 0) {
        return 1;
    } else {
        return -1;
    }
};

//*******************
//Main Code goes here
//*******************

var rain = [];

var settings = {
    rainColorRed: 0,
    rainColorGreen: 191,
    rainColorBlue: 255,
    rainColorAlpha: 255,

    numberRainDrops: 1000,
    initialRainSpeed: 1.25,

    widthRainDrops: 4,
    heightRainDrops: 20,

    parallax: 80,
    maxParallax: 100,

    bottomPadding: 10,

    mouseForceScale: 0.00003,
    mouseAffectDistance: 40000,

    gravity: 0.0001,
    verticalAirResistance: 0.0001,
    horizontalAirResistance: 0.01
};

var GRAVITY = new Vector(new Point(0, settings.gravity, 0));   //Units are meters per millisecond^2

var Rain = function (point) {
    this.point = point || new Point(Math.floor((Math.random() * width * 2) - (width / 2)), Math.floor(Math.random() * -height), Math.floor(Math.random() * settings.parallax));
    this.forces = [];
    this.width = settings.widthRainDrops;
    this.height = settings.heightRainDrops;
    this.scl = (settings.maxParallax - this.point.z) / settings.maxParallax;
    this.velocity = new Vector(new Point(0, this.scl * settings.initialRainSpeed));
};

Rain.prototype.updateRain = function (elapsed) {
    this.scl = (settings.maxParallax - this.point.z) / settings.maxParallax;
    this.width = settings.widthRainDrops * this.scl;
    this.height = settings.heightRainDrops * this.scl;

    while (this.forces.length > 0) {
        this.velocity.add(this.forces.pop().copy().scl(elapsed * this.scl));
    }

    this.point.x += this.velocity.point.x * elapsed;
    this.point.y += this.velocity.point.y * elapsed;
    this.point.z += this.velocity.point.z * elapsed;
    if(this.point.z < 0) { this.point.z = 0 }
};

Rain.prototype.renderRain = function (context) {
    context.fillStyle = "rgba(" + settings.rainColorRed + ","
        + settings.rainColorGreen + ","
        + settings.rainColorBlue + ","
        + settings.rainColorAlpha + ")";
    context.fillRect(this.point.x - (this.width / 2), this.point.y - this.height, this.width, this.height);
};

function render(context) {
    context.save();
    context.clearRect(0, 0, width, height);

    for(var i = rain.length - 1; i >= 0; i--) {
        rain[i].renderRain(context);
    }

    context.restore();
}

var mouseVel = [];
var currentPoint;
var previousPoint;
var count = 0;

function rainUpdate() {
    currentPoint = new Point(mouse.x, mouse.y);
    if(previousPoint) {
        mouseVel[count] = new Vector(currentPoint, previousPoint);
    }
    previousPoint = currentPoint;
    if(count > 9) {
        count = 0;
    } else {
        count++;
    }

    if(mouseVel.length > 0) {
        var mouseSum = Vector.avg(mouseVel);
        mouseSum.scl(settings.mouseForceScale);
        mouseSum.point.y = 0;
    }

    for(var i = rain.length - 1; i >= 0; i--) {
        rain[i].forces.push(GRAVITY);
        if(mouseSum && sqrDistance(mouse, rain[i].point) < settings.mouseAffectDistance) {
            rain[i].forces.push(mouseSum);
        }
        rain[i].forces.push(new Vector(new Point(Math.pow(rain[i].velocity.point.x, 2) * settings.horizontalAirResistance * -getSign(rain[i].velocity.point.x),
            Math.pow(rain[i].velocity.point.y, 2) * settings.verticalAirResistance * -getSign(rain[i].velocity.point.y))));
        rain[i].updateRain(elapsed);

        if(rain[i].point.y > height - settings.bottomPadding) {
            rain.splice(i, 1);
            rain.push(new Rain());
        }
    }

}


//*******************

(function setup() {
    for(var i = 0; i < settings.numberRainDrops; i++) {
        rain.push(new Rain());
        console.log("ADDED RAIN");
    }
})();

var current = (new Date()).getTime();
var previous = current;
var elapsed = 0;

(function loop() {
    current = (new Date()).getTime();
    elapsed = current - previous;
    previous = current;

    requestAnimFrame(loop);
    rainUpdate();
    render(context);
})();