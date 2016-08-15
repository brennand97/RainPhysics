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

//*******************************************************************
//Main Code here
//*******************************************************************

var settings = {
                                            //Color of the rain
    rainColorRed: 0,                        //red component
    rainColorGreen: 191,                    //green component
    rainColorBlue: 255,                     //blue component
    rainColorAlpha: 255,                    //alpha component

    numberRainDrops: 750,                   //max number of rain drops falling at once
    initialRainSpeed: 1.25,                 //initial rain speed factor

    widthRainDrops: 4,                      //width of the rain drops in pixels
    heightRainDrops: 20,                    //height of the rain drops in pixels

                                            //Parallax ratio
    parallax: 70,                           //parallax that defines deepest rain
    maxParallax: 100,                       //maximum total parallax, used to create scale ratio

    bottomPadding: 10,                      //number of pixels from the bottom that the rain stops

    mouseAverageLength: 5,                  //number of mouse movement segments used to take average velocity of mouse
    mouseForceScale: 0.001,                 //scale factor for the mouse force (wind) added to rain
    mouseAffectDistance: 40000,             //maximum square distance away from the mouse that raindrops will be affected by wind force

    rainDropDragCoefficient: 0.009          //Rain drop drag coefficient for air resistance on rain drop
};

var rain = [];                                                                  //Array to hold all the rain drop objects

var circleForceId = "circle_force";
var circleMaxSpeed = 0.05;
var circleAclScale = 1;
var circleForce = new Force(circleForceId);
circleForce.getVector = function (particle, deltaTime) {
    if(distance(particle.point.cast2D(), new Point(width / 2, height / 2)) < Math.min(width / 4, height / 4)) {
        var net = new Vector();
        var len = particle.forces.length;
        for(var i = 0; i < len; i++) {
            if(particle.forces[i].id != this.id) {
                net.add(particle.forces[i].getVector(particle, deltaTime));
            }
        }
        var out = net.copy().getYComponet().add(new Vector(new Point(0, circleAclScale * (particle.mass / deltaTime) *
            (particle.velocity.point.y - (circleMaxSpeed * particle.scale)), 0))).scale(-1);
        return out;
    } else {
        return new Vector();
    }
};

//*******************************************************************
//Define the rain drop object and its methods
//*******************************************************************

var Rain = function (point) {
    var p = point || new Point(Math.floor(Math.random() * width), Math.floor(Math.random() * -height * 2), Math.floor(Math.random() * settings.parallax));
    var s = (settings.maxParallax - p.z) / settings.maxParallax;;
    var w = settings.widthRainDrops;
    var h = settings.heightRainDrops;
    this.convex = new Convex(new Point(), [new Vector(0, 0),
        new Vector(new Point(w, 0)),
        new Vector(new Point(w, -h)),
        new Vector(new Point(0, -h))], Rain.defaultColor, s);
    RenderObject.call(this, p, [this.convex]);

    this.color = this.shapes[0].color = Rain.defaultColor;

    this.dragCoefficent = settings.rainDropDragCoefficient;
    this.velocity = new Vector(new Point(0, this.scale * settings.initialRainSpeed));
    this.scale = s;

    this.forces.push(Force.GRAVITY.copy());
    this.forces.push(Force.AIR_RESISTANCE.copy());
    this.forces.push(circleForce.copy());
};

Rain.prototype = new RenderObject();

Rain.defaultColor = "rgba(" + settings.rainColorRed + ","
    + settings.rainColorGreen + ","
    + settings.rainColorBlue + ","
    + settings.rainColorAlpha + ")";

Rain.prototype.updateRain = function (elapsed) {
    this.scale = (settings.maxParallax - this.point.z) / settings.maxParallax;

    this.updateParticle(elapsed);
};

//===================================================================

//*******************************************************************
//Define the main render function
//*******************************************************************

function render(context) {
    context.save();
    context.clearRect(0, 0, width, height);
    var avg = 0;
    for(var i = rain.length - 1; i >= 0; i--) {
        rain[i].renderObject(context);
    }

    context.restore();
}

//===================================================================

var mouseVelocity = [];     //Array that holds vectors that represent mouse velocity segments
var currentPoint;           //Holds location of the mouse for current cycle
var previousPoint;          //Holds location of the mouse for previous cycle
var index = 0;              //Holds current index in the mouseVelocity array
var mouseWindForceId =  "mouse_wind";

//*******************************************************************
//Define the main update function
//*******************************************************************

function update(elapsed) {

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
        var mouseSum = new Force(mouseWindForceId, Vector.average(mouseVelocity).getXComponet().scale(settings.mouseForceScale));
        mouseSum.relevant = function () {
            if(this.count > 0) {
                return false;
            } else {
                this.count++;
                return true;
            }
        };
    }

    //===============================================================

    //***************************************************************
    //Handle updating rain drops
    //***************************************************************

    for(var i = rain.length - 1; i >= 0; i--) {

        //Add forces to each rain drop

        //check to see if rain drop is affected by mouse wind
        if(mouseSum && sqrDistance(mouse, rain[i].point.cast2D()) < 10000) {
            //Change color of affected rain drops
            //rain[i].color = "rgba(200,0,0,255)";

            //add one time wind force
            rain[i].forces.push(mouseSum.copy());
        } else {
            //Reset color of affected rain drops
            rain[i].color = Rain.defaultColor;
        }

        //Call rain drop's update function

        rain[i].updateRain(elapsed);

        //Check to see if rain drop needs to be removed

        if(rain[i].point.y > height - settings.bottomPadding  /*|| distance(rain[i].point.cast2D(), new Point(width / 2, height / 2)) < Math.min(width / 4, height / 4)*/ ) {
            var tmpPoint = new Point(rain[i].point.x, rain[i].point.y + 1, rain[i].point.z);
            rain[i].collision(new Particle(tmpPoint, 600000000));
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

var dropFactor = 1.2;
var setup = function () {
    Vector.degrees = false;
    settings.numberRainDrops = Math.floor(Math.floor(width/4) * dropFactor);
    for(var i = 0; i < settings.numberRainDrops; i++) {
        rain.push(new Rain());
        console.log("Added Rain");
    }
    console.log(rain.length + " total rain particles");
    loop();
};
window.onload = setup;

//===================================================================

var current = (new Date()).getTime();       //current time for current cycle
var previous = current;                     //previous time for previous cycle
var deltaTime = 0;                            //elapsed time between cycles
var averageDeltaTime = 20;

var deltaTimes = [];
var deltaTimeIndex = 0;
var deltaTimeArrayLength = 5;

//*******************************************************************
//Define and call the main loop function
//*******************************************************************

function loop() {
    current = (new Date()).getTime();
    deltaTime = current - previous;
    previous = current;

    deltaTimes[deltaTimeIndex] = deltaTime;
    deltaTimeIndex++;
    if(deltaTimeIndex > deltaTimeArrayLength - 1) {
        deltaTimeIndex = 0;
    }
    if(deltaTimes.length === deltaTimeArrayLength) {
        var avg = 0;
        for(var i = 0; i < deltaTimeArrayLength; i++) {
            avg += deltaTimes[i];
        }
        avg /= deltaTimeArrayLength;
        averageDeltaTime = avg;
    }

    requestAnimFrame(loop);
    update(deltaTime);
    render(context);
};

//===============================================================

var width = 0;
var height = 0;

window.onresize = function onresize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    settings.numberRainDrops = Math.floor(Math.floor(width/4) * dropFactor);
    console.log("Rain drops updated to " + settings.numberRainDrops);
};

window.onresize();

var mouse = new Point(0, 0);
var mouseDown = false;

window.addEventListener("mousedown", function (event) {
    mouseDown = true;
    settings.mouseForceScale *= 10;
    console.log("Mouse down");
    console.log(settings.mouseForceScale);
});

window.addEventListener("mouseup", function (event) {
    mouseDown = false;
    settings.mouseForceScale /= 10;
    console.log("Mouse up");
    console.log(settings.mouseForceScale);
});

window.onmousemove = function onmousemove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};