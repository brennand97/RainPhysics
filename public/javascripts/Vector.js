/**
 * Created by Brennan on 8/11/2016.
 */
var Vector = function(point1, point2) {
    if(point2) {
        this.point = new Point(point1.x - point2.x, point1.y - point2.y, point1.z - point2.z);
    } else {
        this.point = point1 || new Point(0, 0, 0);
    }
};

Vector.prototype.add = function (vector) {
    this.point.x += vector.point.x;
    this.point.y += vector.point.y;
    this.point.z += vector.point.z;
};

Vector.prototype.sub = function (vector) {
    this.point.x -= vector.point.x;
    this.point.y -= vector.point.y;
    this.point.z -= vector.point.z;
};

Vector.prototype.mag = function () {
    return Math.sqrt((this.point.x * this.point.x) +
        (this.point.y * this.point.y) + (this.point.z * this.point.z));
};

Vector.prototype.dot = function(vector) {
    return (vector1.point.x * vector2.point.x) +
        (vector1.point.y * vector2.point.y) +
        (vector1.point.z * vector2.point.z);
};

Vector.prototype.cross = function (vector) {
    return new Vector(new Point(
        (vector1.point.y * vector2.point.z) - (vector1.point.z * vector2.point.y),
        (vector1.point.z * vector2.point.x) - (vector1.point.x * vector2.point.z),
        (vector1.point.x * vector2.point.y) - (vector1.point.y * vector2.point.x)
    ));
};

Vector.prototype.ang = function (vector) {
    return Math.acos( (this.dot(vector)) / (this.mag() * vector.mag()) );
};

Vector.prototype.scl = function(number) {
    this.point.x *= number;
    this.point.y *= number;
    this.point.z *= number;
    return this;
};

Vector.prototype.copy = function () {
    return new Vector(new Point(this.point.x, this.point.y, this.point.z));
}

Vector.avg = function (vectors) {
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
