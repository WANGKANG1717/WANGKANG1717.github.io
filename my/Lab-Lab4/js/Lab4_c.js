/**
 * kang
 * 2021/10/12
 */
const {
	vec2,
	vec3,
	vec4
} = glMatrix;

var canvas;
var gl;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [0, 0, 0];
var thetaLoc;

//偏移量
var scale=vec3.fromValues(1,  1, 1);
var scaleLoc;

window.onload = function initCube() {
	canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	//得到立方体所需要的数据
	makeCube();

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 0.5);
	//激活深度比较，并且更新深度缓冲区
	gl.enable(gl.DEPTH_TEST);
	//
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	//
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	//这里是关键
	//使用getUniformLocation得到一个着色器中某个变量的地址
	//并将这个地址赋值给指定的变量名称
	thetaLoc = gl.getUniformLocation(program, "theta");
	/**
	 * WebGLRenderingContext.uniform[1234][fi][v]() 方法指定了uniform 变量的值。
	 * 参数
	 * location WebGLUniformLocation 对象包含了将要修改的uniform 属性位置.
	 * value, v0, v1, v2, v3
		新的值将被用于uniform 变量. 可能的类型:
		浮点值 Number(方法名跟"f").
		浮点数组 (例如 Float32Array 或 Array 的数组) 用于浮点型向量方法 (方法名跟 "fv").
		整型值 Number  (方法名跟"i").
		整型数组Int32Array 用于整型向量方法 (方法名跟 "iv").
	 */
	//theta是3维浮点型数组，所以是3fv
	gl.uniform3fv(thetaLoc, theta);
	//
	scaleLoc = gl.getUniformLocation(program, "scale");
	gl.uniform3fv(scaleLoc, scale);
	/**
	 * 一下为添加事件
	 */
	addEvent();

	render();
}

function makeCube() {
	//顶点矩阵
	var vertices = [
		vec4.fromValues(-0.5, -0.5, 0.5, 1.0),
		vec4.fromValues(-0.5, 0.5, 0.5, 1.0),
		vec4.fromValues(0.5, 0.5, 0.5, 1.0),
		vec4.fromValues(0.5, -0.5, 0.5, 1.0),
		vec4.fromValues(-0.5, -0.5, -0.5, 1.0),
		vec4.fromValues(-0.5, 0.5, -0.5, 1.0),
		vec4.fromValues(0.5, 0.5, -0.5, 1.0),
		vec4.fromValues(0.5, -0.5, -0.5, 1.0),
	];
	//顶点颜色矩阵
	var vertexColors = [
		vec4.fromValues(0.0, 0.0, 0.0, 1.0),
		vec4.fromValues(1.0, 0.0, 0.0, 1.0),
		vec4.fromValues(1.0, 1.0, 0.0, 1.0),
		vec4.fromValues(0.0, 1.0, 0.0, 1.0),
		vec4.fromValues(0.0, 0.0, 1.0, 1.0),
		vec4.fromValues(1.0, 0.0, 1.0, 1.0),
		vec4.fromValues(0.0, 1.0, 1.0, 1.0),
		vec4.fromValues(1.0, 1.0, 1.0, 1.0)
	];

	// var faces = [
	// 	1, 0, 3, 1, 3, 2, //正
	// 	2, 3, 7, 2, 7, 6, //右
	// 	3, 0, 4, 3, 4, 7, //底
	// 	6, 5, 1, 6, 1, 2, //顶
	// 	4, 5, 6, 4, 6, 7, //背
	// 	5, 4, 0, 5, 0, 1 //左
	// ];
	
	var faces= [
		1, 0, 3, 2,
		2, 3, 7, 6,
		3, 0, 4, 7,
		6, 5, 1, 2,
		4, 5, 6, 7,
		5, 4, 0, 1,
	];
	//这里我使用TRIANGLE_FAN来绘制三角形
	//一个面需要四个点
	//整个立方体需要24个点
	for (var i = 0; i < faces.length; i++) {
		points.push(vertices[faces[i]][0], vertices[faces[i]][1], vertices[faces[i]][2]);
		colors.push(vertexColors[Math.floor(i / 4)][0], vertexColors[Math.floor(i / 4)][1], vertexColors[Math.floor(i /
			4)][2], vertexColors[Math.floor(i / 4)][3]);
	}
}

function render() {
	// console.log(points.length);
	// console.log(colors.length);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	theta[axis] += 0.1;
	gl.uniform3fv(thetaLoc, theta);
	//更新偏移量
	gl.uniform3fv(scaleLoc, scale);
	
	for(var i=0; i<points.length/3; i+=4) {
		gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
	}

	requestAnimFrame(render);
}

function addEvent() {
	document.getElementById("rotateX").onclick = function() {
		axis = xAxis;
	}
	
	document.getElementById("rotateY").onclick = function() {
		axis = yAxis;
	}
	
	document.getElementById("rotateZ").onclick = function() {
		axis = zAxis;
	}
	
	document.getElementById("X_Scale").onchange=function(event) {
		scale[0]=event.target.value/100;
		// console.log(scale);
	}
	document.getElementById("Y_Scale").onchange=function(event) {
		scale[1]=event.target.value/100;
		// console.log(scale);
	}
	document.getElementById("Z_Scale").onchange=function(event) {
		scale[2]=event.target.value/100;
		// console.log(scale);
	}
}