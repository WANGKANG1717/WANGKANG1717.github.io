/**
 * kang
 * 2021/10/30
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
//控制旋转
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [0, 0, 0];
var thetaLoc;
var alpha = [0, 0, 0];
//控制旋平移
var offset = vec3.fromValues(0, 0, 0);
var offsetLoc;
//控制缩放
var scale = vec3.fromValues(1, 1, 1);
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
	offsetLoc = gl.getUniformLocation(program, "offset");
	gl.uniform3fv(offsetLoc, offset);
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

	var faces = [
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
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	theta[0] += alpha[0];
	theta[1] += alpha[1];
	// theta[2]+=alpha[2];
	gl.uniform3fv(thetaLoc, theta);
	//更新位移
	gl.uniform3fv(offsetLoc, offset);
	//更新缩放
	gl.uniform3fv(scaleLoc, scale);
	// console.log(points.length/3);
	for (var i = 0; i < points.length/3; i += 4) {
		gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
	}

	requestAnimFrame(render);
}

//监听鼠标点击次数
var ctrl = false;
var shift = false;
var flag = false;

function addEvent() {
	//监听鼠标点击事件
	canvas.addEventListener("click", function(event) {
		var rect = canvas.getBoundingClientRect();
		var cX = event.clientX - rect.left;
		var cY = event.clientY - rect.top;
		// console.log(cX+" "+cY+" "+rect.left+" "+rect.top);
		var pre_t = vec2.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height);
		if (pre_t[1] > 0.5) {
			alpha[0] += 0.04;
		} else if (pre_t[1] < -0.5) {
			alpha[0] -= 0.04;
		} else if (pre_t[0] < -0.5) {
			alpha[1] += 0.04;
		} else if (pre_t[0] > 0.5) {
			alpha[1] -= 0.04;
		}
		// console.log(alpha);
	});
	//鼠标按下
	canvas.addEventListener("mousedown", function(event) {
		flag = true;
		var rect = canvas.getBoundingClientRect();
		var cX = event.clientX - rect.left;
		var cY = event.clientY - rect.top;
		// console.log(cX+" "+cY+" "+rect.left+" "+rect.top);
		pre_t = vec2.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height);
	});
	//鼠标双击
	canvas.addEventListener("dblclick", function(event) {
		alpha = [0, 0, 0];
		// console.log(alpha);
	});
	//鼠标释放
	canvas.addEventListener("mouseup", function(event) {
		flag = false;
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
		if (flag && !ctrl) {
			//修正鼠标的位置
			//使canvas的中心为坐标原点
			var rect = canvas.getBoundingClientRect();
			var cX = event.clientX - rect.left;
			var cY = event.clientY - rect.top;
			// console.log(cX+" "+cY+" "+rect.left+" "+rect.top);
			var t = vec2.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height);
			// console.log(t);
			alpha[0] = t[1] / 10;
			alpha[1] = -t[0] / 10;
		} else if (flag && ctrl) {
			// console.log("bbb");
			var rect = canvas.getBoundingClientRect();
			var cX = event.clientX - rect.left;
			var cY = event.clientY - rect.top;
			var t = vec2.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height);
			offset[0] = t[0];
			offset[1] = t[1];
		}
	});
	//鼠标滚轮控制缩放
	canvas.addEventListener("mousewheel", function(event) {
		if (shift) {
			scale[0] += event.wheelDelta / 1200;
			scale[1] += event.wheelDelta / 1200;
		}
	});
}
