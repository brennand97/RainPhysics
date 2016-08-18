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
Force.NET_FORCE_ID = "object_net_force";
Force.SCALED_NET_FORCE_ID = "scaled_object_net_force";

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
};

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
    return new Vector(new Point((Math.pow(particle.velocity.x, 2) *
        particle.dragCoefficent * -getSign(particle.velocity.x)) / particle.scale,
        (Math.pow(particle.velocity.y, 2) * particle.dragCoefficent *
        -getSign(particle.velocity.y)) / particle.scale));
};

//===================================================================

//*******************************************************************
//General object that stores location data
//*******************************************************************

var PhysicsObject = function (point, mass, scale, vector) {
    this.point = point || new Point();
    this.mass = mass || 1;
    this.velocity = vector || new Vector();
    this.scale = scale || 1;
    this.forces = [];
    this.netForce = new Force(Force.NET_FORCE_ID);
    this.scaledNetForce = new Force(Particle.SCALED_NET_FORCE_ID);
};

//===================================================================

//*******************************************************************
//Particle Object
//*******************************************************************

var Particle = function (point, mass, scale, vector, coefficient) {
    this.dragCoefficent = coefficient || 0;
    PhysicsObject.call(this, point, mass, scale, vector);
};

Particle.prototype = new PhysicsObject();

Particle.prototype.updateParticle = function (deltaTime) {

    //console.log(this.point);

    if(this.collisionVector) {
        this.velocity.add(this.collisionVector);
        this.collisionVector = new Vector();
    }

    //Apply all forces to particle
    this.netForce = new Force(Force.NET_FORCE_ID, new Vector());
    for(var i = this.forces.length - 1; i >= 0; i--) {
        if(!this.forces[i].relevant(this)) {
            this.forces.splice(i, 1);
            continue;
        }
        this.netForce.vector.add(this.forces[i].getVector(this, deltaTime));
    }
    this.scaledNetForce = new Force(Force.SCALED_NET_FORCE_ID, this.netForce.vector.copy().scale(this.scale));

    this.velocity.add(this.scaledNetForce.getVector(this, deltaTime).copy().scale((1 / this.mass) * deltaTime));

    this.point.x += this.velocity.x * deltaTime;
    this.point.y += this.velocity.y * deltaTime;
    this.point.z += this.velocity.z * deltaTime;
};

Particle.prototype.getMomentum = function () {
    return this.velocity.magnitude() * this.mass;
};

Particle.prototype.removeForce = function (id) {
    var len = this.forces.length;
    for(var i = len; i >= 0; i--) {
        if(this.forces[i].id === id) {
            this.forces.splice(i, 1);
        }
    }
};

Particle.prototype.containsForce = function (id) {
    var len = this.forces.length;
    for(var i = 0; i < len; i++) {
        if(this.forces[i].id === id) {
            return true;
        }
    }
    return false;
};

Particle.VERY_LAGE = 1000;

/**
 * @deprecated
 * @param particle
 * @param inelastic
 */
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

Particle.collide = function (particle, particles, inelastic) {
    if(!inelastic) {
        inelastic = 1;
    }
    var particle1 = particle;
    var particle2 = particles.pop();

    var impactVector = (new Vector(particle1.point.cast2D(), particle2.point.cast2D())).unit();
    var particle1DirectionVelocity = particle1.velocity.projection(impactVector);
    var particle2DirectionVelocity = particle2.velocity.projection(impactVector);

    if(!particle1.collisionVector) {
        particle1.collisionVector = new Vector();
    }
    if(!particle2.collisionVector) {
        particle2.collisionVector = new Vector();
    }

    if (particle2.mass === Infinity || particle2.mass > particle1.mass * Particle.VERY_LAGE) {
        particle1.collisionVector.subtract(particle1DirectionVelocity);
        particle1.collisionVector.add(particle1DirectionVelocity.scale(-1)).add(particle2DirectionVelocity);
        return;
    } else if (particle1.mass === Infinity || particle1.mass > particle2.mass * Particle.VERY_LAGE){
        particle2.collisionVector.subtract(particle2DirectionVelocity);
        particle2.collisionVector.add(particle2DirectionVelocity.scale(-1)).add(particle1DirectionVelocity);
        return;
    }

    particle1.collisionVector.subtract(particle1DirectionVelocity);
    particle1.collisionVector.add(impactVector.copy().scale(-1* (((inelastic * particle2.mass * (particle2DirectionVelocity.magnitude() -
        particle1DirectionVelocity.magnitude())) + (particle1DirectionVelocity.magnitude() * particle1.mass) +
        (particle2.mass * particle2DirectionVelocity.magnitude()))) / (particle1.mass + particle2.mass)));

    particle2.collisionVector.subtract(particle2DirectionVelocity);
    particle2.collisionVector.add(impactVector.copy().scale((((inelastic * particle1.mass * (particle1DirectionVelocity.magnitude() -
        particle2DirectionVelocity.magnitude())) + (particle1DirectionVelocity.magnitude() * particle1.mass) +
        (particle2.mass * particle2DirectionVelocity.magnitude()))) / (particle1.mass + particle2.mass)));

    if(particles.length > 0) {
        Particle.collide(particle, particles, inelastic);
    }
};

//===================================================================

//*******************************************************************
//Convex Shape
//*******************************************************************

var Convex = function (origin, vectors, scale, rotate) {
    this.origin = origin || new Vector();
    this.vectors = vectors || [];
    this.scale = scale || 1;
    this.rotate = rotate || 0;

    var xh = 0;
    var xl = 0;
    var yh = 0;
    var yl = 0;
    var len = this.vectors.length;
    for(var i = 0; i < len; i++) {
        var x = this.vectors[i].x * this.scale;
        var y = this.vectors[i].y * this.scale;

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

Convex.prototype.render = function (context, point, color) {
    var p = point || new Point();
    var c = color || "rgba(0,0,0,255)";

    context.save();

    context.fillStyle = c;

    context.beginPath();
    context.moveTo(this.origin.x + p.x + (this.vectors[0].x * this.scale), this.origin.y + p.y + (this.vectors[0].y * this.scale));
    var len = this.vectors.length;
    for(var i = 1; i < len; i++) {
        context.lineTo(this.origin.x + p.x + (this.vectors[i].x * this.scale), this.origin.y + p.y + (this.vectors[i].y * this.scale));
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

var RenderObject = function(point, shapes, colors) {
    Particle.call(this, point);
    this.shapes = shapes || [];
    this.colors = colors || [];

    var xh = 0;
    var xl = 0;
    var yh = 0;
    var yl = 0;
    var len1 = this.shapes.length;
    for(var i = 0; i < len1; i++) {
        var len2 = this.shapes[i].vectors.length;
        for(var j = 0; j < len2; j++) {
            var x = this.shapes[i].vectors[j].x * this.shapes[i].scale;
            var y = this.shapes[i].vectors[j].y * this.shapes[i].scale;

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
        this.shapes[i].render(context, p, this.colors[i]);
    }
};

//===================================================================