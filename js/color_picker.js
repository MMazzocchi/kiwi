// Simple ColorPicker functionality

function ColorPicker()
{
	var CPW = 90;
	var CPH = 300;
	var xm = 0;

	this.curH = 0;
	this.curS = 255;
	this.curL = 50;

	var lastL = -1;

	var cpdisc = document.createElement('canvas');
	cpdisc.width = CPW;
	cpdisc.height = CPH;

	// Init Disc
	var dc = cpdisc.getContext('2d');
	for (var py = 0; py < CPH; ++py) {
		for (var px = 0; px < CPW; ++px) {
			var h = py/CPH*360;
			var l = 100-(px/CPW*100);
			var s = this.curS;
			dc.fillStyle = getHSLA( Math.floor(h), Math.floor(s), Math.floor(l), 1 );
			dc.fillRect(px,py,1,1);
		}
	}

	var cpldisc = document.createElement('canvas');
	cpldisc.width = CPW;
	cpldisc.height = CPH;

	var cpcanvas = document.getElementById('colorpicker_canvas');
	cpcanvas.width = CPW+xm*2;
	cpcanvas.height = CPH+xm*2;

	var draw = cpcanvas.getContext('2d');

	this.updateColor = function()
	{
		curColor = getHSLA( this.curH, this.curS, this.curL, alpha );
		this.Refresh();
	}

	this.Refresh = function()
	{
		if (lastL != this.curL) {
			lastL = this.curL;
			var dc = cpldisc.getContext('2d');
			dc.drawImage(cpdisc,0,0);
		}
		var dc = cpcanvas.getContext('2d');
		dc.clearRect(0,0,CPW+xm*2,CPH+xm*2);

		dc.save();
		dc.lineWidth = 2;
		dc.strokeStyle = '#000';
		dc.shadowColor = '#000';
		dc.shadowBlur = 6;
		dc.shadowOffsetX = 2;
		dc.shadowOffsetY = 2;
		dc.beginPath();
		dc.stroke();
		dc.restore();

		dc.drawImage( cpldisc, xm, xm);
		dc.save();
		dc.strokeStyle = '#000';
		dc.beginPath();
		dc.lineWidth = 2;
		dc.beginPath();
		dc.stroke();
		dc.restore();

		py = this.curH*CPH/360+xm;
		px = (100-this.curL)*CPW/100+xm;
		h=py/200*360
		dc.save();
		dc.fillStyle = curColor;
		dc.lineWidth = 1;
		dc.strokeStyle = '#FFF';
		dc.beginPath();
		dc.arc(px, py, 10, 0, 2 * Math.PI, false); // this is the selector circle

		dc.save();
		dc.shadowColor = '#000';
		dc.shadowBlur = 6;
		dc.shadowOffsetX = 2;
		dc.shadowOffsetY = 2;
		dc.fill();
		dc.restore();
		dc.stroke();
		dc.restore();
		
		$('#dropper span').css("background-color", curColor);
	}

	this.setRGB = function(r,g,b)
	{
		// !! Convert r,g,b to HSL 360,100,100
		this.setHSL(h,s,l);
	}

	this.setHSL = function(h,s,l)
	{
		this.curH = h;
		this.curS = s;
		this.curL = l;
		curColor = getHSLA(h,s,l,alpha);

		this.Refresh();
	}

	this.handleClick = function(px,py)
	{
		if (px >= xm && py >= xm && px < CPW+xm && py < CPH+xm)
		{
			var h = (py-xm)/CPH*360;
			var l = 100-((px-xm)/CPW*100);
			var s = this.curS;
			this.curH = Math.round(h);
			this.curL = Math.round(l);
			curColor = getHSLA( this.curH, this.curS, this.curL, alpha );
			myCP.Refresh();
		}
	}

	var isDragging = false;

	function HandleColorClick(e)
	{
		e.preventDefault();
		var ofst = $(this).offset();
		var first = e;
		if (e.originalEvent !== undefined && "touches" in e.originalEvent) 
			first = e.originalEvent.touches[0];
		var px = first.pageX - ofst.left;
		var py = first.pageY - ofst.top;
		myCP.handleClick(px,py);
		isDragging = true;
	}

	function HandleColorDrag(e)
	{
		if (isDragging) {
			e.preventDefault();
			var ofst = $(this).offset();
			var first = e;
			if (e.originalEvent !== undefined && "touches" in e.originalEvent) 
				first = e.originalEvent.touches[0];
			var px = first.pageX - ofst.left;
			var py = first.pageY - ofst.top;
			myCP.handleClick(px,py);
		}
	}

	function HandleColorUp(e)
	{
		isDragging = false;
	}


	$('#colorpicker_canvas').mousedown( HandleColorClick );
	$('#colorpicker_canvas').mousemove( HandleColorDrag );
	$('#colorpicker_canvas').mouseup( HandleColorUp );
	$('#colorpicker_canvas').bind('touchstart', HandleColorClick );
	$('#colorpicker_canvas').bind('touchmove', HandleColorDrag );
	$('#colorpicker_canvas').bind('touchend', HandleColorUp );
}

function getHSLA(h,s,l,a) {
	return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
}

// from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}
