/**
 * Created by Brennan on 8/12/2016.
 */

//*******************************************************************
//Force object
//*******************************************************************

var Force = function (id, vector, location) {
    this.id = id || Force.NO_ID;
    this.vector = vector || new Vector();
    this.location = location || new Point();
    this.count = 0;
};

Force.NO_ID = "NO_ID";

Force.prototype.getVector = function (particle, deltaTime) {
    this.count++;
    return this.vector;
};

Force.prototype.relevant = function (particle) {
    return true;
};

Force.prototype.copy = function () {
    var returnForce = new Force(this.id, this.vector, this.location);
    returnForce.getVector = this.getVector;
    returnForce.relevant = this.relevant;
    returnForce.count = this.count;
    return returnForce;
}

//===================================================================

//*******************************************************************
//Standard force definitions
//*******************************************************************

//Gravity
Force.GRAVITY_ID = "gravity";
Force.GRAVITY = new Force(Force.GRAVITY_ID, new Vector(new Point(0, 0.005, 0)));
Force.GRAVITY.getVector = function (particle, deltaTime) {
    return this.vector.copy().scale(particle.mass);
};

Force.AIR_RESISTANCE_ID = "air_resistance";
Force.AIR_RESISTANCE = new Force(Force.AIR_RESISTANCE_ID);
Force.AIR_RESISTANCE.getVector = function (particle, deltaTime) {
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
    this.netForce = new Force(Particle.NET_FORCE_ID);
    this.scaledNetForce = new Force(Particle.SCALED_NET_FORCE_ID);
};

Particle.NET_FORCE_ID = "particle_net_force";
Particle.SCALED_NET_FORCE_ID = "scaled_particle_net_force";

Particle.prototype.updateParticle = function (deltaTime) {

    //Apply all forces to particle
    this.netForce = new Force(Particle.NET_FORCE_ID, new Vector());
    for(var i = this.forces.length - 1; i >= 0; i--) {
        if(!this.forces[i].relevant(this)) {
            this.forces.splice(i, 1);
            continue;
        }
        this.netForce.vector.add(this.forces[i].getVector(this, deltaTime));
    }
    this.scaledNetForce = new Force(Particle.SCALED_NET_FORCE_ID, this.netForce.vector.copy().scale(this.scale));

    this.velocity.add(this.scaledNetForce.getVector(this, deltaTime).copy().scale((1 / this.mass) * deltaTime));

    this.point.x += this.velocity.point.x * deltaTime;
    this.point.y += this.velocity.point.y * deltaTime;
    this.point.z += this.velocity.point.z * deltaTime;
};

Particle.prototype.getMomentum = function () {
    return this.velocity.magnitude() * this.mass;
};

Particle.VERY_LAGE = 1000;

Particle.prototype.collision = function (particle, inelastic) {
    if(!inelastic) {
        inelastic = 1;
    }
    var impactVector = (new Vector(this.point.cast2D(), particle.point.cast2D())).unit();
    var thisDirectionVelocity = this.velocity.projection(impactVector);
    var particleDirectionVelocity = particle.velocity.projection(impactVector);

    this.velocity.subtract(thisDirectionVelocity);

    if(particle.mass === Infinity || particle.mass > this.mass * Particle.VERY_LAGE) {
        this.velocity.add(thisDirectionVelocity.scale(-1)).add(particleDirectionVelocity);
        return;
    }

    this.velocity.subtract(thisDirectionVelocity);
    this.velocity.add(impactVector.copy().scale(-1* (((inelastic * particle.mass * (particleDirectionVelocity.magnitude() -
        thisDirectionVelocity.magnitude())) + (thisDirectionVelocity.magnitude() * this.mass) +
        (particle.mass * particleDirectionVelocity.magnitude()))) / (this.mass + particle.mass)));
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
    }
};

//===================================================================