// ---------------------------------------------------------------

var drawUrl = "/BraveIntelServer/map";

var drawData = {};
var drawMapAll = true;
var drawCacheData;

var drawReady = false;

var drawSystemSize = 12;
var drawSystemOffsetX = 28;
var drawSystemOffsetY = 14;

var drawScale = 1.0;

// ---------------------------------------------------------------

$(document).ready(function() {
    var resizeTimer = 0;
    $(window).on('resize', function(){
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(drawResize, 300);
    });
    setTimeout(function(){
	drawLoad('Catch');
    }, 1000);
});

// ---------------------------------------------------------------

function drawLoad(map) {
    drawReady = false;
    drawClear();

    $.ajax({
	async: true,
	url: drawUrl + '?region=' + map,
	mimeType: "application/json",
	dataType: 'json',
	error: drawLoadError,
	success: drawLoadSuccess,
    });
}

function drawLoadSuccess(response) {
    drawData = response;
    drawReady = true;
    drawResize();
}

function drawLoadError(error) {
    if (error.status == 401) {
	window.setTimeout(function() {
	    window.location.reload(true);
	}, 3000);
    }
}

// ---------------------------------------------------------------

function drawResize() {
    var div = document.getElementById("map");
    dw = div.offsetWidth;
    dh = div.offsetHeight;

    var canvas = document.getElementById('canvas');
    canvas.width = dw;
    canvas.height = dh;

    drawScale = Math.min(dw / 1054, dh / 770);

    var ctx = canvas.getContext('2d');
    ctx.scale(drawScale, drawScale);

    drawMapAll = true;
    drawMap();
    drawDivs();
}

// ---------------------------------------------------------------

function drawClear() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 4096, 4096);
}


function drawMap() {
    if (!drawReady) {
	return;
    }


    var ctx = document.getElementById('canvas').getContext('2d');

    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = '#000000';

    if (drawMapAll == true) {
	drawClear();
	drawMapAll = false;
	drawConnections(ctx, true);
	//drawBridges(ctx, true);

	drawConnections(ctx, false);
	drawBridges(ctx, false);

	drawSystemNames(ctx);
	drawSystems(ctx, true);

	drawCacheData = ctx.getImageData(0,0,canvas.width, canvas.height);
    } else {
	ctx.putImageData(drawCacheData,0,0);
    }

    drawSystems(ctx, false);
    drawSystemSelects(ctx);
}

function drawConnections(ctx, shadow) {
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;

    for (i in drawData['map']['connections']) {
	x1 = drawData['map']['connections'][i]['x1'];
	y1 = drawData['map']['connections'][i]['y1'];
	x2 = drawData['map']['connections'][i]['x2'];
	y2 = drawData['map']['connections'][i]['y2'];

	if (shadow === true) {
	    ctx.lineWidth = 5;
	    ctx.strokeStyle = '#000000';
	} else {
	    ctx.lineWidth = 3;
	    ctx.strokeStyle = connectionToColor(drawData['map']['connections'][i]['type']);
	}

	ctx.beginPath();
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2,y2);
	ctx.stroke();
    }
}

function drawBridges(ctx, shadow) {
    ctx.shadowBlur = 6;

    if (shadow === true) {
	ctx.lineWidth = 5;
	ctx.strokeStyle = '#000000';
    } else {
	ctx.lineWidth = 3;
	ctx.strokeStyle = '#101096';
	ctx.strokeStyle = connectionToColor('jb');
    }

    ctx.beginPath();
    for (i in drawData['map']['bridges']) {
	x1 = drawData['map']['bridges'][i]['x1'];
	y1 = drawData['map']['bridges'][i]['y1'];
	x2 = drawData['map']['bridges'][i]['x2'];
	y2 = drawData['map']['bridges'][i]['y2'];
	x3 = drawData['map']['bridges'][i]['x3'];
	y3 = drawData['map']['bridges'][i]['y3'];

	ctx.moveTo(x1,y1);
	ctx.quadraticCurveTo(x2,y2, x3,y3)
    }
    ctx.stroke();
}

function drawSystems(ctx, shadow) {
    ctx.shadowBlur = 30;

    for (i in drawData['map']['systems']) {
	x = Math.floor(drawData['map']['systems'][i]['x']);
	y = Math.floor(drawData['map']['systems'][i]['y']);
	name = drawData['map']['systems'][i]['name'];
	stn = drawData['map']['systems'][i]['hasStation'];


	if (shadow === true) {

	    ctx.fillStyle = '#000000';
	    if (stn) {
		ctx.fillRect (x + drawSystemOffsetX - drawSystemSize/2 - 2, y + drawSystemOffsetY - drawSystemSize/2 - 2, drawSystemSize + 4, drawSystemSize + 4);
	    } else {
		ctx.beginPath();
		ctx.arc(x + drawSystemOffsetX, y + drawSystemOffsetY, drawSystemSize/2 + 2, 0, 2 * Math.PI);
		ctx.fill();
	    }

	} else {

	    color = timestampToColor(reportsLatestGet(name));
	    if (color === false) {
		ctx.fillStyle = systemToColor();
	    } else {
		ctx.fillStyle = color;
	    }

	    if (stn) {
		ctx.fillRect (x + drawSystemOffsetX - drawSystemSize/2, y + drawSystemOffsetY  - drawSystemSize/2, drawSystemSize, drawSystemSize);
	    } else {
		ctx.beginPath();
		ctx.arc(x + drawSystemOffsetX, y + drawSystemOffsetY, drawSystemSize/2, 0, 2 * Math.PI);
		ctx.fill();
	    }

	}
    }
}

function drawSystemNames(ctx) {
    ctx.shadowBlur = 2;
    ctx.font = "9pt Helvetica";

    for (i in drawData['map']['systems']) {
	x = Math.floor(drawData['map']['systems'][i]['x']);
	y = Math.floor(drawData['map']['systems'][i]['y']);
	name = drawData['map']['systems'][i]['name'];
	region = drawData['map']['systems'][i]['region'];

	ctx.fillStyle = nameToColor();
	ctx.fillText(name, x + drawSystemOffsetX + drawSystemSize/2 + 8, y + drawSystemOffsetY - 6);

	if (region != undefined) {
	    ctx.fillStyle = connectionToColor('jr');
	    ctx.fillText(region, x + drawSystemOffsetX + drawSystemSize/2 + 8, y + drawSystemOffsetY + 16);
	}

    }
}

function drawSystemSelects(ctx) {
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#508000';

    ctx.lineWidth = 2;
    border = 12;

    for (i in drawData['map']['systems']) {
	x = Math.floor(drawData['map']['systems'][i]['x']);
	y = Math.floor(drawData['map']['systems'][i]['y']);
	name = drawData['map']['systems'][i]['name'];
	stn = drawData['map']['systems'][i]['hasStation'];

	if ($.inArray(name, logsFilterSystems) != -1) {
	    if (stn) {
		ctx.beginPath();
		ctx.strokeRect (x + drawSystemOffsetX - drawSystemSize/2 - border/2, y + drawSystemOffsetY - drawSystemSize/2 - border/2, drawSystemSize + border, drawSystemSize + border);
		ctx.stroke();
	    } else {
		ctx.beginPath();
		ctx.arc(x + drawSystemOffsetX, y + drawSystemOffsetY, drawSystemSize/2 + border / 2, 0, 2 * Math.PI);
		ctx.stroke();
	    }
	}
    }
}

function drawDivs() {
    border = 8;
    dw = (drawSystemSize + border) * drawScale;
    dh = (drawSystemSize + border) * drawScale;

    $("#map > div").each(function() {
	$(this).remove();
    });

    for (i in drawData['map']['systems']) {
	id = Math.floor(drawData['map']['systems'][i]['id']);
	x = Math.floor(drawData['map']['systems'][i]['x']);
	y = Math.floor(drawData['map']['systems'][i]['y']);
	name = drawData['map']['systems'][i]['name'];
	stn = drawData['map']['systems'][i]['hasStation'];

	dx = (x + drawSystemOffsetX - drawSystemSize/2 - border/2) * drawScale;
	dy = (y + drawSystemOffsetY - drawSystemSize/2 - border/2) * drawScale;

	style = "";
	if (!stn) {
	    style = "border-radius: 50%;";
	}

	cnt = "";
	cnt += "<div id='blink-" + name + "'";
	cnt += " style='position: absolute; left: " +  dx + "px; top: " +  dy + "px; width: " + dw + "px; height: " + dh + "px; cursor: pointer; z-index:1; background-color: #FF0000; opacity: 0; " + style + "'";
	cnt += " onclick='mapSystemClicked(\"" + name + "\");'></div>";
	$("#map").append(cnt);
    }

}

// ---------------------------------------------------------------

function drawDivBlink(id) {
    $('#' + id)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400)
	.animate({opacity: 1}, 400)
	.animate({opacity: 0}, 400);
}

// ---------------------------------------------------------------

