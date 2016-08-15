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

/*******************************************************************/
//Vector class
/*******************************************************************/
var Vector = function(point1, point2) {
    if(point2) {
        this.point = new Point(point1.x - point2.x, point1.y - point2.y, point1.z - point2.z);
    } else {
        this.point = point1 || new Point();
    }
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
    this.point.x += vector.point.x;
    this.point.y += vector.point.y;
    this.point.z += vector.point.z;
    return this;
};

Vector.prototype.subtract = function (vector) {
    this.point.x -= vector.point.x;
    this.point.y -= vector.point.y;
    this.point.z -= vector.point.z;
    return this;
};

Vector.prototype.magnitude = function () {
    return Math.sqrt((this.point.x * this.point.x) +
        (this.point.y * this.point.y) + (this.point.z * this.point.z));
};

Vector.prototype.magnitude2D = function () {
    return Math.sqrt((this.point.x * this.point.x) + (this.point.y * this.point.y));
};

Vector.prototype.dot = function(vector) {
    return (this.point.x * vector.point.x) +
        (this.point.y * vector.point.y) +
        (this.point.z * vector.point.z);
};

Vector.prototype.dot2D = function (vector) {
    return (this.point.x * vector.point.x) +
        (this.point.y * vector.point.y);
};

Vector.prototype.cross = function (vector) {
    return new Vector(new Point(
        (this.point.y * vector.point.z) - (this.point.z * vector.point.y),
        (this.point.z * vector.point.x) - (this.point.x * vector.point.z),
        (this.point.x * vector.point.y) - (this.point.y * vector.point.x)
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
        return Math.atan(this.point.y / this.point.x) / (Math.PI / 180);
    } else {
        return Math.atan(this.point.y / this.point.x);
    }
};

Vector.prototype.getPhi = function () {
    if(Vector.degrees) {
        return (Math.acos((this.point.z) /
            Math.sqrt((this.point.x * this.point.x) +
                (this.point.y * this.point.y) +
                (this.point.z * this.point.z)))) / (Math.PI / 180);
    } else {
        return Math.acos((this.point.z) /
            Math.sqrt((this.point.x * this.point.x) +
                (this.point.y * this.point.y) +
                (this.point.z * this.point.z)));
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
    this.point.x *= number;
    this.point.y *= number;
    this.point.z *= number;
    return this;
};

Vector.prototype.rotateOnX = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.point.y = (this.point.y * Math.cos(angle)) - (this.point.z * Math.sin(angle));
    this.point.z = (this.point.y * Math.sin(angle)) + (this.point.z * Math.cos(angle));
    return this;
};

Vector.prototype.rotateOnY = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.point.x = (this.point.x * Math.cos(angle)) + (this.point.z * Math.sin(angle));
    this.point.z = (this.point.z * Math.cos(angle)) - (this.point.x * Math.sin(angle));
    return this;
};

Vector.prototype.rotateOnZ = function (angle) {
    if(Vector.degrees) {
        angle *= (Math.PI / 180);
    }
    this.point.x = (this.point.x * Math.cos(angle)) - (this.point.y * Math.sin(angle));
    this.point.y = (this.point.x * Math.sin(angle)) + (this.point.y * Math.cos(angle));
    return this;
};

Vector.prototype.getXComponet = function () {
    return new Vector(new Point(this.point.x, 0, 0));
};

Vector.prototype.getYComponet = function () {
    return new Vector(new Point(0, this.point.y, 0));
};

Vector.prototype.getZComponet = function () {
    return new Vector(new Point(0, 0, this.point.z));
};

Vector.prototype.rotate2D = function (angle) {
    return this.rotateOnZ(angle);
};

Vector.prototype.copy = function () {
    return new Vector(new Point(this.point.x.valueOf(), this.point.y, this.point.z));
};

Vector.average = function (vectors) {
    var finalVec = new Vector();
    for(var i = 0; i < vectors.length; i++) {
        finalVec.add(vectors[i]);
    }
    finalVec.point.x /= vectors.length;
    finalVec.point.y /= vectors.length;
    finalVec.point.z /= vectors.length;
    return finalVec;
};

Vector.prototype.toString = function () {
    return " x: " + this.point.x + " y: " + this.point.y + " z: " + this.point.z
};

/*******************************************************************/
