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
    rgb[0] *= 255;
    rgb[1] *= 255;
    rgb[2] *= 255;
    return rgb;
}

function pointInArray(pt, array) {
    for(var i=0; i<array.length; i++) {
        if((pt[0] == array[i][0]) &&
           (pt[1] == array[i][1])) {
            return true;
        }
    }
    return false;
}

function findArea(x,y, points, width, height, ctx) {
    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = [points[0]];
    while(ptr < points.length) {
        console.log("ptr: "+ptr);
        var pt = points[ptr];
        console.log("pt: "+pt);
        var surr = [
            [pt[0]-1, pt[1]],
            [pt[0]+1, pt[1]],
            [pt[0], pt[1]-1],
            [pt[0], pt[1]+1]
        ];
        for(i=0; i<4; i++) {
            console.log("Checking "+surr[i]);
            pt = surr[i];
            if(((pt[0] > 0) && (pt[0] < width)) &&
               ((pt[1] > 0) && (pt[1] < height)) &&
               (!pointInArray(pt,checked)))  {
                var c = ctx.getImageData(pt[0], pt[1], 1, 1);
                var b = true;
                for(var j=0; j<4; j++) {
                    if(c.data[j] != color[j]) {
                        b = false;
                    }
                }

                if(b) {
                    console.log("Point is valid.");
                    points.push(pt);
                }
            }
        }
        ptr++;
    }
}

function createFill(dObj){
    assignID(dObj);

    var height = canvas.height;
    var width = canvas.width;
    var x = dObj.pts[0][0];
    var y = dObj.pts[0][1];
    findArea(x,y, dObj.pts, width, height, canvas.getContext('2d'));

    dObj.draw = function(ctx) {
        ctx.save();
            var data = ctx.getImageData(0,0,1,1);
                data.data[0] = this.color[0];
                data.data[1] = this.color[1];
                data.data[2] = this.color[2];
                data.data[3] = this.opacity*255;
            for(var i=0; i<this.pts.length; i++) {
//                console.log("Coloring point "+this.pts[i]);
//                console.log(data.data);
//                console.log(this.color);
                ctx.putImageData(data, this.pts[i][0], this.pts[i][1]);
            }

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
