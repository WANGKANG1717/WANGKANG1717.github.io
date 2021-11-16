const {
	vec3,
	vec4,
	mat4
} = glMatrix;
var canvas;
var gl;
var program;
var vBuffer, cBuffer;
var maxNumTri = 1000000;
var maxNumPoi = maxNumTri * 3;
var index = 0;
var indexStart = [];
var indexNum = [];
var projType = [];
var drawType = [];
var offset = [];
var theta = [];
var scale = [];
var bgTetra = [vec3.fromValues(0.0000, 0.0000, -1.0000), vec3.fromValues(0.0000, 0.9428, 0.3333), vec3.fromValues(-
	0.8165, -0.4714, 0.3333), vec3.fromValues(0.8165, -0.4714, 0.3333)];
var baseColor = [vec4.fromValues(1, 0, 0, 1), vec4.fromValues(0, 1, 0, 1), vec4.fromValues(0, 0, 1, 1), vec4.fromValues(
	0, 0, 0, 1), ];
var count = 7;
var angle = 520;
var mvMatrixLoc;
var mvMatrix = mat4.create();
var pjMatrixLoc;
var pjMatrix = mat4.create();
var CurrentColor = vec4.fromValues(0.66666667, 0.66666667, 1.0, 1.0);
var ProjType = 1;
var DrawType = 1;
var Offset = vec3.fromValues(0.0, 0.0, 0.0);
var Theta = vec3.fromValues(0.0, 0.0, 0.0);
var Scale = vec3.fromValues(1.0, 1.0, 1.0);

function init() {
	canvas = document.getElementById("webgl");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 12 * maxNumPoi, gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumPoi, gl.STATIC_DRAW);
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	var a = bgTetra[0];
	var b = bgTetra[1];
	var c = bgTetra[2];
	var d = bgTetra[3];
	divideTetra(a, b, c, d, count);
	indexStart.push(0);
	indexNum.push(index);
	projType.push(1);
	drawType.push(1);
	offset.push(vec3.fromValues(0.0, 0.0, 1.2));
	theta.push(vec3.fromValues(0.0, 0.0, 0.0));
	scale.push(vec3.fromValues(1.7, 1.7, 1));
	addEvent();
	render();
};
var flag = 1;

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	for (var i = 0; i < indexStart.length; i++) {
		if (i == 0) {
			theta[0][0] += 1;
			theta[0][1] += 0.1;
		}
		initMatrix(i);
		if (drawType[i] == 1) {
			gl.drawArrays(gl.TRIANGLES, indexStart[i], indexNum[i]);
		} else if (drawType[i] == 2) {
			gl.drawArrays(gl.LINES, indexStart[i], indexNum[i]);
		}
	}
	requestAnimFrame(render);
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

function initMatrix(pos) {
	var eye = vec3.fromValues(0.0, 0.0, 0.0);
	var at = vec3.fromValues(0.0, 0.0, 0.0);
	var up = vec3.fromValues(0.0, 1.0, 0.0);
	mat4.lookAt(mvMatrix, eye, at, up);
	mat4.translate(mvMatrix, mvMatrix, offset[pos]);
	mat4.rotateZ(mvMatrix, mvMatrix, theta[pos][0] * Math.PI / 180.0);
	mat4.rotateY(mvMatrix, mvMatrix, theta[pos][1] * Math.PI / 180.0);
	mat4.rotateX(mvMatrix, mvMatrix, theta[pos][2] * Math.PI / 180.0);
	mat4.scale(mvMatrix, mvMatrix, scale[pos]);
	mvMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	gl.uniformMatrix4fv(mvMatrixLoc, false, new Float32Array(mvMatrix));
	mat4.ortho(pjMatrix, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0);
	pjMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(pjMatrixLoc, false, new Float32Array(pjMatrix));
}

function addEvent() {
	document.getElementById("Cube").onclick = function(event) {
		readOBJFile("./3d/cube.obj");
	}
	document.getElementById("Shoudian").onclick = function(event) {
		readOBJFile("./3d/shoudian.obj");
	}
	document.getElementById("Bunny").onclick = function(event) {
		readOBJFile("./3d/bunny.obj");
	}
	document.getElementById("fileInput").onchange = function(event) {
		var file = this.files[0];
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(event) {
			addOBJ(reader.result);
		}
	}
	document.getElementById("objcolor").onchange = function(event) {
		var hexcolor = document.getElementById("objcolor").value.substring(1);
		var rgbHex = hexcolor.match(/.{1,2}/g);
		CurrentColor = vec4.fromValues(parseInt(rgbHex[0], 16) / 255.0, parseInt(rgbHex[1], 16) / 255.0, parseInt(
			rgbHex[2], 16) / 255.0, 1.0);
	}
	var drawradios = document.getElementsByName("drawtype");
	for (var i = 0; i < drawradios.length; i++) {
		drawradios[i].onclick = function() {
			var value = this.value;
			if (this.checked) {
				DrawType = parseInt(value);
			}
		}
	}
}

function readOBJFile(filePath) {
	var request = new XMLHttpRequest();
	request.open('GET', filePath, true);
	request.send();
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status == 200) {
			addOBJ(request.responseText);
		}
	}
}

function addOBJ(meshdata) {
	mesh = new OBJ.Mesh(meshdata);
	OBJ.initMeshBuffers(gl, mesh);
	var len;
	if (DrawType == 1) {
		len = mesh.indices.length;
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		for (var i = 0; i < len; i++) {
			var p = mesh.indices[i] * 3;
			var point = vec3.fromValues(mesh.vertices[p], mesh.vertices[p + 1], mesh.vertices[p + 2]);
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + i), new Float32Array(point));
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		for (var i = 0; i < len; i++) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(CurrentColor));
		}
	} else {
		len = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		for (var i = 0; i < mesh.indices.length; i += 3) {
			var a = mesh.indices[i] * 3;
			var b = mesh.indices[i + 1] * 3;
			var c = mesh.indices[i + 2] * 3;
			var pa = vec3.fromValues(mesh.vertices[a], mesh.vertices[a + 1], mesh.vertices[a + 2]);
			var pb = vec3.fromValues(mesh.vertices[b], mesh.vertices[b + 1], mesh.vertices[b + 2]);
			var pc = vec3.fromValues(mesh.vertices[c], mesh.vertices[c + 1], mesh.vertices[c + 2]);
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 0), new Float32Array(pa));
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 1), new Float32Array(pb));
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 2), new Float32Array(pa));
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 3), new Float32Array(pc));
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 4), new Float32Array(pb));
			gl.bufferSubData(gl.ARRAY_BUFFER, 12 * (index + len + 5), new Float32Array(pc));
			len += 6;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		for (var i = 0; i < len; i++) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(CurrentColor));
		}
	}
	var dx = -1.0 * (parseFloat(mesh.xmax) + parseFloat(mesh.xmin)) / 2;
	var dy = -1.0 * (parseFloat(mesh.ymax) + parseFloat(mesh.ymin)) / 2;
	var dz = -1.0 * (parseFloat(mesh.zmax) + parseFloat(mesh.zmin)) / 2;
	if (Math.abs(dx) > 1.0) {
		dx = 1.0 / dx;
	}
	if (Math.abs(dy) > 1.0) {
		dy = 1.0 / dy;
	}
	if (Math.abs(dz) > 1.0) {
		dz = 1.0 / dz;
	}
	Offset = vec3.fromValues(dx, dy, dz);
	var maxScale;
	var scalex = Math.abs(parseFloat(mesh.xmax) - parseFloat(mesh.xmin));
	var scaley = Math.abs(parseFloat(mesh.ymax) - parseFloat(mesh.ymin));
	var scalez = Math.abs(parseFloat(mesh.zmax) - parseFloat(mesh.zmin));
	var maxScale = Math.max(scalex, scaley, scalez);
	Scale = vec3.fromValues(0.5 / maxScale, 0.5 / maxScale, 0.5 / maxScale);
	indexStart.push(index);
	indexNum.push(len);
	projType.push(ProjType);
	drawType.push(DrawType);
	offset.push(Offset);
	theta.push(Theta);
	scale.push(Scale);
	index += len;
}
