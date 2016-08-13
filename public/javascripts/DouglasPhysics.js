/**
 * Created by Brennan on 8/12/2016.
 */

//*******************************************************************
//Force object
//*******************************************************************

var Force = function (vector, location) {
    this.vector = vector || new Vector();
    this.location = location || new Point();
};

Force.prototype.getVector = function (particle) {
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
    return this.returnForce;
}

//===================================================================

//*******************************************************************
//Particle Object
//*******************************************************************

var Particle = function (point, mass, vector, scale) {
    this.point = point || new Point();
    this.mass = mass || 1;
    this.velocity = vector || new Vector();
    this.radius = .5;
    this.scale = scale || 1;
    this.forces = [];
};

Particle.prototype.update = function (deltaTime) {
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