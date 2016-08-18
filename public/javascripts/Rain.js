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
var context = canvas.getContext("2d")

//*******************************************************************
//Main Code here
//*******************************************************************

var settings = {
    //Color of the rain
    defaultRainColor: "rgba(0,191,255,255)",
    rainColor: "rgba(5,191,255,255)",

    //max number of rain drops falling at once
    numberRainDrops: 750,
    //initial rain speed factor
    initialRainSpeed: 1.25,

    //width of the rain drops in pixels
    widthRainDrops: 4,
    //height of the rain drops in pixels
    heightRainDrops: 20,

    //parallax that defines deepest rain
    parallax: 70,                           //parallax that defines deepest rain
    //maximum total parallax, used to create scale ratio
    maxParallax: 100,

    //number of pixels from the bottom that the rain stops
    bottomPadding: 10,

    //number of mouse movement segments used to take average velocity of mouse
    mouseAverageLength: 5,
    //scale factor for the mouse force (wind) added to rain
    mouseForceScale: 0.001,
    //maximum square distance away from the mouse that raindrops will be affected by wind force
    mouseAffectDistance: 40000,

    //Rain drop drag coefficient for air resistance on rain drop
    rainDropDragCoefficient: 0.009
};

var guiFunctions = {
    //Flag to auto change drops with window
    autoDropCount: true,

    //Clear all rain
    clearRain: function () {
        rain = [];
    },

    //Resets rain back to default color
    resetRainColor: function () {
        settings.rainColor = settings.defaultRainColor;
    },
    //Sets if rain changes immediately or waits for new particles
    immediateRainColorChange: false,

    //flag for center sphere force
    centerCircle: false,

    //Option to render root QuadTree nodes or not
    renderQuadTree: false,

    //flag to show fps count
    showFpsCount: false
};

var gui = {};
var defineGui = function (domElement) {
    gui = new dat.GUI({ autoPlace: false });
    domElement.appendChild(gui.domElement);
    gui.width = 400;

    var rain = gui.addFolder("Rain");

    var rainNumController = rain.add(settings, "numberRainDrops");
    rainNumController.min(0);
    rainNumController.onChange(function (value) {
        guiFunctions.autoDropCount = false;
    });

    rain.add(guiFunctions, "autoDropCount").listen().onChange(function (value) {
        if(value) {
            settings.numberRainDrops = Math.floor(Math.floor(width/4) * dropFactor);
            rainNumController.updateDisplay();
        }
    });
    rain.add(guiFunctions, "clearRain");

    rain.addColor(settings, "rainColor").listen();

    rain.add(guiFunctions, "immediateRainColorChange");
    rain.add(guiFunctions, "resetRainColor");

    var forces = gui.addFolder("Forces");
    forces.add(guiFunctions, "centerCircle");

    var collision = gui.addFolder("Collisions");
    collision.add(guiFunctions, "renderQuadTree");

    var performance = gui.addFolder("Performance");
    performance.add(guiFunctions, "showFpsCount");
};

var rain = [];                              //Array to hold all the rain drop objects
var tree = {};

//*******************************************************************
//Defined cool forces
//*******************************************************************

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
        var out = net.copy().getYComponent().add(new Vector(new Point(0, circleAclScale * (particle.mass / deltaTime) *
            (particle.velocity.y - (circleMaxSpeed * particle.scale)), 0))).scale(-1);
        return out;
    } else {
        return new Vector();
    }
};
circleForce.relevant = function (particle) {
    if(!guiFunctions.centerCircle) {
        return false;
    }
    if(particle) {
        if(particle.point.x + particle.width < (width / 2) - Math.min(width / 4, height / 4) ||
            particle.point.x > (width / 2) + Math.min(width / 4, height / 4)) {
            return false;
        }
    }
    return true;
};

//===================================================================

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
        new Vector(new Point(0, -h))], s);
    RenderObject.call(this, p, [this.convex], [settings.rainColor]);

    this.color = this.shapes[0].color = settings.rainColor;

    this.dragCoefficent = settings.rainDropDragCoefficient;
    this.velocity = new Vector(new Point(0, this.scale * settings.initialRainSpeed));
    this.scale = s;

    this.forces.push(Force.GRAVITY.copy());
    this.forces.push(Force.AIR_RESISTANCE.copy());
};

Rain.prototype = new RenderObject();

Rain.prototype.toQuadTreeItem = function () {
    return { x : this.point.x, y : this.point.y, width : this.width, height : this.height };
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

    if(guiFunctions.renderQuadTree) {
        QuadTree.renderQuad(context, tree);
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
        var mouseSum = new Force(mouseWindForceId, Vector.average(mouseVelocity).getXComponent().scale(settings.mouseForceScale));
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
    //Fill Quad Tree
    //***************************************************************

    tree = new QuadTree({ x : 0, y : 0, width : width, height : height }, false, 10, 5);

    var len = rain.length;
    for(var i = 0; i < len; i++) {
        tree.insert(rain[i].toQuadTreeItem());
    }

    //===============================================================

    //***************************************************************
    //Handle updating rain drops
    //***************************************************************

    for(var i = rain.length - 1; i >= 0; i--) {

        if(guiFunctions.immediateRainColorChange) {
            rain[i].colors[0] = settings.rainColor;
        }

        //check to see if rain drop is affected by mouse wind
        if(mouseSum && sqrDistance(mouse, rain[i].point.cast2D()) < 10000) {
            //Change color of affected rain drops
            //rain[i].color = "rgba(200,0,0,255)";

            //add one time wind force
            rain[i].forces.push(mouseSum.copy());
        } else {
            //Reset color of affected rain drops
            rain[i].color = settings.rainColor;
        }

        //Call rain drop's update function

        rain[i].updateParticle(elapsed);

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

    //Add any new rain
    if(rain.length < settings.numberRainDrops) {
        var num = settings.numberRainDrops - rain.length;
        for(var i = 0; i < num; i++) {
            rain.push(new Rain());
        }
    }

    //Any new forces
    if(guiFunctions.centerCircle) {
        var len = rain.length;
        for(var i = 0; i < len; i++) {
            if(!rain[i].containsForce(circleForceId)) {
                rain[i].forces.push(circleForce.copy());
            }
        }
    }
}

//===================================================================

//*******************************************************************
//Define and call the setup function
//*******************************************************************

var dropFactor = 1.2;
var fpsCounter;
var setup = function () {
    Vector.degrees = false;

    settings.numberRainDrops = Math.floor(Math.floor(width/4) * dropFactor);
    for(var i = 0; i < settings.numberRainDrops; i++) {
        rain.push(new Rain());
    }
    console.log(rain.length + " total rain particles");

    var loading = document.getElementById("loading-message");
    //document.body.removeChild(loading);
    loading.classList.remove("visible");
    loading.classList.add("hide");

    var datGuiElement = document.getElementById("dat-gui");
    defineGui(datGuiElement);

    fpsCounter = document.getElementById("fps-counter");

    loop();
};
window.onload = setup;

//===================================================================

var current = (new Date()).getTime();       //current time for current cycle
var previous = current;                     //previous time for previous cycle
var deltaTime = 0;                            //elapsed time between cycles
var averageDeltaTime = 20;
var maxDeltaTime , minDeltaTime;

var deltaTimes = [];
var deltaTimeIndex = 0;
var deltaTimeArrayLength = 10;

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

        if(!minDeltaTime) {
            minDeltaTime = deltaTime;
        }
        if(!maxDeltaTime) {
            maxDeltaTime = deltaTime;
        }

        if(deltaTime < maxDeltaTime) {
            maxDeltaTime = deltaTime;
        } else if(deltaTime > minDeltaTime) {
            minDeltaTime = deltaTime;
        }
    }

    if(guiFunctions.showFpsCount) {
        fpsCounter.innerHTML = "<div><strong>FPS:</strong> " + (1 / (averageDeltaTime / 1000)).toFixed(2) + "</div>" +
                                "<div><strong>Max:</strong> " + (1 / (maxDeltaTime / 1000)).toFixed(2) + "</div>" +
                                "<div><strong>Min:</strong> " + (1 / (minDeltaTime / 1000)).toFixed(2) + "</div>";
    } else {
        fpsCounter.innerHTML = "";
    }

    update(deltaTime);
    requestAnimFrame(loop);
    render(context);
};

//===============================================================

var width = 0;
var height = 0;

window.onresize = function onresize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if(guiFunctions.autoDropCount) {
        settings.numberRainDrops = Math.floor(Math.floor(width/4) * dropFactor);
    }
};

window.onresize();

var mouse = new Point(0, 0);
var mouseDown = false;
var increased = false;

window.addEventListener("mousedown", function (event) {
    mouseDown = true;
    if(!increased) {
        increased = true;
        settings.mouseForceScale *= 10;
    }
});

window.addEventListener("mouseup", function (event) {
    mouseDown = false;
    if(increased) {
        increased = false;
        settings.mouseForceScale /= 10;
    }
});

window.onmousemove = function onmousemove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
};
