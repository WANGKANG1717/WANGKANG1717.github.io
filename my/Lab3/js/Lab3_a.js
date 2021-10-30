/**
 * kang
 * 2021/10/12
 */
const {
	vec2,
	vec3,
	vec4,
} = glMatrix;

var gl;
var points = [];
var colors = [];
//
var direction=-1.0; //旋转方向
var color = vec3.fromValues(0.0, 1.0, 1.0); //三维数组
var R, G, B; //颜色
var angle=10; //角度~~~~不要弧度，麻烦
var speed = 50; //时间间隔
//
var theta = 0;
var thetaLoc;

var vertices = [
	vec2.fromValues(0, 1),
	vec2.fromValues(-1, 0),
	vec2.fromValues(1, 0),
	vec2.fromValues(0, -1)
];

function init() {
	var canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas, "experimental-webgl");
	if (!gl) {
		alert("WebGL isn't available");
	}
	var a = vertices[0];
	var b = vertices[1];
	var c = vertices[2];
	var d = vertices[3];
	points = [];
	colors = [];
	Draw(a, b, c, d);
	// Configure WebGL
	gl.viewport(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
	// gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// load data into the gpu
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

	// associate external shader variables with data buffer 
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	//Color
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	//
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	//
	thetaLoc = gl.getUniformLocation(program, "theta");

	render();
	// window.setInterval(render, time_slot);		//这个不好实时改变速度
};

function Draw(a, b, c, d) {
	pushPoint(a);
	pushPoint(b);
	pushPoint(c);
	pushPoint(d);
	pushColor(color);
	pushColor(color);
	pushColor(color);
	pushColor(color);
}

function pushPoint(point) {
	points.push(point[0], point[1]);
}

function pushColor(color) {
	colors.push(color[0], color[1], color[2]);
}

function render() {
	getData();
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length / 2);
	setTimeout( function(){ requestAnimFrame( render ); }, speed );
}

function getData() {
	var radian = angle / 180.0 * Math.PI;
	theta += direction * radian;
	if (theta > 2 * Math.PI)
		theta -= (2 * Math.PI);
	gl.uniform1f(thetaLoc, theta);
}

function main() {
	document.getElementById("Direction").onclick = function(event) {
		// console.log(event.target.value);
		// if(event.target.value==1) {
		// 	direction = (-1.0);
		// }
		// else if(event.target.value==2) {
		// 	direction = 1.0;
		// }
		// console.log(direction);
		direction *= -1.0;
	}
	document.getElementById("Angle").onchange=function(event) {
		var tmp=event.target.value;
		if(tmp>=0 && tmp<=255) angle=event.target.value;
		// console.log(angle);
	}
	document.getElementById("Speed").onchange=function(event) {
		speed=101-event.target.value;
		console.log(event.target.value);
		console.log(speed);
	}
	// document.getElementById("R").onchange=function(event) {
	// 	var r=event.target.value;
	// 	if(r>=0 && r<=255) R=event.target.value;
	// 	// console.log(R);
	// 	changeColor();
	// }
	// document.getElementById("G").onchange=function(event) {
	// 	var g=event.target.value;
	// 	if(g>=0 && g<=255) G=event.target.value;
	// 	// console.log(G);
	// 	changeColor();
	// }
	// document.getElementById("B").onchange=function(event) {
	// 	var b=event.target.value;
	// 	if(b>=0 && b<=255) B=event.target.value;
	// 	// console.log(B);
	// 	changeColor();
	// }
	
	init();
}