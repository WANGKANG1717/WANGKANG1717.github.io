var gl;
// window.onload = function init() {
function init() {
	var canvas = document.getElementById("canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	// Six Vertices
	var vertices = new Float32Array([
		-1.0, -1.0, 1.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 1.0, 0.0,
		1.0, -1.0, 0.0, 0.0, 1.0,
	]);

	// Configure WebGL
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 1.0, 1.0, 1.0);

	// Load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// Load the data into the GPU
	var bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// Associate external shader variables with data buffer
	//
	var FSIZE = vertices.BYTES_PER_ELEMENT;
	// console.log(FSIZE);
	// console.log(program);
	//有关点的位置
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 5 * FSIZE, 0);
	gl.enableVertexAttribArray(vPosition);
	//有关点的颜色
	var aColor = gl.getAttribLocation(program, "aColor");
	console.log(aColor);
	gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 5 * FSIZE, 2 * FSIZE);
	gl.enableVertexAttribArray(aColor);

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function DrawTriangle() {
	var height = parseInt(myform.Height.value);
	var width = parseInt(myform.Width.value);
	if(height<=0 || width<=0) {
		document.getElementById("Triangle").innerHTML="Are you kiding me?";
		return ;
	}
	document.getElementById("Triangle").innerHTML = "<canvas id=\"canvas\" style=\"border:none;\" width=\"" + width +
		"\" height=\"" + height + "\" onclick=\"init()\"></canvas>";
	//自动触发事件
	//牛逼！！！！！！！！
	(() => {
		// 兼容IE
		if (document.all) {
			document.getElementById("canvas").click();
		}
		// 兼容其它浏览器
		else {
			var e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			document.getElementById("canvas").dispatchEvent(e);
		}
	})();
}
