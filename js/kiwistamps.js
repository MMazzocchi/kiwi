var svgList = {
    'mickey':{
        svg:null,
        cx:156, cy:145,
        bounds:[0,0,313,290],
        url:'svg/mickey.svg' },
	'butterfly':{
        svg:null,
        cx:205, cy:143,
        bounds:[0,0,410,286],
        url:'svg/butterfly.svg' },
    'bnl':{
        svg:null,
        cx:197, cy:154,
        bounds:[0,0,378,302],
        url:'svg/BnL.svg' },
    'troll':{
        svg:null,
        cx:301, cy:226,
        bounds:[0,0,603,453],
        url:'svg/troll_face.svg' }
};

//console.log(stamp.xml);
// Create a bitmap from this object
function createBMP(dObj){
    var scanvas = document.createElement('canvas');
    scanvas.width = dObj.bound[2]*dObj.xScale;
    scanvas.height = dObj.bound[3]*dObj.yScale;
    var sctx = scanvas.getContext('2d');
	canvg(scanvas,dObj.url);
 //   sctx.drawSvg(dObj.url, 0, 0, 0, 0);
    dObj.scanvas = scanvas;
}

// Create a stamp from this object
function createStamp(dObj) {
    assignID(dObj);

    // Draw the stamp
    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;

        var bound = [this.bound[2],this.bound[3]];

        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.translate(this.pts[0],this.pts[1]);
            ctx.rotate(this.rotation);
            ctx.scale(xScale,yScale);
            ctx.drawImage(dObj.scanvas,-dObj.cx,-dObj.cy);
        ctx.restore();
    };

    //Return true of false if x and y are within this stamp
    dObj.select = function(x,y) {
        //"Scratch canvas" method
        var scanvas = document.createElement('canvas');
        scanvas.width = window.innerWidth;
        scanvas.height = window.innerHeight;
        var ctx = scanvas.getContext('2d');
        this.draw(ctx);
        var imageData = ctx.getImageData(x, y, 1, 1);
        return (imageData.data[3] > 0 || imageData.data[0] > 0);
    };

    // Move this stamp by dx, dy
    dObj.move = function(dx,dy) {
        this.pts[0]+=dx;
        this.pts[1]+=dy;
    };

    // Draw the rotate/scale icons in the top corners of this stamp.
    dObj.drawIcons = function(ctx) {
        var leftCorner = transformPoint(
            -(this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            (this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);
    }

    // Rotate this stamp by dr radians.
    dObj.rotate = function(dr) {
        this.rotation += dr;
    }

    // Scale this object based on a a change of dx and dy in the scale icon's position
    dObj.scale = function(dx, dy) {
        this.xScale -= (dx/(this.bound[2]/2));
        this.yScale -= (dy/(this.bound[3]/2));
    }

    // Return if x and y were inside of an icon and which icon
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            -this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
        else { return false; }
    }

    // Return the midpoint of this stamp
    dObj.midX = function() { return this.pts[0]; }
    dObj.midY = function() { return this.pts[1]; }

    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    addAction(newAct);
}

function getText(){
	$(document).keypress(function(e) {
        var key = e.which;

        // Ctrl-Z or CMD-Z for Undo   Shift-* for Redo
        if ((e.ctrlKey) && ((key == 122 || key == 90))) {  // CTRL-Z
            if (key == 122 || key == 90){            // UNDO and REDO
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            return false;
        }
        
        switch (key) {
			case 97:  // A = AIRBRUSH
			  document.body.style.cursor="url(img/spraycan.png)0 5, default";
			  SelectTool('spraycan');
              break;
            case 100: // D=DRAW
              document.body.style.cursor="url(img/paintbrush.png)0 28, default";
              SelectTool('draw');
              break;
            case 101: // E=ERASE
              document.body.style.cursor="url(img/eraser.png)0 28, default";
              SelectTool('erase');
              break;
            case 102: // F=FILL
              document.body.style.cursor="url(img/paintbucket.png), default";
              SelectTool('fill');
              break;
			case 112: // P=PENCIL
              document.body.style.cursor="url(img/pencil.png)0 28, default";
			  SelectTool('pencil');
              break;
            case 115: // S=SELECT
              document.body.style.cursor="url(img/hand-tool.png)14 6, default";
              SelectTool('select');
              break;
            case 103:  // G=DROPPER
              document.body.style.cursor="url(img/dropper.png)0 28, default";
              SelectTool('dropper');
              break;
        }
        
    });

}

function drawBalloon(ctx, x, y, w, h, radius)
{
	var r = x + w;
	var b = y + h;
	ctx.beginPath();
	ctx.strokeStyle="#000000";
	ctx.lineWidth="4";
	ctx.moveTo(x+radius, y);
	ctx.lineTo(x+radius/2, y-10);
	ctx.lineTo(x+radius * 2, y);
	ctx.lineTo(r-radius, y);
	ctx.quadraticCurveTo(r, y, r, y+radius);
	ctx.lineTo(r, y+h-radius);
	ctx.quadraticCurveTo(r, b, r-radius, b);
	ctx.lineTo(x+radius, b);
	ctx.quadraticCurveTo(x, b, x, b-radius);
	ctx.lineTo(x, y+radius);
	ctx.quadraticCurveTo(x, y, x+radius, y);
	ctx.stroke();
	ctx.fill();
}

function createTextBox(dObj) {
    assignID(dObj);

    // Draw the stamp
    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;
        var bound = [this.bound[2],this.bound[3]];

        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.translate(this.pts[0],this.pts[1]);
            ctx.rotate(this.rotation);
            ctx.scale(xScale,yScale);
			drawBalloon(ctx, -10,-20,120, 80, 10);
			ctx.font="normal 18px Comic Sans MS";
			ctx.fillStyle = "#000000"
            ctx.fillText(this.theText,0,0);
        ctx.restore();
    };

    //Return true of false if x and y are within this stamp
    dObj.select = function(x,y) {
        return false;
    };

    // Move this stamp by dx, dy
    dObj.move = function(dx,dy) {
        this.pts[0]+=dx;
        this.pts[1]+=dy;
    };

    // Draw the rotate/scale icons in the top corners of this stamp.
    dObj.drawIcons = function(ctx) {
        var leftCorner = transformPoint(
            -(this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            (this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);
    }

    // Rotate this stamp by dr radians.
    dObj.rotate = function(dr) {
        this.rotation += dr;
    }

    // Scale this object based on a a change of dx and dy in the scale icon's position
    dObj.scale = function(dx, dy) {
        this.xScale -= (dx/(this.bound[2]/2));
        this.yScale -= (dy/(this.bound[3]/2));
    }

    // Return if x and y were inside of an icon and which icon
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            -this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
        else { return false; }
    }

    // Return the midpoint of this stamp
    dObj.midX = function() { return this.pts[0]; }
    dObj.midY = function() { return this.pts[1]; }

    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    addAction(newAct);
}

