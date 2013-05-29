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

function matchColor(c1, c2) {
   for(var i=0; i<3; i++) {
       if(Math.abs(c1[i] - c2[i]) > 100) { return false }
   }
   return true;
}

function validPoint(x,y, color, checked, ctx, cData, width, height) {
    if((x < 0) || (x > width) ||
       (y < 0) || (y > height)) {
        return false;
    }
    if(checked[""+x+","+y] == 1) {
        return false;
    }
    return matchColor(color, getData(x,y,cData,width));
}

function getData(x, y, cData, width) {
    var index = (x+(y*(width)))*4;
    var data = [
        cData[index+0],
        cData[index+1],
        cData[index+2],
        cData[index+3]
    ];
    return data;
}

function findSegments(x,y, segments, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");

    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [[x,y]];

    var cData = ctx.getImageData(0,0,width,height).data;

    var segmentN = false;
    var segmentS = false;

    while(ptr < queue.length) {
        var pt = queue[ptr];
        segmentN = false;
        segmentS = false;

        var sx = pt[0];

        while(validPoint(sx,pt[1],color,checked,ctx,cData,width,height)) {
            checked[""+sx+","+pt[1]] = 1;
            if(validPoint(sx,pt[1]+1,color,checked,ctx,cData,width,height)) {
                if(!segmentN) {
                    queue.push([sx, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }

            if(validPoint(sx,pt[1]-1,color,checked,ctx,cData,width,height)) {
                if(!segmentS) {
                    queue.push([sx, pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            sx--;
        }
        segments.push([pt,[sx,pt[1]]]);

        pt = [queue[ptr][0]+1, queue[ptr][1]];
        sx = pt[0];

        segmentN = false;
        segmentS = false;

        while(validPoint(sx,pt[1],color,checked,ctx,cData,width,height)) {
            checked[""+sx+","+pt[1]] = 1;
            if(validPoint(sx,pt[1]+1,color,checked,ctx,cData,width,height)) {
                if(!segmentN) {
                    queue.push([sx, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }
            if(validPoint(sx,pt[1]-1,color,checked,ctx,cData,width,height)) {
                if(!segmentS) {
                    queue.push([sx, pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            sx++;
        }

        segments.push([[pt[0]-1,pt[1]],[sx,pt[1]]]);
        ptr++;
    }

}

function createFill(dObj){
    assignID(dObj);

    var height = canvas.height;
    var width = canvas.width;
    var x = dObj.pts[0][0];
    var y = dObj.pts[0][1];
    dObj.segments = [];
    findSegments(x,y,dObj.segments, width, height, canvas.getContext('2d'));

    dObj.draw = function(ctx) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        for(var i=0; i<this.segments.length; i++) {
            var seg = this.segments[i];
            ctx.moveTo(seg[0][0], seg[0][1]);
            ctx.lineTo(seg[1][0], seg[1][1]);
        }
        ctx.stroke(); 
        ctx.restore();

    };
    dObj.select = function() {
        return false;
    }

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
