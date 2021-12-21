/**
 * @author WK
 * @Date 2021/11/18
 * @Email 1686617586@qq.com
 */
const {
	vec2,
	vec3,
	vec4,
	mat3,
	mat4,
	quat
} = glMatrix;

var canvas;
var gl;
var program;
var vBuffer, cBuffer;

var maxNumTri = 1000000; //可以绘制的三角形的最大数目
var maxNumPoi = maxNumTri * 3; //最大点数
var index = 0;

var mvMatrixLoc;
var mvMatrix = mat4.create();
var pjMatrixLoc;
var pjMatrix = mat4.create();

var Count = 6;
var Theta = vec3.fromValues(0, 0, 0);
var Offset = vec3.fromValues(0, 0, 0);
var Scale = vec3.fromValues(0.5, 0.5, 0.5);

//-------------------初始化函数-------------------------------
function init() {
	canvas = document.getElementById("webgl");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	//开启隐藏面消除算法
	gl.enable(gl.DEPTH_TEST);
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	//
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 12 * maxNumPoi, gl.STATIC_DRAW); //申请缓存空间
	//
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	//
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumPoi, gl.STATIC_DRAW);
	//
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	//添加y圆
	addBall(Count);
	//添加事件
	addEvent();

	render();
};
//------------------render函数-----------------------
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	initMatrix();
	gl.drawArrays(gl.TRIANGLES, 0, index);
	requestAnimFrame(render);
}
//------------------render函数end-----------------------
var vertices = [
	vec3.fromValues(0.0, 0.0, -1.0),
	vec3.fromValues(0.0, 0.942809, 0.333333),
	vec3.fromValues(-0.816497, -0.471405, 0.333333),
	vec3.fromValues(0.816497, -0.471405, 0.333333),
];
//顶点颜色矩阵
var vertexColors = [
	// vec4.fromValues(0.0, 0.0, 0.0, 1.0),
	vec4.fromValues(1.0, 0.0, 0.0, 1.0),
	vec4.fromValues(1.0, 1.0, 0.0, 1.0),
	vec4.fromValues(0.0, 1.0, 0.0, 1.0),
	vec4.fromValues(0.0, 0.0, 1.0, 1.0),
	vec4.fromValues(1.0, 0.0, 1.0, 1.0),
	vec4.fromValues(0.0, 1.0, 1.0, 1.0),
	vec4.fromValues(1.0, 1.0, 1.0, 1.0)
];

function addBall(count) {
	divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], count);
}

function divideTetra(a, b, c, d, n) {
	// console.log(n);
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, n) {
	if (n == 0) {
		pushPoints(a, b, c);
		return;
	} else {
		var ab = normalize(mix(a, b));
		var ac = normalize(mix(a, c));
		var bc = normalize(mix(b, c));
		// console.log(n);
		divideTriangle(a, ab, ac, n - 1);
		divideTriangle(ab, b, bc, n - 1);
		divideTriangle(bc, c, ac, n - 1);
		divideTriangle(ab, bc, ac, n - 1);
	}
}

function mix(a, b) {
	var ab = vec3.create();
	vec3.add(ab, a, b);
	vec3.scale(ab, ab, 0.5);
	return ab;
}

function normalize(a) {
	vec3.normalize(a, a);
	return a;
}

function pushPoints(a, b, c) {
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index, new Float32Array(a));
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 1), new Float32Array(b));
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 2), new Float32Array(c));
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, new Float32Array(vertexColors[index % 7]));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 1), new Float32Array(vertexColors[index % 7]));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 2), new Float32Array(vertexColors[index % 7]));
	index += 3;
}

function initMatrix() {
	eye = vec3.fromValues(0.0, 0.0, 0.0);
	at = vec3.fromValues(0.0, 0.0, 0.0);
	up = vec3.fromValues(0.0, 1.0, 0.0);
	mat4.lookAt(mvMatrix, eye, at, up);
	mat4.translate(mvMatrix, mvMatrix, Offset);
	//旋转
	mat4.rotateZ(mvMatrix, mvMatrix, Theta[0] * Math.PI / 180.0);
	mat4.rotateY(mvMatrix, mvMatrix, Theta[1] * Math.PI / 180.0);
	mat4.rotateX(mvMatrix, mvMatrix, Theta[2] * Math.PI / 180.0);
	//缩放
	mat4.scale(mvMatrix, mvMatrix, Scale);
	mvMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	gl.uniformMatrix4fv(mvMatrixLoc, false, new Float32Array(mvMatrix));
	//
	mat4.ortho(pjMatrix, -1.0, 1.0, -1.0, 1.0, 1, -1);
	pjMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(pjMatrixLoc, false, new Float32Array(pjMatrix));
	// console.log(mvMatrix.toString());
	// console.log(pjMatrix.toString());
}
//-------------------------------------------添加事件-----------
var ctrl = false; //ctrl按下
var shift = false;	//shift键
var mouseDown = false; //鼠标按下
var lastMouse = vec2.fromValues(0.0, 0.0);

function addEvent() {
	//鼠标按下
	canvas.addEventListener("mousedown", function(event) {
		mouseDown = true;
		var cX = event.clientX;
		var cY = event.clientY;
		lastMouse = vec2.fromValues(cX, cY);
	});
	//鼠标释放
	canvas.addEventListener("mouseup", function(event) {
		mouseDown = false;
	});
	//ctrl键按下
	document.getElementById("BODY").onkeydown = function(event) {
		// console.log(event.keyCode);
		if (event.keyCode == 17) {
			ctrl = true;
		} else ctrl = false;
		if (event.keyCode == 16) {
			shift = true;
		} else shift = false;
	}
	document.getElementById("BODY").onkeyup = function(event) {
		ctrl = false;
		shift = false;
	}
	//鼠标移动
	canvas.addEventListener("mousemove", function(event) {
		if (!mouseDown) return;
		if (ctrl) {
			var cX = event.clientX;
			var cY = event.clientY;
			var newMouse = vec2.fromValues(cX, cY);
			var deltaX = (newMouse[0] - lastMouse[0]);
			var deltaY = (newMouse[1] - lastMouse[1]);
			Theta[0] = Theta[0] - parseFloat(deltaY);
			Theta[1] = Theta[1] - parseFloat(deltaX);
			//
			lastMouse[0] = newMouse[0];
			lastMouse[1] = newMouse[1];
		} else { //鼠标按下
			var rect = canvas.getBoundingClientRect();
			var cX = event.clientX - rect.left;
			var cY = event.clientY - rect.top;
			pos = vec3.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height, 0.0);
			Offset[0] = pos[0];
			Offset[1] = pos[1];
		}
	});
	//鼠标滚轮控制缩放
	canvas.addEventListener("mousewheel", function(event) {
		if (shift) {
			Scale[0] += event.wheelDelta / 1200;
			Scale[1] += event.wheelDelta / 1200;
			Scale[2] += event.wheelDelta / 1200;
		}
	});
}
