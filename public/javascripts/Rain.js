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
    mouseForceScale: 0.002,               //scale factor for the mouse force (wind) added to rain
    mouseAffectDistance: 40000,             //maximum square distance away from the mouse that raindrops will be affected by wind force

    gravity: 0.0001,                        //force of gravity on rain in pixels per millisecond^2
    verticalAirResistance: 0.0001,          //scale factor coefficient for vertical air resistance
    horizontalAirResistance: 0.01           //scale factor coefficient for horizontal air resistance
};

var rain = [];                                                      //Array to hold all the rain drop objects
var GRAVITY = new Vector(new Point(0, settings.gravity, 0));        //Constant value for the force of gravity

//*******************************************************************
//Define the rain drop object and its methods
//*******************************************************************

var Rain = function (point) {
    this.point = point || new Point(Math.floor(Math.random() * width), Math.floor(Math.random() * -height), Math.floor(Math.random() * settings.parallax));
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
        this.velocity.add(this.forces.pop().copy().scale(elapsed * this.scl));
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
        var mouseSum = Vector.average(mouseVelocity);
        mouseSum.scale(settings.mouseForceScale);
        mouseSum.point.y = 0;
    }

    //===============================================================

    //***************************************************************
    //Handle updating rain drops
    //***************************************************************

    for(var i = rain.length - 1; i >= 0; i--) {

        //Add forces to each rain drop

        rain[i].forces.push(GRAVITY);                                                           //add force of gravity
        if(mouseSum && sqrDistance(mouse, rain[i].point) < settings.mouseAffectDistance) {      //check to see if rain drop is affected by mouse wind
            rain[i].forces.push(mouseSum);                                                      //add wind force
        }
        rain[i].forces.push(new Vector(new Point(Math.pow(rain[i].velocity.point.x, 2) *        //calculate and add force of air resistance
            settings.horizontalAirResistance * -getSign(rain[i].velocity.point.x),
            Math.pow(rain[i].velocity.point.y, 2) * settings.verticalAirResistance *
            -getSign(rain[i].velocity.point.y))));

        //Call rain drop's update function

        rain[i].updateRain(elapsed);

        //Check to see if rain drop needs to be removed

        if(rain[i].point.y > height - settings.bottomPadding) {
            rain.splice(i, 1);
            if(rain.length <= settings.numberRainDrops) {
                rain.push(new Rain());
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