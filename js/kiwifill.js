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
//   console.log("Attempting to match:")
//   console.log(c1);
//   console.log(c2);
   for(var i=0; i<3; i++) {
       if(Math.abs(c1[i] - c2[i]) > 50) { return false }
   }
   return true;
}

function validPoint(x,y, color, checked, ctx, cData, width) {
    if(checked[""+x+","+y] == 1) {
        return false;
    }
    return matchColor(color, getData(x,y,cData,width));
//    return matchColor(color, ctx.getImageData(x,y,1,1).data);
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
//        console.log("ptr: "+ptr);
        var pt = queue[ptr];
//        console.log("pt from queue: "+pt);
//        console.log("Looking west...");
        segmentN = false;
        segmentS = false;

        var sx = pt[0];

        while(validPoint(sx,pt[1],color,checked,ctx,cData,width)) {
//            console.log("pt: "+pt);
            checked[""+sx+","+pt[1]] = 1;
            if(validPoint(sx,pt[1]+1,color,checked,ctx,cData,width)) {
                if(!segmentN) {
                    queue.push([sx, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }

            if(validPoint(sx,pt[1]-1,color,checked,ctx,cData,width)) {
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
        segments.push([pt,[sx+1,pt[1]]]);

        pt = [queue[ptr][0]+1, queue[ptr][1]];
//        console.log("Looking east...");
        sx = pt[0];

        segmentN = false;
        segmentS = false;

        while(validPoint(sx,pt[1],color,checked,ctx,cData,width)) {
            checked[""+sx+","+pt[1]] = 1;
            if(validPoint(sx,pt[1]+1,color,checked,ctx,cData,width)) {
                if(!segmentN) {
                    queue.push([sx, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }
            if(validPoint(sx,pt[1]-1,color,checked,ctx,cData,width)) {
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

function findArea(x,y, points, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");

    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [points[0]];

    var cData = ctx.getImageData(0,0,width,height).data;

    var segmentN = false;
    var segmentS = false;

    while(ptr < queue.length) {
//        console.log("ptr: "+ptr);
        var pt = queue[ptr];
//        console.log("pt from queue: "+pt);
//        console.log("Looking west...");
        segmentN = false;
        segmentS = false;

        while(validPoint(pt[0],pt[1],color,checked,ctx,cData,width)) {
//            console.log("pt: "+pt);
            points.push(pt);
            checked[""+pt[0]+","+pt[1]] = 1;
            if(validPoint(pt[0],pt[1]+1,color,checked,ctx,cData,width)) {
                if(!segmentN) {
                    queue.push([pt[0], pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }

            if(validPoint(pt[0],pt[1]-1,color,checked,ctx,cData,width)) {
                if(!segmentS) {
                    queue.push([pt[0], pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            pt = [pt[0]-1, pt[1]];
        }
        pt = queue[ptr];
//        console.log("Looking east...");

        segmentN = false;
        segmentS = false;

        while(validPoint(pt[0],pt[1],color,checked,ctx,cData,width)) {
            points.push(pt);
            checked[""+pt[0]+","+pt[1]] = 1;
            if(validPoint(pt[0],pt[1]+1,color,checked,ctx,cData,width)) {
                if(!segmentN) {
                    queue.push([pt[0], pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }
            if(validPoint(pt[0],pt[1]-1,color,checked,ctx,cData,width)) {
                if(!segmentS) {
                    queue.push([pt[0], pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            pt = [pt[0]+1, pt[1]];
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
//    findArea(x,y, dObj.pts, width, height, canvas.getContext('2d'));
    dObj.segments = [];
    findSegments(x,y,dObj.segments, width, height, canvas.getContext('2d'));

    dObj.draw = function(ctx) {
        ctx.save();
/*            var data = ctx.getImageData(0,0,1,1);
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
*/
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.opacity;
        for(var i=0; i<this.segments.length; i++) {
            var seg = this.segments[i];
            ctx.moveTo(seg[0][0], seg[0][1]);
            ctx.lineTo(seg[1][0], seg[1][1]);
        }
        ctx.stroke();    
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
