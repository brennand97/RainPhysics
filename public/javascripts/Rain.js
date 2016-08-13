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

var mouse = new Point(0, 0);

window.onmousemove = function onmousemove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};

//*******************************************************************
//Main Code here
//*******************************************************************

var settings = {
                                            //Color of the rain
    rainColorRed: 0,                        //red component
    rainColorGreen: 191,                    //green component
    rainColorBlue: 255,                     //blue component
    rainColorAlpha: 255,                    //alpha component

    numberRainDrops: 700,                   //max number of rain drops falling at once
    initialRainSpeed: 1.25,                 //initial rain speed factor

    widthRainDrops: 4,                      //width of the rain drops in pixels
    heightRainDrops: 20,                    //height of the rain drops in pixels

                                            //Parallax ratio
    parallax: 80,                           //parallax that defines deepest rain
    maxParallax: 100,                       //maximum total parallax, used to create scale ratio

    bottomPadding: 10,                      //number of pixels from the bottom that the rain stops

    mouseAverageLength: 5,                  //number of mouse movement segments used to take average velocity of mouse
    mouseForceScale: 0.002,                 //scale factor for the mouse force (wind) added to rain
    mouseAffectDistance: 40000,             //maximum square distance away from the mouse that raindrops will be affected by wind force

    gravity: 0.0005,                        //force of gravity on rain in pixels per millisecond^2
    verticalAirResistance: 0.009,       //scale factor coefficient for vertical air resistance
    horizontalAirResistance: 0.001           //scale factor coefficient for horizontal air resistance
};

var rain = [];                                                                  //Array to hold all the rain drop objects
var GRAVITY = new Force(new Vector(new Point(0, settings.gravity, 0)));         //Constant value for the force of gravity
var AIR_RESISTANCE = new Force();
AIR_RESISTANCE.getVector = function (particle) {
    return new Vector(new Point(Math.pow(particle.velocity.point.x, 2) *                //calculate and add force of air resistance
        settings.horizontalAirResistance * -getSign(particle.velocity.point.x),
        Math.pow(particle.velocity.point.y, 2) * settings.verticalAirResistance *
        -getSign(particle.velocity.point.y)));
};

//*******************************************************************
//Define the rain drop object and its methods
//*******************************************************************

var Rain = function (point) {
    this.particle = new Particle();
    this.point = this.particle.point = point || new Point(Math.floor(Math.random() * width), Math.floor(Math.random() * -height), Math.floor(Math.random() * settings.parallax));
    this.forces =  this.particle.forces = [];
    this.width = settings.widthRainDrops;
    this.height = settings.heightRainDrops;
    this.scale = this.particle.scale = (settings.maxParallax - this.point.z) / settings.maxParallax;
    this.velocity = this.particle.velocity = new Vector(new Point(0, this.scale * settings.initialRainSpeed));
    this.forces.push(GRAVITY.copy());
    this.forces.push(AIR_RESISTANCE.copy());
};

Rain.prototype.updateRain = function (elapsed) {
    this.scale = (settings.maxParallax - this.point.z) / settings.maxParallax;
    this.width = settings.widthRainDrops * this.scale;
    this.height = settings.heightRainDrops * this.scale;

    this.particle.update(elapsed);
};

Rain.prototype.renderRain = function (context) {
    context.fillStyle = "rgba(" + settings.rainColorRed + ","
        + settings.rainColorGreen + ","
        + settings.rainColorBlue + ","
        + settings.rainColorAlpha + ")";
    context.fillRect(this.point.x - (this.width / 2), this.point.y - this.height, this.width, this.height);
};

//===================================================================

//*******************************************************************
//Define the main render function
//*******************************************************************

function render(context) {
    context.save();
    context.clearRect(0, 0, width, height);

    for(var i = rain.length - 1; i >= 0; i--) {
        rain[i].renderRain(context);
    }

    context.restore();
}

//===================================================================

var mouseVelocity = [];     //Array that holds vectors that represent mouse velocity segments
var currentPoint;           //Holds location of the mouse for current cycle
var previousPoint;          //Holds location of the mouse for previous cycle
var index = 0;              //Holds current index in the mouseVelocity array

//*******************************************************************
//Define the main update function
//*******************************************************************

function update() {

    //***************************************************************
    //Calculate mouse velocity
    //***************************************************************

    currentPoint = new Point(mouse.x, mouse.y);
    if(previousPoint) {
        mouseVelocity[index] = new Vector(currentPoint, previousPoint);
        mouseVelocity[index].scale(1 / elapsed);
    } else {
        index--;
    }
    previousPoint = currentPoint;
    index++;
    if(index > settings.mouseAverageLength - 1) {
        index = 0;
    }

    if(mouseVelocity.length >= settings.mouseAverageLength) {
        var mouseSum = new Force(Vector.average(mouseVelocity));
        mouseSum.count = 0;
        mouseSum.relevant = function () {
            if(this.count > 0) {
                return false;
            } else {
                this.count++;
                return true;
            }
        };
        mouseSum.vector.scale(settings.mouseForceScale);
        mouseSum.vector.point.y = 0;
    }

    //===============================================================

    //***************************************************************
    //Handle updating rain drops
    //***************************************************************

    for(var i = rain.length - 1; i >= 0; i--) {

        //Add forces to each rain drop

        rain[i].forces.push(GRAVITY.copy());                                                            //add force of gravity
        var tmpPoint = rain[i].point.copy();
        tmpPoint.z = 0;
        if(mouseSum && sqrDistance(mouse, tmpPoint) < settings.mouseAffectDistance) {                   //check to see if rain drop is affected by mouse wind
            rain[i].forces.push(mouseSum);                                                   //add wind force
        }
        tmpPoint = {};

        //Call rain drop's update function

        rain[i].updateRain(elapsed);

        //Check to see if rain drop needs to be removed

        if(rain[i].point.y > height - settings.bottomPadding) {
            tmpPoint = new Point(rain[i].point.x, rain[i].point.y + 1, rain[i].point.z);
            rain[i].particle.collision(new Particle(tmpPoint, 600000000));
            tmpPoint = {};
            if(rain[i].point.y > height + 50) {
                rain.splice(i, 1);
                if(rain.length <= settings.numberRainDrops) {
                    rain.push(new Rain());
                }
            }
        }
    }

    //===============================================================

}

//===================================================================

//*******************************************************************
//Define and call the setup function
//*******************************************************************

(function setup() {
    Vector.degrees = false;
    for(var i = 0; i < settings.numberRainDrops; i++) {
        rain.push(new Rain());
        console.log("ADDED RAIN");
    }
})();

//===================================================================

var current = (new Date()).getTime();       //current time for current cycle
var previous = current;                     //previous time for previous cycle
var elapsed = 0;                            //elapsed time between cycles

//*******************************************************************
//Define and call the main loop function
//*******************************************************************

(function loop() {
    current = (new Date()).getTime();
    elapsed = current - previous;
    previous = current;

    requestAnimFrame(loop);
    update();
    render(context);
})();

//===============================================================