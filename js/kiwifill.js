function hslToRgb(h, s, l) {
    var c = (1 - Math.abs((2*l)-1))*s;
    var h2 = h/60;
    var x = c*(1-Math.abs((h2%2)-1));
    var rgb1 = [0,0,0];
    if(h2 < 1) {
        rgb1 = [c,x,0];
    } else if(h2 < 2) {
        rgb1 = [x,c,0];
    } else if(h2 < 3) {
        rgb1 = [0,c,x];
    } else if(h2 < 4) {
        rgb1 = [0,x,c];
    } else if(h2 < 5) {
        rgb1 = [x,0,c];
    } else if(h2 < 6) {
        rgb1 = [c,0,x];
    }
    var m = l-(c/2);
    var rgb = [rgb1[0]+m, rgb1[1]+m, rgb1[2]+m];
    if(rgb[0] < 0) { rgb[0] = 0; }
    if(rgb[1] < 0) { rgb[1] = 0; }
    if(rgb[2] < 0) { rgb[2] = 0; }
    return rgb;
}

function findArea(x,y, points, width, height, ctx) {
    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    while(ptr < points.length) {
        var pt = points[ptr];
        if(((pt[0] > 0) && (pt[0] < width)) &&
           ((pt[1] > 0) && (pt[1] < height))) {
            var c = ctx.getImageData(pt[0], pt[1], 1, 1);
            //CONTINUE FILLING
        }
    }
}

function createFill(dObj){
    assignID(dObj);

    dObj.draw = function(ctx) {
        ctx.save();
            var height = canvas.height;
            var width = canvas.width;
//            var img = ctx.getImageData(0,0,width,height);
            var x = dObj.pts[0][0];
            var y = dObj.pts[0][1];
//            var cx = (y*width+x);
//            var fillColor = curColor;
//            console.log(curColor);
            findArea(x,y, dObj.pts, width. height, ctx);

        ctx.restore();
    };

    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
}
