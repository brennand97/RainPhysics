/**
 * Created by Brennan on 8/11/2016.
 */
var Point = function(x, y, z) {
    //Coordinates
    this.x = x;
    this.y = y;
    //if z is not specified point is 2D
    this.z = z || 0;
};

var sqrDistance = function (p1, p2) {
    return ((p2.x - p1.x) * (p2.x - p1.x)) + ((p2.y - p1.y) * (p2.y - p1.y)) + ((p2.z - p1.z) * (p2.z - p1.z));
};

var distance = function (p1, p2) {
    return Math.sqrt(sqrDistance(p1, p2));
};