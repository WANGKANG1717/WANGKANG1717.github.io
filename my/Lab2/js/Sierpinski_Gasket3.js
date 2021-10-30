/* *
 * kang
 * 2021/10/9
 */
const {
	vec3
} = glMatrix;

var gl;
var points = [];
var colors = [];
count = 1;

function init() {
	var canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	//
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
	divideTetra(a, b, c, d, count);
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

function renderPoints() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// gl.drawArrays(gl.POINTS, 0, 10);
	gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
}

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

function DrawTriangle() {
	count = parseInt(myform.Count.value);
	// console.log(count);
	if(count<0) {
		document.getElementById("Triangle").innerHTML="Are you kiding me?";
		return ;
	}
	else if(count>=10) {
		document.getElementById("Triangle").innerHTML="what are you doing?<br/><br/><br/><br/>剖分层次应小于10";
		return ;
	}
	document.getElementById("Triangle").innerHTML = "<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init("+count+")\"></canvas>";
	// console.log("<canvas id=\"webgl\" style=\"border:none;\" width=\"500\" height=\"500\" onclick=\"init("+count+")\"></canvas>");
	//自动触发事件
	//牛逼！！！！！！！！
	(() => {
		// 兼容IE
		if (document.all) {
			document.getElementById("webgl").click();
		}
		// 兼容其它浏览器
		else {
			var e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			document.getElementById("webgl").dispatchEvent(e);
		}
	})();
}

