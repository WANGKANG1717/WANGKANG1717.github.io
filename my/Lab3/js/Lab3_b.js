/**
 * kang
 * 2021/10/17
 */
const {
	vec4,
	vec3,
	vec2
} = glMatrix;

var gl;

var points; //记录点
var pointsNum; //存储某个下标开始的多边形的点的数量
var indexStart; //存储某个多边形的下标开始点
var index;
var color; //所用颜色均为取色器精准取色
//
var vBuffer, cBuffer;
//
var Tree1 = [
	0, 0,
	0, 0.2,
	0.1, 0.05,
	0.3, 0.2,
	0.2, 0.05,
	0.32, 0.02,
	0.2, -0.05,
	0.28, -0.1,
	0.18, -0.1,
	0.15, -0.26,
	-0.01, -0.16,
	-0.1, -0.2,
	-0.05, -0.02,
	-0.2, -0.15,
	-0.1, 0.01,
	-0.1, 0.2,
	0.0, 0.1,
];
var Tree2 = [
	-0.05, -0.05,
	-0.05, -0.8,
	0.05, -0.8,
	0.05, -0.05
];
var House1 = [
	0.0, 0.2,
	-0.2, -0.2,
	0.2, -0.2,
];
var House2 = [
	-0.2, -0.2,
	0.2, -0.2,
	0.2, -0.8,
	-0.2, -0.8
];
var Window = [
	-0.1, 0.1,
	-0.04, 0.1,
	-0.04, 0.01,
	-0.1, 0.01,
];
var Door = [
	-0.2, 0.2,
	-0.08, 0.2,
	-0.08, 0.01,
	-0.2, 0.01,
];
var Ba1 = [
	-0.05, 0.05,
	-0.04, 0.05,
	-0.04, 0.02,
	-0.05, 0.02,
];
///////////////////////////////////////////
var sunX = 0.80604445934295654,
	sunY = 0.50278759002685547;
var sun_gapX = 8,
	sun_gapY = 6;
///////////////////////////////////////////
function init() {
	var canvas = document.getElementById("webgl");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.18039215686, 0.8039215686, 0.356862745, 1.0);

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	vBuffer = gl.createBuffer(); //position
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 80000, gl.STATIC_DRAW); //直接申请足够的空间

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	cBuffer = gl.createBuffer(); // color
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 160000, gl.STATIC_DRAW); //申请足够的空间

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	//
	pointsNum = [];
	indexStart = [];
	index = 0;
	/**
	 * 这里本来是采用多个不同的函数来绘制的
	 * 后来发现了其内在的联系，通过两次优化使得我只需要两个函数，通过传递数据，就可以实现图像的绘制
	 * 使得函数的功能统一，更加强大便捷
	 */
	DRAW();
	//
	addAction();
	//
	render();
}

function DRAW() {
	DrawCircle(0, 1, sunX, sunY, sun_gapX, sun_gapY, vec4.fromValues(1.0, 0.0, 0.0, 1.0)); //太阳
	Draw(1, Tree1, 0.2, 0.1, 0.9, 0.9, vec4.fromValues(0.0, 1.0, 0.0, 1.0)); //树顶
	Draw(2, Tree2, 0.25, 0.05, 0.9, 0.9, vec4.fromValues(0.725490, 0.478431, 0.337254, 1.0)); //树干
	Draw(3, House1, -0.6, 0, 1, 1, vec4.fromValues(0, 0.658823, 0.95294, 1.0)) //房顶
	Draw(4, House2, -0.6, 0, 1, 1, vec4.fromValues(0.725490, 0.478431, 0.337254, 1.0)); //房子主体
	Draw(5, Window, -0.45, -0.4, 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(6, Window, -0.38, -0.4, 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(7, Window, -0.38, -0.5, 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(8, Window, -0.45, -0.5, 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(9, Door, -0.45, -0.81, 1, 1, vec4.fromValues(1.0, 0.792156, 0.0941176, 1.0)); //门
	//门把手	三部分
	Draw(10, Ba1, -0.59, -0.75, 1, 1, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
	DrawCircle(11, 1, -0.635, -0.7, 180, 140, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
	DrawCircle(12, 1, -0.635, -0.73, 180, 140, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
}

/**
 * 画数据
 * 自己封装的一个函数，可以根据你的数据方便的画图
 * 需要的数据有:Flag(存储的标记，便于取出存入数据), points, dataSource(你的数组), offset(偏移量), gap(放大或缩小), color(颜色)
 * Flag最好从零开始
 * 虽然可以设置单独的数组来存储Flag，但是我不想写了，能简单就简单就简单点吧，汗！
 */
function Draw(Flag, Data, offsetX, offsetY, gapX, gapY, Color) {
	points = [];
	for (var i = 0; i < Data.length; i += 2) {
		points.push(vec2.fromValues(Data[i] / gapX + offsetX, Data[i + 1] / gapY + offsetY));
	}
	var Add = false;
	if (!indexStart[Flag]) {
		indexStart[Flag] = index;
		Add = true;
	}
	pointsNum[Flag] = points.length;
	//写入数据
	color = Color;
	Write(Flag, Add);
}
/**
 * per(绘制的角度)
 * 其余一致
 */
function DrawCircle(Flag, per, offsetX, offsetY, gapX, gapY, Color) {
	points = [];
	points.push(vec2.fromValues(offsetX, offsetY));
	var PI = Math.PI;
	for (var i = 0; i <= 360; i += per) {
		var theta = i * PI / 180;
		points.push(vec2.fromValues(Math.cos(theta) / gapX + offsetX, Math.sin(theta) / gapY + offsetY));
	}
	//
	var Add = false;
	if (!indexStart[Flag]) {
		indexStart[Flag] = index;
		Add = true;
	}
	pointsNum[Flag] = points.length;
	//写入数据
	color = Color;
	Write(Flag, Add);
}
//写入数据
//考虑到这一部分是重复的，因此单独整一个函数，通过全部变量来传递数据
//现需要传递的数据有：points, color, index, vBuffer, cBuffer;
function Write(Flag, Add) {
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var i;
	for (i = 0; i < points.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (indexStart[Flag] + i), new Float32Array(points[i]));
	}
	//
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	for (i = 0; i < points.length; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (indexStart[Flag] + i), new Float32Array(color));
	}
	if (Add == true) {
		index += points.length;
		// console.log(indexStart[Flag] + "hahaha");
	}
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	//Flag不从零开始标号，这里会有问题，但是我不想优化了，记住！
	for (var i = 0; i < indexStart.length; i++)
		gl.drawArrays(gl.TRIANGLE_FAN, indexStart[i], pointsNum[i]);
}
//添加事件处理
//Sun
var sunMove = false;
var sunID;
var sunTrack = [];
var sunGap = [];
var bgColor = [];
var sun = 0;
var speedSun = 100;
//tree
var treeMove = false;
var treeID;
var treeTrack = [];
var treeGap = [];
var treeTrack2 = [];
var speedTree = 100;
var tree = 0;
//House
var houseMove = false;
var houseID;
var houseTrack = [];
var speedHouse = 100;
var house = 0;

function addAction() {
	//东升西落
	document.getElementById("button1").onclick = function(event) {
		if (sunMove) {
			document.getElementById("button1").style.backgroundColor = "";
			sunMove = false;
			window.clearInterval(sunID);
		} else {
			sunMove = true;
			document.getElementById("button1").style.backgroundColor = "aqua";
			getTrack_Gap();
			// MoveSun();
			sunID = window.setInterval(MoveSun, speedSun);
		}
	}
	document.getElementById("Speed1").onchange = function(event) {
		speedSun = 201 - event.target.value;
	}
	//万物生长
	document.getElementById("button2").onclick = function(event) {
		if (treeMove) {
			document.getElementById("button2").style.backgroundColor = "";
			treeMove = false;
			window.clearInterval(treeID);
		} else {
			treeMove = true;
			document.getElementById("button2").style.backgroundColor = "aqua";
			getTrack_Gap2();
			treeID = window.setInterval(MoveTree, speedTree);
		}
	}
	document.getElementById("Speed2").onchange = function(event) {
		speedTree = 201 - event.target.value;
	}
	//无中生有
	document.getElementById("button3").onclick = function(event) {
		if (houseMove) {
			document.getElementById("button3").style.backgroundColor = "";
			houseMove = false;
			window.clearInterval(houseID);
		} else {
			houseMove = true;
			document.getElementById("button3").style.backgroundColor = "aqua";
			getTrack_Gap3();
			houseID = window.setInterval(MoveHouse, speedHouse);
		}
	}
	document.getElementById("Speed3").onchange = function(event) {
		speedHouse = 201 - event.target.value;
	}
}

function getTrack_Gap() {
	sunTrack = [];
	sunGap = [];
	bgColor = [];
	var PI = Math.PI;
	for (var i = 180; i >= 40; i--) {
		var theta = i * PI / 180;
		sunTrack.push(vec2.fromValues(Math.cos(theta) + 0.04, Math.sin(theta) - 0.14));
		sunGap.push(vec2.fromValues(i / 40 * 8, i / 40 * 6));
		bgColor.push(vec4.fromValues(40 / i - 0.2, 40 / i - 0.2, 40 / i - 0.2, 1.0));
	}
	bgColor[bgColor.length - 1] = vec4.fromValues(0.18039215686, 0.8039215686, 0.356862745, 1.0);
}

function MoveSun() {
	DrawCircle(0, 1, sunTrack[sun][0], sunTrack[sun][1], sunGap[sun][0], sunGap[sun][1], vec4.fromValues(1.0,
		0.0,
		0.0,
		1.0)); //太阳
	gl.clearColor(bgColor[sun][0], bgColor[sun][1], bgColor[sun][2], bgColor[sun][3]);
	render();
	sun++;
	if (sun >= sunTrack.length) {
		sun = 0;
		(() => {
			var e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			document.getElementById("button1").dispatchEvent(e);
		})();
	}
}

function getTrack_Gap2() {
	treeTrack = [];
	treeGap = [];
	for (var i = 0; i <= 100; i++) {
		treeTrack.push(vec2.fromValues(0.2, -1 + 1.1 / 100 * i));
		treeGap.push(vec2.fromValues(0.9 / i * 100, 0.9 / i * 100));
		treeTrack2.push(vec2.fromValues(0.25, -1 + 1.05 / 100 * i));
	}
}

function MoveTree() {
	Draw(1, Tree1, treeTrack[tree][0], treeTrack[tree][1], treeGap[tree][0], treeGap[tree][1], vec4.fromValues(0.0, 1.0,
		0.0, 1.0)); //树顶
	Draw(2, Tree2, treeTrack2[tree][0], treeTrack2[tree][1], treeGap[tree][0], treeGap[tree][1], vec4.fromValues(
		0.725490,
		0.478431, 0.337254, 1.0)); //树干
	render();
	tree++;
	if (tree >= treeTrack.length) {
		tree = 0;
		(() => {
			var e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			document.getElementById("button2").dispatchEvent(e);
		})();
	}
}


function getTrack_Gap3() {
	houseTrack = [];
	houseGap = [];
	for (var i = -0.5; i <= 0; i += 0.01) {
		houseTrack.push(i);
	}
}

function MoveHouse() {
	Draw(3, House1, -0.6+houseTrack[house], 0+houseTrack[house], 1, 1, vec4.fromValues(0, 0.658823, 0.95294, 1.0)) //房顶
	Draw(4, House2, -0.6+houseTrack[house], 0+houseTrack[house], 1, 1, vec4.fromValues(0.725490, 0.478431, 0.337254, 1.0)); //房子主体
	Draw(5, Window, -0.45+houseTrack[house], -0.4+houseTrack[house], 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(6, Window, -0.38+houseTrack[house], -0.4+houseTrack[house], 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(7, Window, -0.38+houseTrack[house], -0.5+houseTrack[house], 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(8, Window, -0.45+houseTrack[house], -0.5+houseTrack[house], 1, 1, vec4.fromValues(1.0, 0.9490196, 0.0, 1.0)); //窗户
	Draw(9, Door, -0.45+houseTrack[house], -0.81+houseTrack[house], 1, 1, vec4.fromValues(1.0, 0.792156, 0.0941176, 1.0)); //门
	//门把手	三部分
	Draw(10, Ba1, -0.59+houseTrack[house], -0.75+houseTrack[house], 1, 1, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
	DrawCircle(11, 1, -0.635+houseTrack[house], -0.7+houseTrack[house], 180, 140, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
	DrawCircle(12, 1, -0.635+houseTrack[house], -0.73+houseTrack[house], 180, 140, vec4.fromValues(0.92549, 0.1098039, 0.14117647, 1.0));
	render();
	house++;
	if (house >= houseTrack.length) {
		house = 0;
		(() => {
			var e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			document.getElementById("button3").dispatchEvent(e);
		})();
	}
}
