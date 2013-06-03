// Simple ColorPicker functionality

function ColorPicker()
{
  var CPW = 135;
  var CPH = 135;
  var cx = CPW/2;
  var cy = CPH/2;
  var xm = 32;
  
  this.curH = 0;
  this.curS = 100;
  this.curL = 50;
  
  var lastL = -1;
  
  var cpdisc = document.createElement('canvas');
  cpdisc.width = CPW;
  cpdisc.height = CPH;

  // Init Disc
  var dc = cpdisc.getContext('2d');
  for (var py = 0; py < CPH; ++py) {
    for (var px = 0; px < CPW; ++px) {
      var dx = px - cx;
      var dy = py - cy;
      var a = Math.atan2(dy,dx);
      var d = Math.sqrt(dx*dx+dy*dy);
      var h = a*180/Math.PI;
      if (h < 0) {
        h += 360;
      }
      var s = d * 100 / cx;
      var l = this.curL;
      if (d < cx-1) {
        dc.fillStyle = getHSLA( Math.floor(h), Math.floor(s), 50, 1 );
        dc.fillRect(px,py,1,1);
      }
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
      dc.save();
      if (this.curL < 50) {
        dc.globalAlpha = alpha;
        dc.fillStyle = '#000000';
        dc.beginPath();
        dc.arc(cx, cy, cx-1, 0, 2 * Math.PI, false);
        dc.fill();
      }
      else if (this.curL > 50) {
        dc.globalAlpha = alpha;
        dc.fillStyle = '#FFFFFF';
        dc.beginPath();
        dc.arc(cx, cy, cx-1, 0, 2 * Math.PI, false);
        dc.fill();
      }
      dc.restore();
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
    dc.arc(cx+xm, cy+xm, cx-1, 0, 2 * Math.PI, false);
    dc.stroke();
    dc.restore();

    dc.drawImage( cpldisc, xm, xm);
    dc.save();
    dc.strokeStyle = '#000';
    dc.beginPath();
    dc.lineWidth = 2;
    dc.beginPath();
    dc.arc(cx+xm, cy+xm, cx-1, 0, 2 * Math.PI, false);
    dc.stroke();
    dc.restore();

    px = xm+cx + Math.cos( this.curH * Math.PI/180 ) * this.curS * cx/100;
    py = xm+cy + Math.sin( this.curH * Math.PI/180 ) * this.curS * cy/100;
    dc.save();
    dc.fillStyle = curColor;
    dc.lineWidth = 1;
    dc.strokeStyle = '#FFF';
    dc.beginPath();
    dc.arc(px, py, thickness/2, 0, 2 * Math.PI, false);

      dc.save();
      dc.shadowColor = '#000';
      dc.shadowBlur = 6;
      dc.shadowOffsetX = 2;
      dc.shadowOffsetY = 2;
      dc.fill();
      dc.restore();
    dc.stroke();
    dc.restore();
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
      var dx = px - (cx+xm);
      var dy = py - (cy+xm);
      var a = Math.atan2(dy,dx);
      var d = Math.sqrt(dx*dx+dy*dy);
      
      if (d > cx+2)
        return;
      var h = a*180/Math.PI;
      if (h < 0) {
          h += 360;
       }
      var s = d * 100 / cx;
      var l = this.curL;
      this.curH = Math.round(h);
      this.curS = Math.round(s);
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
    //if ("keydown" in e.originalEvent || "touches" in e.originalEvent) {
	if ($.inArray('keydown', e.originalEvent) > -1 || $.inArray('touches', e.originalEvent) > -1) {
      first = e.originalEvent.touches[0];
    }
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
      if (e.originalEvent.type === "keydown" || "touches" in e.originalEvent) {
        first = e.originalEvent.touches[0];
      }
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
	cpcanvas.addEventListener('touchmove', HandleColorDrag );
	cpcanvas.addEventListener('touchstart', HandleColorClick );
    cpcanvas.addEventListener('touchend', HandleColorUp );
}

 // Color Utility Functions - currently unused - using rgb(r,g,b) or rgba(r,g,b,a) or hsla(h,s,l,a) instead
function getRGB(r,g,b) {
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function getRGBA(r,g,b,a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
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
