/**
 * Created by Brennan on 8/12/2016.
 */

/*******************************************************************/
//Math functions
/*******************************************************************/
var sqrDistance = function (p1, p2) {
    return ((p2.x - p1.x) * (p2.x - p1.x)) + ((p2.y - p1.y) * (p2.y - p1.y)) + ((p2.z - p1.z) * (p2.z - p1.z));
};

var distance = function (p1, p2) {
    return Math.sqrt(sqrDistance(p1, p2));
};

var getSign = function(number) {
    if(number >= 0) {
        return 1;
    } else {
        return -1;
    }
};

/*******************************************************************/
//Point class
/*******************************************************************/
var Point = function(x, y, z) {
    //Coordinates
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

Point.prototype.cast2D = function () {
    return new Point(this.x, this.y);
}

Point.prototype.copy = function () {
    return new Point(this.x, this.y, this.z);
};

Point.prototype.toString = function () {
    return " x: " + this.x + " y: " + this.y + " z: " + this.z
};

/*******************************************************************/
//Vector class
/*******************************************************************/
var Vector = function() {
    var x, y ,z;
    if(arguments[0] instanceof Object) {
        var point1 = arguments[0];
        if(arguments[1]) {
            var point2 = arguments[1];
            x = point1.x - point2.x;
            y = point1.y - point2.y;
            z = point1.z - point2.z;
        } else {
            x = point1.x;
            y = point1.y;
            z = point1.z;
        }
    } else {
        x = arguments[0] || 0;
        y = arguments[1] || 0;
        z = arguments[2] || 0;
    }
    Point.call(x, y, z);
};

Vector.degrees = false;
Vector.i = Vector.x = new Vector(new Point(1, 0, 0));
Vector.j = Vector.y = new Vector(new Point(0, 1, 0));
Vector.k = Vector.z = new Vector(new Point(0, 0, 1));

Vector.byPolar = function (radius, angle) {
    if(Vector.degrees) {
        return new Vector(new Point(Math.cos(angle * (Math.PI / 180)) * radius,
            Math.sin(angle * (Math.PI / 180)) * radius));
    } else {
        return new Vector(new Point(Math.cos(angle) * radius,
            Math.sin(angle) * radius));
    }
};

Vector.bySpherical = function (radius, theta, phi) {
    if(Vector.degrees) {
        return new Vector(new Point(radius * Math.sin(phi * (Math.PI / 180)) * Math.cos(theta * (Math.PI / 180)),
            radius * Math.sin(phi * (Math.PI / 180)) * Math.sin(theta * (Math.PI / 180)),
            radius * Math.cos(phi * (Math.PI / 180))));
    } else {
        return new Vector(new Point(radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)));
    }
};

Vector.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this;
};

Vector.prototype.subtract = function (vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
};

Vector.prototype.magnitude = function () {
    return Math.sqrt((this.x * this.x) +
        (this.y * this.y) + (this.z * this.z));
};

Vector.prototype.magnitude2D = function () {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
};

Vector.prototype.dot = function(vector) {
    return (this.x * vector.x) +
        (this.y * vector.y) +
        (this.z * vector.z);
};

Vector.prototype.dot2D = function (vector) {
    return (this.x * vector.x) +
        (this.y * vector.y);
};

Vector.prototype.cross = function (vector) {
    return new Vector(new Point(
        (this.y * vector.z) - (this.z * vector.y),
        (this.z * vector.x) - (this.x * vector.z),
        (this.x * vector.y) - (this.y * vector.x)
    ));
};

Vector.prototype.projection = function (vector) {
    return vector.copy().scale(this.dot(vector) / Math.pow(vector.magnitude(), 2));
};

Vector.prototype.projection2D = function (vector) {
    return vector.copy().scale(this.dot2D(vector) / Math.pow(vector.magnitude2D(), 2));
};


Vector.prototype.unit = function () {
    return this.copy().scale(1 / this.magnitude());
};

Vector.prototype.getTheta = function () {
    if(Vector.degrees) {
        return Math.atan(this.y / this.x) / (Math.PI / 180);
    } else {
        return Math.atan(this.y / this.x);
    }
};

Vector.prototype.getPhi = function () {
    if(Vector.degrees) {
        return (Math.acos((this.z) /
            Math.sqrt((this.x * this.x) +
                (this.y * this.y) +
                (this.z * this.z)))) / (Math.PI / 180);
    } else {
        return Math.acos((this.z) /
            Math.sqrt((this.x * this.x) +
                (this.y * this.y) +
                (this.z * this.z)));
    }
};

Vector.prototype.angle = function (vector) {
    if (Vector.degrees) {
        return Math.acos((this.dot(vector)) / (this.magnitude() * vector.magnitude())) / (Math.PI / 180);
    } else {
        return Math.acos((this.dot(vector)) / (this.magnitude() * vector.magnitude()));
    }
};

Vector.prototype.scale = function(number) {
    this.x *= number;
    this.y *= number;
    this.z *= number;
    return this;
};

Vector.prototype.rotateOnX = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.y = (this.y * Math.cos(angle)) - (this.z * Math.sin(angle));
    this.z = (this.y * Math.sin(angle)) + (this.z * Math.cos(angle));
    return this;
};

Vector.prototype.rotateOnY = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.x = (this.x * Math.cos(angle)) + (this.z * Math.sin(angle));
    this.z = (this.z * Math.cos(angle)) - (this.x * Math.sin(angle));
    return this;
};

Vector.prototype.rotateOnZ = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.x = (this.x * Math.cos(angle)) - (this.y * Math.sin(angle));
    this.y = (this.x * Math.sin(angle)) + (this.y * Math.cos(angle));
    return this;
};

Vector.prototype.getXComponent = function () {
    return new Vector(new Point(this.x, 0, 0));
};

Vector.prototype.getYComponent = function () {
    return new Vector(new Point(0, this.y, 0));
};

Vector.prototype.getZComponent = function () {
    return new Vector(new Point(0, 0, this.z));
};

Vector.prototype.rotate2D = function (angle) {
    return this.rotateOnZ(angle);
};

Vector.prototype.cast2D = function () {
    return new Vector(x, y, z);
};

Vector.prototype.copy = function () {
    return new Vector(this.x, this.y, this.z);
};

Vector.average = function (vectors) {
    var finalVec = new Vector();
    for(var i = 0; i < vectors.length; i++) {
        finalVec.add(vectors[i]);
    }
    finalVec.x /= vectors.length;
    finalVec.y /= vectors.length;
    finalVec.z /= vectors.length;
    return finalVec;
};

Vector.prototype.toString = function () {
    return " x: " + this.x + " y: " + this.y + " z: " + this.z
};

/*******************************************************************/
