/* *
 * kang
 * 2021/10/31
 * 如要借鉴，请注明作者
 */
/**
 * 经过构思
 * 我决定使用分类绘制的方法
 * 这样可以方便将将各种图案区分开
 * 并且，便于实现每个图形的动画交互
 * 后面才发现这是个绝妙的点子
 * 非常棒的架构！
 */
const {
	vec2,
	vec3,
	vec4
} = glMatrix;

var canvas;
var gl;
var program;
var vBuffer, cBuffer;
//
var points = [];
var colors = [];
//控制旋转
var theta = [0, 0, 0];
var theta_p = 0.001;
var thetaLoc;
//控制旋平移
var offset = vec3.fromValues(0, 0, 1.2);
var offsetLoc;
//控制缩放
var scale = vec3.fromValues(1.7, 1.7, 1);
var scaleLoc;
//
var maxNumTri = 1000000; //可以绘制的三角形的最大数目
var maxNumPoi = maxNumTri * 3; //最大点数
var index = 0;

//----------------背景绘制数据----------------------
/**
 * 经过不懈的调试，终于得到我还算满意的背景！！！！！
 */
var bgTetra = [
	vec3.fromValues(0.0000, 0.0000, -1.0000),
	vec3.fromValues(0.0000, 0.9428, 0.3333),
	vec3.fromValues(-0.8165, -0.4714, 0.3333),
	vec3.fromValues(0.8165, -0.4714, 0.3333)
];
var baseColor = [
	vec4.fromValues(1, 0, 0, 1),
	vec4.fromValues(0, 1, 0, 1),
	vec4.fromValues(0, 0, 1, 1),
	vec4.fromValues(0, 0, 0, 1),
];
var count = 7;
var angle = 520;
var bg_index;
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
	//开启了这个算法，会导致二维图形绘制不出来
	//所以，要绘制二维的图形的话，智只能用三维的代替了，我晕，气死！！！！！
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
	//
	var a = bgTetra[0];
	var b = bgTetra[1];
	var c = bgTetra[2];
	var d = bgTetra[3];
	//----------------------------- 初始化背景---------------------
	divideTetra(a, b, c, d, count);
	bg_index = index;
	//----------------------------- 初始化变量-----------
	thetaLoc = gl.getUniformLocation(program, "theta");
	gl.uniform3fv(thetaLoc, theta);
	//
	offsetLoc = gl.getUniformLocation(program, "offset");
	gl.uniform3fv(offsetLoc, offset);
	//
	scaleLoc = gl.getUniformLocation(program, "scale");
	gl.uniform3fv(scaleLoc, scale);
	//---------------------------添加事件----------------------------
	addEvent();

	render();
};
//-------------------初始化函数end-------------------------------

//------------------render函数-----------------------
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//---------背景绘制
	theta[2] += theta_p;
	gl.uniform3fv(thetaLoc, theta);
	gl.uniform3fv(scaleLoc, scale);
	gl.uniform3fv(offsetLoc, offset);
	gl.drawArrays(gl.TRIANGLES, 0, bg_index);
	//----------三角形绘制
	gl.uniform3fv(thetaLoc, vec3.fromValues(0, 0, 0));
	for (var i = 0; i < TriIndex.length; i++) {
		//更新缩放
		TriScale[i][0] += (TriScaleFlag[i] * 0.01);
		TriScale[i][1] += (TriScaleFlag[i] * 0.01);
		if (TriScale[i][0] > 2 * scale_tri) {
			TriScale[i][0] = 2 * scale_tri;
			TriScale[i][1] = 2 * scale_tri;
			TriScaleFlag[i] *= -1;
		} else if (TriScale[i][0] < 0.5 * scale_tri) {
			TriScale[i][0] = 0.5 * scale_tri;
			TriScale[i][1] = 0.5 * scale_tri;
			TriScaleFlag[i] *= -1;
		}
		gl.uniform3fv(scaleLoc, TriScale[i]);
		gl.uniform3fv(offsetLoc, TriOffset[i]);
		gl.drawArrays(gl.TRIANGLES, TriIndex[i], 12);
	}
	//----------正方形绘制
	// console.log(SquIndex);
	for (var i = 0; i < SquIndex.length; i++) {
		gl.uniform3fv(scaleLoc, SquScale[i]);
		gl.uniform3fv(offsetLoc, SquOffset[i]);
		SquTheta[i][2] += SquTheta_speed[i];
		gl.uniform3fv(thetaLoc, SquTheta[i]);
		for (var j = SquIndex[i]; j < SquIndex[i] + 24; j += 4) {
			gl.drawArrays(gl.TRIANGLE_FAN, j, 4);
		}
	}
	//----------立方体绘制
	for (var i = 0; i < CubeIndex.length; i++) {
		gl.uniform3fv(scaleLoc, CubeScale[i]);
		gl.uniform3fv(offsetLoc, CubeOffset[i]);
		CubeTheta[i][0] += CubeTheta_speed[0];
		CubeTheta[i][1] += CubeTheta_speed[1];
		CubeTheta[i][2] += CubeTheta_speed[2];
		gl.uniform3fv(thetaLoc, CubeTheta[i]);
		for (var j = CubeIndex[i]; j < CubeIndex[i] + 24; j += 4) {
			gl.drawArrays(gl.TRIANGLE_FAN, j, 4);
		}
	}
	//----------圆绘制
	for (var i = 0; i < CircleIndex.length; i++) {
		gl.uniform3fv(scaleLoc, CircleScale[i]);
		CircleOffset[i][0] += CircleX[i] * Circleoffset_speed[i][0];
		CircleOffset[i][1] += CircleY[i] * Circleoffset_speed[i][1];
		if (CircleOffset[i][0] > 1 || CircleOffset[i][0] < -1) CircleX[i] *= -1;
		if (CircleOffset[i][1] > 1 || CircleOffset[i][1] < -1) CircleY[i] *= -1;
		gl.uniform3fv(offsetLoc, CircleOffset[i]);
		gl.uniform3fv(thetaLoc, CircleTheta[i]);
		gl.drawArrays(gl.TRIANGLE_FAN, CircleIndex[i], CircleNums[i]);
	}

	requestAnimFrame(render);
}
//------------------render函数end-----------------------

//------------------背景三角型绘制--------------
function divideTetra(a, b, c, d, count) {
	if (count == 0) {
		tetra(a, b, c, d);
		return;
	} else {
		var ab = mix(a, b);
		var ac = mix(a, c);
		var ad = mix(a, d);
		var bc = mix(b, c);
		var bd = mix(b, d);
		var cd = mix(c, d);
		count--;
		divideTetra(a, ab, ac, ad, count);
		divideTetra(ab, b, bc, bd, count);
		divideTetra(ac, bc, c, cd, count);
		divideTetra(ad, bd, cd, d, count);
	}
}

function mix(a, b) {
	var ab = vec3.create();
	vec3.lerp(ab, a, b, 0.5);
	return ab;
}

function tetra(a, b, c, d) {
	push(a, c, b, 0);
	push(a, c, d, 1);
	push(a, b, d, 2);
	push(b, c, d, 3);
}

function push(a, b, c, flag) {
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	a = rotateTriangle3(a);
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index, new Float32Array(a));
	b = rotateTriangle3(b);
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 1), new Float32Array(b));
	c = rotateTriangle3(c);
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 2), new Float32Array(c));
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, new Float32Array(baseColor[flag]));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 1), new Float32Array(baseColor[flag]));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 2), new Float32Array(baseColor[flag]));
	index += 3;
}

function rotateTriangle3(dot) {
	var angle3 = getAngle(dot[0], dot[1]);
	var theta = angle3 * Math.PI / 180.0;
	var a = dot[0];
	var b = dot[1];
	var c = a * Math.cos(theta) + b * Math.sin(theta);
	var d = b * Math.cos(theta) - a * Math.sin(theta);
	return vec3.fromValues(c, d, dot[2]);
}

function getAngle(a, b) {
	var length = Math.sqrt(a * a + b * b);
	angle3 = angle * length / 1;
	return angle3;
}
//------------------背景三角型绘制end--------------

//-----------------------界面操作部分-----------------------------
var pos = vec2.fromValues(0, 0);
var num1 = false;
var num2 = false;
var num3 = false;
var num4 = false;
var color = vec4.fromValues(0, 1, 1, 1);

function addEvent() {
	//监听鼠标点击事件
	canvas.addEventListener("click", function(event) {
		var rect = canvas.getBoundingClientRect();
		var cX = event.clientX - rect.left;
		var cY = event.clientY - rect.top;
		// console.log(cX+" "+cY+" "+rect.left+" "+rect.top);
		pos = vec3.fromValues(2 * cX / canvas.width - 1, 1 - 2 * cY / canvas.height, 0.0);
		// console.log(pos);
		if (num1 && !num2 && !num3 && !num4) {
			addTriangle(pos);
		} else if (num2 && !num1 && !num3 && !num4) {
			addSquare(pos);
		} else if (num3 && !num1 && !num2 && !num4) {
			addCube(pos);
		} else if (num4 && !num2 && !num3 && !num1) {
			addCircle(pos);
		} else if (!num1 && !num2 && !num3 && !num4) {
			var random = parseInt(Math.random() * 4);
			// console.log(random);
			if (random == 0) {
				addTriangle(pos);
			} else if (random == 1) {
				addSquare(pos);
			} else if (random == 2) {
				addCube(pos);
			} else if (random == 3) {
				addCircle(pos);
			}
		}
	});
	//监控数字键按下
	document.getElementById("BODY").onkeydown = function(event) {
		// console.log(event.keyCode);
		if (event.keyCode == 97 || event.keyCode == 49) {
			num1 = true;
		} else if (event.keyCode == 98 || event.keyCode == 50) {
			num2 = true;
		} else if (event.keyCode == 99 || event.keyCode == 51) {
			num3 = true;
		} else if (event.keyCode == 100 || event.keyCode == 52) {
			num4 = true;
		}
		// console.log(num1+" "+num2+" "+num3+" "+num4);
	}
	document.getElementById("BODY").onkeyup = function(event) {
		num1 = false;
		num2 = false;
		num3 = false;
		num4 = false;
	}
	//监控取色器
	//因为获取到的取色器中的值是标准形式，这里需要进行转换
	document.getElementById("objcolor").onchange = function(event) {
		color = event.target.value;
		var R = parseInt(color[1], 16) * 16 + parseInt(color[2], 16);
		var G = parseInt(color[3], 16) * 16 + parseInt(color[4], 16);
		var B = parseInt(color[5], 16) * 16 + parseInt(color[6], 16);
		// console.log(R+" "+G+" "+B);
		R /= 255.0;
		G /= 255.0;
		B /= 255.0;
		color = vec4.fromValues(R, G, B, 1.0);
	}
	//三角
	document.getElementById("Scale").onchange = function(event) {
		scale_tri = event.target.value;
	}
	//正方形
	document.getElementById("Size").onchange = function(event) {
		scale_squ = event.target.value;
	}
	document.getElementById("Square_speed").onchange = function(event) {
		speed_squ = event.target.value;
	}
	//立方体
	document.getElementById("rotateX").onclick = function(event) {
		CubeTheta_speed[0] += 0.05;
	}
	document.getElementById("rotateX").ondblclick = function(event) {
		CubeTheta_speed[0] -= 0.15;
	}
	document.getElementById("rotateY").onclick = function(event) {
		CubeTheta_speed[1] += 0.05;
	}
	document.getElementById("rotateY").ondblclick = function(event) {
		CubeTheta_speed[1] -= 0.15;
	}
	document.getElementById("rotateZ").onclick = function(event) {
		CubeTheta_speed[2] += 0.05;
	}
	document.getElementById("rotateZ").ondblclick = function(event) {
		CubeTheta_speed[2] -= 0.15;
	}
	//圆
	document.getElementById("CircleEdge").onchange = function(event) {
		CircleEdge = event.target.value;
	}
	document.getElementById("Circle_speed").onchange = function(event) {
		Circle_speed = event.target.value / 200;
	}
	document.getElementById("OffsetAlpha").onchange = function(event) {
		offsetAlpha = event.target.value * Math.PI / 180
	}
	//清空
	document.getElementById("clear").onclick = function(event) {
		clear();
	}
}
//-----------------------界面操作部分end-----------------------------

//-----------------------正三角形绘制----------------------------------
//这里我怕采用在着色器中进行绘制会产生我无法控制的情况   //主要还是对着色器不太熟
//所以我才用先生成数据，在想着色器进行传送
var scale_tri = 1.0;
var TriIndex = []; //每个三角形12个点
var TriScale = []; //记录每个三角形的缩放
var TriScaleFlag = []; //记录放大缩小标记
var TriOffset = []; //记录偏移量
function addTriangle(pos) {
	TriIndex.push(index);
	TriScale.push(vec3.fromValues(1 * scale_tri, 1 * scale_tri, 1));
	TriScaleFlag.push(1);
	TriOffset.push(pos);
	var Tri = [
		vec3.fromValues(0.0000, 0.0000, -1.0000),
		vec3.fromValues(0.0000, 0.09428, 0.3333),
		vec3.fromValues(-0.08165, -0.04714, 0.3333),
		vec3.fromValues(0.08165, -0.04714, 0.3333)
	];
	var a = Tri[0];
	var b = Tri[1];
	var c = Tri[2];
	var d = Tri[3];
	push2(a, c, b);
	push2(a, c, d);
	push2(a, b, d);
	push2(b, c, d);
}

function push2(a, b, c) {
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index, new Float32Array(a));
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 1), new Float32Array(b));
	gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + 2), new Float32Array(c));
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, new Float32Array(color));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 1), new Float32Array(color));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 2), new Float32Array(color));
	index += 3;
}
//-----------------------立方体数据-----------------
//顶点矩阵
var vertices = [
	vec3.fromValues(-0.5, -0.5, 0.5),
	vec3.fromValues(-0.5, 0.5, 0.5),
	vec3.fromValues(0.5, 0.5, 0.5),
	vec3.fromValues(0.5, -0.5, 0.5),
	vec3.fromValues(-0.5, -0.5, -0.5),
	vec3.fromValues(-0.5, 0.5, -0.5),
	vec3.fromValues(0.5, 0.5, -0.5),
	vec3.fromValues(0.5, -0.5, -0.5),
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
var faces = [
	1, 0, 3, 2,
	2, 3, 7, 6,
	3, 0, 4, 7,
	6, 5, 1, 2,
	4, 5, 6, 7,
	5, 4, 0, 1,
];
//--------------------------正方形绘制--------------------------
var scale_squ = 1;
var speed_squ = 50;
var SquIndex = [];
var SquScale = [];
var SquOffset = [];
var SquTheta = [];
var SquTheta_speed = [];

function addSquare(pos) {
	SquIndex.push(index);
	SquScale.push(vec3.fromValues(scale_squ / 5, scale_squ / 5, 1));
	SquOffset.push(pos);
	SquTheta.push(vec3.fromValues(0, 0, 0));
	SquTheta_speed.push(speed_squ / 1000);
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	for (var i = 0; i < faces.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + i), new Float32Array(vertices[faces[i]]));
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	for (var i = 0; i < faces.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(color));
	}
	index += 24;
}

//------------------------------立方体------------------------
var scale_cube = 1;
var CubeIndex = [];
var CubeScale = [];
var CubeOffset = [];
var CubeTheta = [];
var CubeTheta_speed = vec3.fromValues(0.01, 0.01, 0);

function addCube(pos) {
	CubeIndex.push(index);
	CubeScale.push(vec3.fromValues(scale_cube / 5, scale_cube / 5, 1));
	CubeOffset.push(pos);
	CubeTheta.push(vec3.fromValues(0, 0, 0));
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	for (var i = 0; i < faces.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + i), new Float32Array(vertices[faces[i]]));
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	for (var i = 0; i < faces.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(vertexColors[Math.floor(i / 4)]));
	}
	index += 24;
}

//---------------------------------圆--------------------------------
var scale_circle = 1;
var CircleIndex = [];
var CircleNums = [];
var CircleScale = [];
var CircleOffset = [];
var CircleTheta = [];
var Circleoffset_speed = [];
var CircleX = [];
var CircleY = [];
var CircleEdge = 180;
var offsetAlpha = 45 * Math.PI / 180;
var Circle_speed = 0.025;

function addCircle(pos) {
	CircleIndex.push(index);
	CircleScale.push(vec3.fromValues(scale_circle / 10, scale_circle / 10, 1));
	CircleOffset.push(pos);
	CircleTheta.push(vec3.fromValues(0, 0, 0));
	Circleoffset_speed.push(vec3.fromValues(Circle_speed * Math.cos(offsetAlpha), Circle_speed * Math.sin(offsetAlpha),
		0));
	// console.log(Circleoffset_speed);
	CircleX.push(1);
	CircleY.push(1);
	var count = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	per = 360 / CircleEdge;
	var PI = Math.PI;
	for (var i = 0; i <= 360; i += per) {
		var theta = i * PI / 180;
		var tmp = vec3.fromValues(Math.cos(theta), Math.sin(theta), 0.0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + count), new Float32Array(tmp));
		count++;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	for (var i = 0; i < count; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(color));
	}
	CircleNums.push(count);
	index += count;
}

function clear() {
	index = bg_index;
	//正三角形
	// scale_tri = 1.0;
	TriIndex = [];
	TriScale = [];
	TriScaleFlag = [];
	TriOffset = [];
	//正方形
	// scale_squ = 1;
	// speed_squ = 50;
	SquIndex = [];
	SquScale = [];
	SquOffset = [];
	SquTheta = [];
	SquTheta_speed = [];
	//立方体
	// scale_cube = 1;
	CubeIndex = [];
	CubeScale = [];
	CubeOffset = [];
	CubeTheta = [];
	// CubeTheta_speed = vec3.fromValues(0.01, 0.01, 0);
	//圆
	// scale_circle = 1;
	CircleIndex = [];
	CircleNums = [];
	CircleScale = [];
	CircleOffset = [];
	CircleTheta = [];
	Circleoffset_speed = [];
	CircleX = [];
	CircleY = [];
	// CircleEdge = 180;
	// offsetAlpha = 45 * Math.PI / 180;
	// Circle_speed = 0.025;
}
