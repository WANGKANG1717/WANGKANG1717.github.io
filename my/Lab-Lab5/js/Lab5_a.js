/**
 * @data 2021/11/12
 * @author WK/teacher
 * @description 将老师的代码从头到尾进行详细的注释,并在此基础上进行改进
 */
/**
 * 前面有断点的,暂时还没有搞清楚
 */
const {
	vec3, //三维向量
	vec4, //四维向量
	mat3, //3*3矩阵
	mat4, //4*4矩阵  //列为主
	quat //四元组
} = glMatrix;

var canvas; // 画布
var gl; //gl
var fileInput; //文件输入

var meshdata; // 网格数据
var mesh; //mesh:网眼、网格

var points = []; //点数组
var colors = []; //颜色数组
var lineIndex = [];
/**
 * 模型视图变换矩阵: 确定某一帧中，空间里每个顶点的坐标
 * 其实就是将之前的三个平移矩阵、旋转、缩放矩阵合并成一个矩阵,简称为模视变换矩阵
 * 叫法可能会有所不同,但是作用是一致的
 * 这样的话,在着色器中进行计算时,只需要进行一次计算就可以将点放置到合适的位置
 */
var modelViewMatrix = mat4.create(); //模视变换矩阵
/**
 * 透视投影变换矩阵: 将顶点坐标映射到二维的屏幕上
 * 最主要的有两种投影方式，正射投影和透视投影。
 * 前者用于精确制图，如工业零件侧视图或建筑物顶视图，从屏幕上就可以量测平行于屏幕的线段长度；
 * 后者用于模拟视觉，远处的物体看上去较小。
 */
var projectionMatrix = mat4.create(); //透视投影变化矩阵
/**
 * 下面是我觉得可以帮助理解这两个矩阵的资料
 */
/**
 * 三维世界的显示中，屏幕模拟了一个窗口，你透过这个窗口观察“外面”的世界。
 * 你的屏幕是有边缘的（除非你有一个球形的房间，内壁全是屏幕），
 * 因此你仅仅能观察到那个世界的一部分，即“相机空间”。
 * 相机空间的左、右、上、下边界是受限于屏幕的边缘，
 * 同时也设定前、后边界，因为你很难看清太近或太远的东西。
 * 在正射投影中，相机空间是一个规则的立方体，而在透视投影中则是一个方台体。
 */
/**
 * 三维模型可能在不同的显示器上展现，因此投影的过程中不该将显示器参数加入进来，
 * 而是将空间中的点投影到一个规范的显示器中。
 * 另外，透视投影中的z值并不是毫无用处，它可以用来表示顶点的“深度”：
 * 如果三维空间中的两个不同顶点投影到平面上时重合了，那么将显示深度较浅的顶点。
 */
/**
 * Buffer:缓冲流,用来向着色器发送数据
 * vPosition\vColor: 用于向着色器中指定特定变量的值
 */
var vBuffer = null;
var vPosition = null;
var cBuffer = null;
var vColor = null;

/**
 * o是orthographic projection(正交投影)的首字母
 * p是perspective(透视投影)的首字母
 */
var oleft = -3.0;
var oright = 3.0;
var oytop = 3.0;
var oybottom = -3.0;
var onear = -5;
var ofar = 10;

var oradius = 3.0;
var theta = 0.0;
var phi = 0.0;

var pleft = -10.0;
var pright = 10.0;
var pytop = 10.0;
var pybottom = -10.0;
var pnear = 0.01;
var pfar = 20;
var pradius = 3.0;
/**
 * fov: 应该是这个单词foveal:中心凹
 * y: 包括上面的y不知道什么意思
 */
var fovy = 45.0 * Math.PI / 180.0; //透视投影张角
var aspect; //透视投影的矩形的长宽比

/**
 * 不加t表示平移
 * 加t表示旋转
 */
var dx = 0;
var dy = 0;
var dz = 0;
var step = 0.1;

var dxt = 0;
var dyt = 0;
var dzt = 0;
var stept = 2;

//控制缩放
var sx = 1;
var sy = 1;
var sz = 1;

//相机位置
var cx = 0.0;
var cy = 0.0;
var cz = 4.0;
var stepc = 0.1;

var cxt = 0;
var cyt = 0;
var czt = 0;
var stepct = 2;
/**
 * 计算用
 */
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var eye = vec3.fromValues(cx, cy, cz); //就是相机的位置

var at = vec3.fromValues(0.0, 0.0, 0.0);
var up = vec3.fromValues(0.0, 1.0, 0.0);

//鼠标点击和记录上次的鼠标位置
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var currentKey = [];

/**
 * 可视化界面控制
 */
/**
 * projectionType: 投影模式
 * drawType: 绘制模式
 */
var projectionType = 1; // default is Orthographic(1), Perspective(2)
var drawType = 1; // default is WireFrame(1), Solid(2)

//改变的是相机还是物体的位置
var changePos = 1; // default is Object(1), camera(2)

//当前的颜色
var currentColor = vec4.create();

//着色器程序对象,用来对着色器进行控制
var program = null;

//控制键盘
/**
 * 搞明白这个代码之后,我只能说写的太烂了
 * 可以精简很多的
 */
function handleKeyDown(event) {
	var key = event.keyCode; //获取键盘按下的键值
	currentKey[key] = true; //标记当前按键
	if (changePos === 1) { //如果当前移动的是物体的位置
		switch (key) { //根据键值进行相应的操作
			//w s a d 控制物体上下左右平移
			//z x 控制物体沿着z轴前进后退
			case 65: //left//a
				dx -= step;
				document.getElementById("xpos").value = dx;
				break;
			case 68: // right//d
				dx += step;
				document.getElementById("xpos").value = dx;
				break;
			case 87: // up//w
				dy += step;
				document.getElementById("ypos").value = dy;
				break;
			case 83: // down//s
				dy -= step;
				document.getElementById("ypos").value = dy;
				break;
			case 90: // a//z
				dz += step;
				document.getElementById("zpos").value = dz;
				break;
			case 88: // d//x
				dz -= step;
				document.getElementById("zpos").value = dz;
				break;
				//h k 控制物体沿着y轴旋转
			case 72: // h//ytheta-
				dyt -= stept;
				document.getElementById("yrot").value = dyt;
				break;
			case 75: // k//ytheta+
				dyt += stept;
				document.getElementById("yrot").value = dyt;
				break;
				//u j 沿着x轴旋转
			case 85: // u//xtheta+
				dxt -= stept;
				document.getElementById("xrot").value = dxt;
				break;
			case 74: // j//xtheta-
				dxt += stept;
				document.getElementById("xrot").value = dxt;
				break;
				//n m 沿着z轴旋转
			case 78: // n//ztheta+
				dzt += stept;
				document.getElementById("zrot").value = dzt;
				break;
			case 77: // m//ztheta-
				dzt -= stept;
				document.getElementById("zrot").value = dzt;
				break;
				//清空
				//这里有个小bug
				//就是清空之后下面的轴没有同步清空
				//这个问题,可以有空解决下
			case 82: // r//reset
				dx = 0;
				dy = 0;
				dz = 0;
				dxt = 0;
				dyt = 0;
				dzt = 0;
				break;
		}
	}
	if (changePos === 2) { //如果当前移动的是相机的位置
		switch (key) {
			case 65: //left//a
				cx -= stepc;
				document.getElementById("xpos").value = cx;
				break;
			case 68: // right//d
				cx += stepc;
				document.getElementById("xpos").value = cx;
				break;
			case 87: // up//w
				cy += stepc;
				document.getElementById("ypos").value = cy;
				break;
			case 83: // down//s
				cy -= stepc;
				document.getElementById("ypos").value = cy;
				break;
			case 90: // a//z
				cz += stepc;
				document.getElementById("zpos").value = cz;
				break;
			case 88: // d//x
				cz -= stepc;
				document.getElementById("zpos").value = cz;
				break;
			case 72: // h//ytheta-
				cyt -= stepct;
				document.getElementById("yrot").value = cyt;
				break;
			case 75: // k//ytheta+
				cyt += stepct;
				document.getElementById("yrot").value = cyt;
				break;
			case 85: // u//xtheta+
				cxt -= stepct;
				document.getElementById("xrot").value = cxt;
				break;
			case 74: // j//xtheta-
				cxt += stepct;
				document.getElementById("xrot").value = cxt;
				break;
			case 78: // n//ztheta+
				czt += stepct;
				document.getElementById("zrot").value = czt;
				break;
			case 77: // m//ztheta-
				czt -= stepct;
				document.getElementById("zrot").value = czt;
				break;
			case 82: // r//reset
				cx = 0;
				cy = 0;
				cz = 4;
				cxt = 0;
				cyt = 0;
				czt = 0;
				break;
		}
	}
	buildModelViewProj();
}
/**
 * 处理按键释放
 */
function handleKeyUp(event) {
	currentKey[event.keyCode] = false;
}
//记录鼠标按住位置
function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
}
//释放鼠标
function handleMouseUp(event) {
	mouseDown = false;
}
//处理鼠标的移动
function handleMouseMove(event) {
	if (!mouseDown) //如果鼠标没有按住,则返回
		return;
	//记录新的鼠标的位置
	var newX = event.clientX;
	var newY = event.clientY;

	var deltaX = (newX - lastMouseX);
	var d = deltaX;
	theta = theta - parseFloat(d); //新建一个变量d?  多此一举!🤣😒

	var deltaY = (newY - lastMouseY);
	d = deltaY;
	phi = phi - parseFloat(d); //新建一个变量d?  多此一举!🤣😒

	lastMouseX = newX; //更新'旧鼠标'位置
	lastMouseY = newY;
	buildModelViewProj();
}

//检查输入
function checkInput() {
	//投影模式
	var ptype = document.getElementById("ortho").checked;
	if (ptype) {
		projectionType = 1;
	} else if (document.getElementById("persp").checked) {
		projectionType = 2;
	}
	//
	var dtype = document.getElementById("wire").checked;
	if (dtype) {
		drawType = 1;
	} else if (document.getElementById("solid").checked) {
		drawType = 2;
	}
	/**
	 * 这段代码可以学习下
	 * 将取色器中的颜色字符串方便的转换成合乎要求的颜色数组
	 * 这很可以
	 */
	var hexcolor = document.getElementById("objcolor").value.substring(1);
	var rgbHex = hexcolor.match(/.{1,2}/g);
	currentColor = vec4.fromValues(
		parseInt(rgbHex[0], 16) / 255.0,
		parseInt(rgbHex[1], 16) / 255.0,
		parseInt(rgbHex[2], 16) / 255.0,
		1.0
	);
}

/**
 * 更新html的滑动条
 */
function restoreSliderValue(changePos) {
	if (changePos === 1) {
		document.getElementById("xpos").value = dx;
		document.getElementById("ypos").value = dy;
		document.getElementById("zpos").value = dz;
		document.getElementById("xrot").value = Math.floor(dxt);
		document.getElementById("yrot").value = Math.floor(dyt);
		document.getElementById("zrot").value = Math.floor(dzt);
	}
	if (changePos === 2) {
		document.getElementById("xpos").value = cx;
		document.getElementById("ypos").value = cy;
		document.getElementById("zpos").value = cz;
		document.getElementById("xrot").value = Math.floor(cxt);
		document.getElementById("yrot").value = Math.floor(cyt);
		document.getElementById("zrot").value = Math.floor(czt);
	}
}

window.onload = function initWindow() {
	//获取画布
	canvas = document.getElementById("webgl");
	//得到gl
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	//背景色设置
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	//开启隐藏面消除算法
	gl.enable(gl.DEPTH_TEST);
	//得到着色器控制程序
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program); //绑定着色器

	initInterface();

	checkInput();
}

//初始化缓冲流
//?????????这东西还需要单独初始化?????????
function initBuffers() {
	vBuffer = gl.createBuffer();
	cBuffer = gl.createBuffer();
}

/**
 * FileReader 对象允许Web应用程序异步读取存储在用户计算机上的文件（或原始数据缓冲区）的内容，
 * 使用 File 或 Blob 对象指定要读取的文件或数据。
 * 其中File对象可以是来自用户在一个<input>元素上选择文件后返回的FileList对象,
 * 也可以来自拖放操作生成的 DataTransfer对象,
 * 还可以是来自在一个HTMLCanvasElement上执行mozGetAsFile()方法后返回结果。
 * 
 * 重要提示
 * FileReader仅用于以安全的方式从用户（远程）系统读取文件内容 
 * 它不能用于从文件系统中按路径名简单地读取文件。 
 * 要在JavaScript中按路径名读取文件，应使用标准Ajax解决方案进行服务器端文件读取，
 * 如果读取跨域，则使用CORS权限。
 * 
 * 详细的文档请看:https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
 */
/**
 * 初始化
 * 其实就是将文件读进来,然后进行各个数据的初始化
 */
function initInterface() {
	fileInput = document.getElementById("fileInput"); // 获取fileinput对象
	fileInput.addEventListener("change", function(event) { //添加事件
		var file = fileInput.files[0]; //得到files列表中的第一个obj对象
		var reader = new FileReader(); //fileEeader对象

		reader.readAsText(file); //以字符串形式读取file中的内容
		reader.onload = function(event) { //当读取完成时,进行以下操作
			meshdata = reader.result; //将result属性中的数据赋值给meshdata
			// console.log(meshdata.toString());
			initObj();
		}
	});
	/**
	 * 下面就是给各html中各个组件添加事件
	 */
	//获取投影模式的所有的选择项
	var projradios = document.getElementsByName("projtype");
	//给所有投影模式选择项批量添加事件
	//没想到name属性和元素数组还可以这样使用,学到了
	for (var i = 0; i < projradios.length; i++) {
		projradios[i].addEventListener("click", function(event) {
			var value = this.value;
			if (this.checked) {
				projectionType = parseInt(value); //更新投影模式
			}
			buildModelViewProj();
		});
	}
	//获取绘制模式的选择项并批量添加事件
	var drawradios = document.getElementsByName("drawtype");
	for (var i = 0; i < drawradios.length; i++) {
		drawradios[i].onclick = function() {
			var value = this.value;
			if (this.checked) {
				drawType = parseInt(value); //更新绘制模式
			}
			updateModelData();
		}
	}
	//当一个 <input>, <select>, 或 <textarea> 元素的 value 被修改时，会触发 input 事件。
	document.getElementById("objcolor").addEventListener("input", function(event) {
		var hexcolor = this.value.substring(1);
		var rgbHex = hexcolor.match(/.{1,2}/g);
		currentColor = vec4.fromValues(
			parseInt(rgbHex[0], 16) * 1.0 / 255.0,
			parseInt(rgbHex[1], 16) * 1.0 / 255.0,
			parseInt(rgbHex[2], 16) * 1.0 / 255.0,
			1.0
		);
		updateColor();
	});

	document.getElementById("xpos").addEventListener("input", function(event) {
		if (changePos === 1)
			dx = this.value;
		else if (changePos === 2)
			cx = this.value;
		buildModelViewProj();
	});
	document.getElementById("ypos").addEventListener("input", function(event) {
		if (changePos === 1)
			dy = this.value;
		else if (changePos === 2)
			cy = this.value;
		buildModelViewProj();
	});
	document.getElementById("zpos").addEventListener("input", function(event) {
		if (changePos === 1)
			dz = this.value;
		else if (changePos === 2)
			cz = this.value;
		buildModelViewProj();
	});

	document.getElementById("xrot").addEventListener("input", function(event) {
		if (changePos === 1)
			dxt = this.value;
		else if (changePos === 2)
			cxt = this.value;
		buildModelViewProj();
	});
	document.getElementById("yrot").addEventListener("input", function(event) {
		if (changePos === 1)
			dyt = this.value;
		else if (changePos === 2)
			cyt = this.value;
		buildModelViewProj();
	});
	document.getElementById("zrot").addEventListener("input", function(event) {
		if (changePos === 1)
			dzt = this.value;
		else if (changePos === 2)
			czt = this.value;
		buildModelViewProj();
	});

	var postypeRadio = document.getElementsByName("posgrp");
	for (var i = 0; i < postypeRadio.length; i++) {
		postypeRadio[i].addEventListener("click", function(event) {
			var value = this.value;
			if (this.checked) {
				changePos = parseInt(value);
				restoreSliderValue(changePos); //这里是同步更新滑动条
			}
		});
	}
	/**
	 * 下面也是添加事件
	 * 只不过是简化形式的,本质上和上面的一样的
	 */
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
}


function buildMultiViewProj(type) {
	if (type[0] === 0)
		render();
	else
		rendermultiview();
}

/**
 * 初始化obj
 */
function initObj() {
	/**
	 * 这里有个小bug
	 * 当最开始加载网页的时候,还没有选择任何obj文件,会一直不断的绘制空的文件
	 */
	//这里的mesh相当于vBuffer,只不过里面得到数据应该更加复杂
	mesh = new OBJ.Mesh(meshdata);
	console.log(mesh);
	// mesh.normalBuffer, mesh.textureBuffer, mesh.vertexBuffer, mesh.indexBuffer
	OBJ.initMeshBuffers(gl, mesh);

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);

	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	/**
	 * 这里是根据网格的顶点向量的大小在bcolor中输入数据
	 */
	var bcolor = [];
	for (var i = 0; i < mesh.vertexBuffer.numItems; i++) {
		bcolor.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);
	}

	if (cBuffer === null) {
		cBuffer = gl.createBuffer();
	}

	// setColors
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcolor), gl.STATIC_DRAW);

	vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	dx = -1.0 * (parseFloat(mesh.xmax) + parseFloat(mesh.xmin)) / 2.0;
	dy = -1.0 * (parseFloat(mesh.ymax) + parseFloat(mesh.ymin)) / 2.0;
	dz = -1.0 * (parseFloat(mesh.zmax) + parseFloat(mesh.zmin)) / 2.0;

	var maxScale;
	var scalex = Math.abs(parseFloat(mesh.xmax) - parseFloat(mesh.xmin));
	var scaley = Math.abs(parseFloat(mesh.ymax) - parseFloat(mesh.ymin));
	var scalez = Math.abs(parseFloat(mesh.zmax) - parseFloat(mesh.zmin));

	maxScale = Math.max(scalex, scaley, scalez);

	sx = 2.0 / maxScale;
	sy = 2.0 / maxScale;
	sz = 2.0 / maxScale;

	dx = 0;
	dy = 0;
	dz = 0;

	updateModelData();
	buildModelViewProj();
	updateColor();

	render();
}


function updateModelData() {
	if (vBuffer === null)
		vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer);
	lineIndex = [];
	for (var i = 0; i < mesh.indices.length; i += 3) {
		lineIndex.push(mesh.indices[i], mesh.indices[i + 1]);
		lineIndex.push(mesh.indices[i + 1], mesh.indices[i + 2]);
		lineIndex.push(mesh.indices[i + 2], mesh.indices[i]);
	}
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW);
}

function updateColor() {
	var bcolor = [];
	for (var i = 0; i < mesh.vertexBuffer.numItems; i++)
		bcolor.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);

	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcolor), gl.STATIC_DRAW);

	vColor = gl.getAttribLocation(program, "vColor", );
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
}

function buildModelViewProj() {
	/* ModelViewMatrix & ProjectionMatrix */
	//eye = vec3.fromValues(cx, cy, cz);
	var localRadius;

	if (projectionType == 1) {
		mat4.ortho(pMatrix, oleft, oright, oybottom, oytop, onear, ofar);
		localRadius = oradius;
	} else {
		aspect = 1;
		mat4.perspective(pMatrix, fovy, aspect, pnear, pfar);
		//mat4.frustum( pMatrix, pleft, pright, pybottom, pytop, pnear, pfar );
		localRadius = pradius;
	}

	var rthe = theta * Math.PI / 180.0;
	var rphi = phi * Math.PI / 180.0;

	vec3.set(eye, localRadius * Math.sin(rthe) * Math.cos(rphi), localRadius * Math.sin(rthe) * Math.sin(rphi),
		localRadius * Math.cos(rthe));

	mat4.lookAt(mvMatrix, eye, at, up);

	mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(dx, dy, dz));

	mat4.rotateZ(mvMatrix, mvMatrix, dzt * Math.PI / 180.0);
	mat4.rotateY(mvMatrix, mvMatrix, dyt * Math.PI / 180.0);
	mat4.rotateX(mvMatrix, mvMatrix, dxt * Math.PI / 180.0);

	//mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(dx, dy, dz));
	mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(sx, sy, sz));

	modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
	gl.uniformMatrix4fv(modelViewMatrix, false, new Float32Array(mvMatrix));
	projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(projectionMatrix, false, new Float32Array(pMatrix));
}

var interval = setInterval(timerFunc, 30);

function timerFunc() {
	render();
}

function render() {
	gl.viewport(0, 0, canvas.width, canvas.height);
	aspect = canvas.width / canvas.height;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	renderType(drawType);
}

//根据指定的类型绘制??
function renderType(type) {
	if (type == 1) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer);
		gl.drawElements(gl.LINES, lineIndex.length, gl.UNSIGNED_SHORT, 0);
	} else {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
		gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}
