/**
 * kang
 * 2021/10/9
 */
const {
	vec2
} = glMatrix;

var gl;
var points;
function init(count) {
	var canvas = document.getElementById("webgl");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	var vertices = [
		vec2.fromValues(-1, -1),
		vec2.fromValues(0, 1),
		vec2.fromValues(1, -1)
	];
	var a=vertices[0];
	var b=vertices[1];
	var c=vertices[2];
	//
	points=[];
	// console.log(points);
	divideTriangle(a, b, c, count);
	// console.log(points.length);
	// console.log(points);
	
	// Configure WebGL
	gl.viewport(25, 25, canvas.width-50, canvas.height-50);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// load data into the gpu
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

	// associate external shader variables with data buffer 
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	renderPoints();
};

function renderPoints() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	// gl.drawArrays(gl.POINTS, 0, 3);
	// gl.drawArrays(gl.TRIANGLES, 0, points.length/2);
	gl.drawArrays(gl.LINES, 0, points.length/2);
}

function divideTriangle(a, b, c, count) {
	if(count==0) {
		points.push(a[0], a[1], b[0], b[1]);
		points.push(b[0], b[1], c[0], c[1]);
		points.push(c[0], c[1], a[0], a[1]);
		return;
	}
	else {
		var ab=mix(a, b);
		// console.log(a);
		// console.log(b);
		// console.log(ab);
		var ac=mix(a, c);
		var bc=mix(b, c);
		count--;
		divideTriangle(a, ab, ac, count);
		divideTriangle(b, ab, bc, count);
		divideTriangle(c, ac, bc, count);
		divideTriangle(ab, ac, bc, count);
	}
}

function mix(a, b) {
	var ab=vec2.create();
	vec2.add(ab, a, b);
	vec2.scale(ab, ab, 0.5);
	return ab;
}

function DrawTriangle() {
	count = parseInt(myform.Count.value);
	console.log(count);
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
