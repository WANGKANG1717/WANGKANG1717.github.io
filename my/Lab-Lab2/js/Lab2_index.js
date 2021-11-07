/* *
 * kang
 * 2021/10/9
 */
const {
	vec3,
	vec2
} = glMatrix;

var gl;
var points = [];
var colors = [];
//
var dimension; //维数
var rotate_way; //旋转方式
var fill; //是否填充
var count; //剖分层次
var angle; //角度
//
var play_flag; //是否旋转
var angle_min; //动画旋转开始角度
var angle_max; //动画旋转结束角度
var time_slot; //旋转时间间隔
//
var R, G, B; //颜色
///////////////////////////////////////////////////////////////////////////////////////////////////////
//二维绘制
function init2() {
	var canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	var vertices = [
		vec2.fromValues(0, 1.0),
		vec2.fromValues(-0.86602540378, -0.5),
		vec2.fromValues(0.86602540378, -0.5)
	];
	var a = vertices[0];
	var b = vertices[1];
	var c = vertices[2];
	//
	points = [];
	colors = [];
	//旋转
	// console.log(angle);
	if (rotate_way == 1 && fill == 1) {
		a = rotateTriangle2(a, angle);
		b = rotateTriangle2(b, angle);
		c = rotateTriangle2(c, angle);
		divideTriangleFill1(a, b, c, count);
	} else if (rotate_way == 2 && fill == 1) {

		divideTriangleFill1(a, b, c, count);
		rotate2(angle);
	} else if (rotate_way == 1 && fill == 2) {
		a = rotateTriangle2(a, angle);
		b = rotateTriangle2(b, angle);
		c = rotateTriangle2(c, angle);
		divideTriangleFill2(a, b, c, count);
	} else if (rotate_way == 2 && fill == 2) {
		divideTriangleFill2(a, b, c, count);
		rotate2(angle);
	}

	// Configure WebGL
	gl.viewport(30, 30, canvas.width - 60, canvas.height - 60);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	//vPosition
	var vbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
	//
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	//Color
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	//
	var aColor = gl.getAttribLocation(program, "aColor");
	gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(aColor);

	renderPoints();
};

function divideTriangleFill1(a, b, c, count) {
	if (count == 0) {
		points.push(a[0], a[1], b[0], b[1], c[0], c[1]);
		colors.push(R, G, B, R, G, B, R, G, B);
		return;
	} else {
		var ab = mix2(a, b);
		// console.log(a);
		// console.log(b);
		// console.log(ab);
		var ac = mix2(a, c);
		var bc = mix2(b, c);
		count--;
		divideTriangleFill1(a, ab, ac, count);
		divideTriangleFill1(b, ab, bc, count);
		divideTriangleFill1(c, ac, bc, count);
	}
}

function divideTriangleFill2(a, b, c, count) {
	if (count == 0) {
		points.push(a[0], a[1], b[0], b[1]);
		points.push(b[0], b[1], c[0], c[1]);
		points.push(c[0], c[1], a[0], a[1]);
		colors.push(R, G, B, R, G, B, R, G, B, R, G, B, R, G, B, R, G, B);
		return;
	} else {
		var ab = mix2(a, b);
		var ac = mix2(a, c);
		var bc = mix2(b, c);
		count--;
		divideTriangleFill2(a, ab, ac, count);
		divideTriangleFill2(b, ab, bc, count);
		divideTriangleFill2(c, ac, bc, count);
		divideTriangleFill2(ab, ac, bc, count);
	}
}

function mix2(a, b) {
	var ab = vec2.create();
	vec2.add(ab, a, b);
	vec2.scale(ab, ab, 0.5);
	return ab;
}

function rotateTriangle2(dot, angle) {
	var theta = angle * Math.PI / 180.0;
	var a = dot[0];
	var b = dot[1];
	var c = a * Math.cos(theta) + b * Math.sin(theta);
	var d = b * Math.cos(theta) - a * Math.sin(theta);
	return vec2.fromValues(c, d);
}

function rotate2(angle) {
	for (var i = 0; i < points.length; i += 2) {
		var angle2 = getAngle(points[i], points[i + 1]);
		var tmp = rotateTriangle2(vec2.fromValues(points[i], points[i + 1]), angle2);
		points[i] = tmp[0];
		points[i + 1] = tmp[1];
	}
}

function getAngle(a, b) {
	var length = Math.sqrt(a * a + b * b);
	angle2 = angle * length / 1;
	return angle2;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
//三维绘制
function init3() {
	var canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	//三维通用数组
	var vertices = [
		0.0000, 0.0000, -1.0000,
		0.0000, 0.9428, 0.3333,
		-0.8165, -0.4714, 0.3333,
		0.8165, -0.4714, 0.3333
	];
	var a = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
	var b = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
	var c = vec3.fromValues(vertices[6], vertices[7], vertices[8]);
	var d = vec3.fromValues(vertices[9], vertices[10], vertices[11]);
	//
	points = [];
	colors = [];
	if (rotate_way == 1 && fill == 1) {
		a = rotateTriangle3(a, angle);
		b = rotateTriangle3(b, angle);
		c = rotateTriangle3(c, angle);
		d = rotateTriangle3(d, angle);
		divideTetra1(a, b, c, d, count);
	} else if (rotate_way == 2 && fill == 1) {
		divideTetra1(a, b, c, d, count);
		rotate3(angle);
	} else if (rotate_way == 1 && fill == 2) {
		a = rotateTriangle3(a, angle);
		b = rotateTriangle3(b, angle);
		c = rotateTriangle3(c, angle);
		d = rotateTriangle3(d, angle);
		divideTetra2(a, b, c, d, count);
	} else if (rotate_way == 2 && fill == 2) {
		divideTetra2(a, b, c, d, count);
		rotate3(angle);
	}
	// console.log(colors);
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	//开启隐藏面消除算法
	gl.enable(gl.DEPTH_TEST);
	// load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// load data into the gpu
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

	// associate external shader variables with data buffer 
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	//
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	//
	var aColor = gl.getAttribLocation(program, "aColor");
	// console.log(aColor);
	gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(aColor);
	// console.log(points);
	renderPoints();
};

function mix3(a, b) {
	var ab = vec3.create();
	vec3.lerp(ab, a, b, 0.5);
	return ab;
}

function divideTetra1(a, b, c, d, count) {
	if (count == 0) {
		tetra1(a, b, c, d);
		return;
	} else {
		var ab = mix3(a, b);
		var ac = mix3(a, c);
		var ad = mix3(a, d);
		var bc = mix3(b, c);
		var bd = mix3(b, d);
		var cd = mix3(c, d);
		count--;
		divideTetra1(a, ab, ac, ad, count);
		divideTetra1(ab, b, bc, bd, count);
		divideTetra1(ac, bc, c, cd, count);
		divideTetra1(ad, bd, cd, d, count);
	}
}

function tetra1(a, b, c, d) {
	push1(a, c, b, 0); //左红
	push1(a, c, d, 1); //下绿
	push1(a, b, d, 2); //右蓝
	push1(b, c, d, 3); //底
}

function push1(a, b, c, flag) {
	var baseColor = [
		vec3.fromValues(1, 0, 0),
		vec3.fromValues(0, 1, 0),
		vec3.fromValues(0, 0, 1),
		vec3.fromValues(0, 0, 0),
	];
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(a[0], a[1], a[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(b[0], b[1], b[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(c[0], c[1], c[2]);
}
//////
function divideTetra2(a, b, c, d, count) {
	if (count == 0) {
		tetra2(a, b, c, d);
		return;
	} else {
		var ab = mix3(a, b);
		var ac = mix3(a, c);
		var ad = mix3(a, d);
		var bc = mix3(b, c);
		var bd = mix3(b, d);
		var cd = mix3(c, d);
		count--;
		divideTetra2(a, ab, ac, ad, count);
		divideTetra2(ab, b, bc, bd, count);
		divideTetra2(ac, bc, c, cd, count);
		divideTetra2(ad, bd, cd, d, count);

	}
}

function tetra2(a, b, c, d) {
	push2(a, c, b, 0);
	push2(a, c, d, 1);
	push2(a, b, d, 2);
	push2(b, c, d, 3);
}

function push2(a, b, c, flag) {
	var baseColor = [
		vec3.fromValues(1, 0, 0),
		vec3.fromValues(0, 1, 0),
		vec3.fromValues(0, 0, 1),
		vec3.fromValues(0, 0, 0),
	];
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(a[0], a[1], a[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(b[0], b[1], b[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(a[0], a[1], a[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(c[0], c[1], c[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(b[0], b[1], b[2]);
	colors.push(baseColor[flag][0], baseColor[flag][1], baseColor[flag][2]);
	points.push(c[0], c[1], c[2]);
}

function rotateTriangle3(dot, angle) {
	var theta = angle * Math.PI / 180.0;
	var a = dot[0];
	var b = dot[1];
	var c = a * Math.cos(theta) + b * Math.sin(theta);
	var d = b * Math.cos(theta) - a * Math.sin(theta);
	return vec3.fromValues(c, d, dot[2]);
}

function rotate3(angle) {
	for (var i = 0; i < points.length; i += 3) {
		var angle3 = getAngle(points[i], points[i + 1], points[i + 2]);
		var tmp = rotateTriangle3(vec3.fromValues(points[i], points[i + 1], points[i + 2]), angle3);
		points[i] = tmp[0];
		points[i + 1] = tmp[1];
		points[i + 2] = tmp[2];
	}
}

function renderPoints() {
	if (dimension == 2) {
		gl.clear(gl.COLOR_BUFFER_BIT);
	} else if (dimension == 3) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	if (dimension == 2 && fill == 1) {
		gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
	} else if (dimension == 2 && fill == 2) {
		gl.drawArrays(gl.LINES, 0, points.length / 2);
	} else if (dimension == 3 && fill == 1) {
		gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
	} else if (dimension == 3 && fill == 2) {
		gl.drawArrays(gl.LINES, 0, points.length / 3);
	}
}

function DrawTriangle() {
	dimension = parseInt(myform.Dimension.value);
	rotate_way = parseInt(myform.Rotate.value);
	fill = parseInt(myform.Fill.value);
	console.log("dimension" + dimension);
	count = parseInt(myform.Count.value);
	angle = parseInt(myform.Angle.value);
	//
	play_flag = parseInt(myform.Play.value);
	angle_min = parseInt(myform.Angle_min.value);
	angle_max = parseInt(myform.Angle_max.value);
	time_slot = parseInt(myform.Time_slot.value);
	// console.log(play_flag);
	// console.log(angle_min);
	// console.log(angle_max);
	// console.log(time_slot);
	// console.log(rotate_way);
	R = parseFloat(myform.R.value);
	G = parseFloat(myform.G.value);
	B = parseFloat(myform.B.value);
	R /= 255.0;
	G /= 255.0;
	B /= 255.0;
	// console.log(R+" "+G+" "+B);
	if (count < 0 || (R < 0 || G < 0 || B < 0 || R > 255 || G > 255 || B > 255) || (angle_min > angle_max ||
			time_slot <= 0)) {
		document.getElementById("Triangle").innerHTML = "Are you kiding me?";
		return;
	} else if (count >= 10) {
		document.getElementById("Triangle").innerHTML = "what are you doing?<br/><br/><br/><br/>剖分层次应小于10";
		return;
	}
	if (play_flag == 1) {
		angle = angle_min;
		var repeat = window.setInterval(Play_repeat, time_slot);
		var count_repeat=0;
		//看来这个函数最好是局部变量，和局部函数中使用，不容易出问题
		function Play_repeat() {
			console.log(angle + " " + angle_max + " " + time_slot);
			if (angle >= angle_max) {
				window.clearInterval(repeat);
				return;
			} else {
				if(count>60) {
					gl.getExtension('WEBGL_lose_context').loseContext();
					count_repeat=0;
					//每隔一段时间就清空以下，防止出现bug
				}
				if (dimension == 2) {
					document.getElementById("Triangle").innerHTML =
						"<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init2()\"></canvas>";
				} else if (dimension == 3) {
					document.getElementById("Triangle").innerHTML =
						"<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init3()\"></canvas>";
				}

				///自动触发事件
				(() => {
					var e = document.createEvent("MouseEvents");
					e.initEvent("click", true, true);
					document.getElementById("webgl").dispatchEvent(e);
				})();
				angle++;
				count_repeat++;
			}
		}
	} else if (play_flag == 2) {
		Play_once();
	}
}

function Play_once() {
	if (dimension == 2) {
		document.getElementById("Triangle").innerHTML =
			"<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init2()\"></canvas>";
	} else if (dimension == 3) {
		document.getElementById("Triangle").innerHTML =
			"<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init3()\"></canvas>";
	}

	///自动触发事件
	(() => {
		var e = document.createEvent("MouseEvents");
		e.initEvent("click", true, true);
		document.getElementById("webgl").dispatchEvent(e);
	})();
}
