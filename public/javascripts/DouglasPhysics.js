/**
 * Created by Brennan on 8/12/2016.
 */

//*******************************************************************
//Force object
//*******************************************************************

var Force = function (vector, location) {
    this.vector = vector || new Vector();
    this.location = location || new Point();
    this.count = 0;
};

Force.prototype.getVector = function (particle) {
    this.count++;
    return this.vector;
};

Force.prototype.relevant = function (particle) {
    return true;
};

Force.prototype.copy = function () {
    this.returnForce = {};
    this.returnForce = new Force(this.vector, this.location);
    this.returnForce.getVector = this.getVector;
    this.returnForce.relevant = this.relevant;
    this.returnForce.count = this.count;
    return this.returnForce;
}

//===================================================================

//*******************************************************************
//Standard force definitions
//*******************************************************************

//Gravity
Force.GRAVITY = new Force(new Vector(new Point(0, 0.005, 0)));


Force.AIR_RESISTANCE = new Force();
Force.AIR_RESISTANCE.getVector = function (particle) {
    return new Vector(new Point((Math.pow(particle.velocity.point.x, 2) *
        particle.dragCoefficent * -getSign(particle.velocity.point.x)) / particle.scale,
        (Math.pow(particle.velocity.point.y, 2) * particle.dragCoefficent *
        -getSign(particle.velocity.point.y)) / particle.scale));
};

//===================================================================

//*******************************************************************
//Particle Object
//*******************************************************************

var Particle = function (point, mass, scale, vector, coefficient) {
    this.point = point || new Point();
    this.mass = mass || 1;
    this.velocity = vector || new Vector();
    this.scale = scale || 1;
    this.forces = [];
    this.dragCoefficent = coefficient || 0;
};

Particle.prototype.updateParticle = function (deltaTime) {
    //Apply all forces to particle
    for(var i = this.forces.length - 1; i >= 0; i--) {
        if(!this.forces[i].relevant(this)) {
            this.forces.splice(i, 1);
            continue;
        }
        this.velocity.add(this.forces[i].getVector(this).copy().scale(this.scale * (1 / this.mass) * deltaTime));
    }

    this.point.x += this.velocity.point.x * deltaTime;
    this.point.y += this.velocity.point.y * deltaTime;
    this.point.z += this.velocity.point.z * deltaTime;
    if(this.point.z < 0) { this.point.z = 0 }
};

Particle.prototype.getMomentum = function () {
    return this.velocity.magnitude() * this.mass;
};

Particle.prototype.collision = function (particle, inelastic) {
    if(!inelastic) {
        inelastic = 1;
    }
    Vector.degrees = false;
    this.impactVector = (new Vector(this.point.cast2D(), particle.point.cast2D())).unit();
    this.directionVelocity = this.velocity.projection(this.impactVector);
    particle.directionVelocity = particle.velocity.projection(this.impactVector);

    this.velocity.subtract(this.directionVelocity);
    this.velocity.add(this.impactVector.copy().scale(-1* (((inelastic * particle.mass * (particle.directionVelocity.magnitude() -
        this.directionVelocity.magnitude())) + (this.directionVelocity.magnitude() * this.mass) +
        (particle.mass * particle.directionVelocity.magnitude()))) / (this.mass + particle.mass)));

    this.impactVector = {};
    this.directionVelocity = {};
    particle.directionVelocity = {};
};

//===================================================================

//*******************************************************************
//Convex Shape
//*******************************************************************

var Convex = function (origin, vectors, color, scale, rotate) {
    this.origin = origin || new Vector();
    this.vectors = vectors || [];
    this.color = color || "rgba(0,0,0,255)";
    this.scale = scale || 1;
    this.rotate = rotate || 0;

    var xh = 0;
    var xl = 0;
    var yh = 0;
    var yl = 0;
    var len = this.vectors.length;
    for(var i = 0; i < len; i++) {
        this.vectors[i];
        var x = this.vectors[i].point.x * this.scale;
        var y = this.vectors[i].point.y * this.scale;

        if(x > xh) {
            xh = x;
        } else if(x < xl) {
            xl = x;
        }
        if(y > yh) {
            yh = y;
        } else if(y < yl) {
            yl = y;
        }
    }
    this.maxWidth = xh - xl;
    this.maxHeight = yh - yl;
};

Convex.prototype.render = function (context, point) {
    var p = point || new Point();

    context.save();

    context.fillStyle = this.color;

    context.beginPath();
    context.moveTo(this.origin.x + p.x + (this.vectors[0].point.x * this.scale), this.origin.y + p.y + (this.vectors[0].point.y * this.scale));
    var len = this.vectors.length;
    for(var i = 1; i < len; i++) {
        context.lineTo(this.origin.x + p.x + (this.vectors[i].point.x * this.scale), this.origin.y + p.y + (this.vectors[i].point.y * this.scale));
    }
    context.closePath();
    context.fill();

    context.restore();
};

Convex.prototype.rotate = function (angle) {
    this.rotate += angle;
    var len = this.vectors.length;
    for(var i = 0; i < len; i ++) {
        this.vectors[i].rotate2D(angle);
    }
};

Convex.prototype.copy = function () {
    var out = new Convex(this.origin, this.vectors, this.color. this.rotate);
};

//===================================================================

//*******************************************************************
//Render Object
//*******************************************************************

var RenderObject = function(point, shapes) {
    Particle.call(this, point);
    this.shapes = shapes || [];

    var xh = 0;
    var xl = 0;
    var yh = 0;
    var yl = 0;
    var len1 = this.shapes.length;
    for(var i = 0; i < len1; i++) {
        var len2 = this.shapes[i].vectors.length;
        for(var j = 0; j < len2; j++) {
            var x = this.shapes[i].vectors[j].point.x * this.shapes[i].scale;
            var y = this.shapes[i].vectors[j].point.y * this.shapes[i].scale;

            if(x > xh) {
                xh = x;
            } else if(x < xl) {
                xl = x;
            }
            if(y > yh) {
                yh = y;
            } else if(y < yl) {
                yl = y;
            }
        }
    }
    this.width = xh - xl;
    this.height = yh - yl;
};

RenderObject.prototype = new Particle();

RenderObject.prototype.renderObject = function (context) {
    var p = this.point;
    var len = this.shapes.length;
    for(var i = 0; i < len; i++) {
        this.shapes[i].render(context, p);
        //context.fillStyle = this.shapes[i].color;
        //context.fillRect(this.point.x - (this.width / 2), this.point.y - this.height, this.width, this.height);
    }
};

//===================================================================