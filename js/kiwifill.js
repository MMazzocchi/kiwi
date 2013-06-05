var highlight = -1;
var gSectors;

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
   var r = c1[0]/c2[0];

   for(var i=0; i<3; i++) {
       if((Math.abs(c1[i] - c2[i]) > 100) || 
         (Math.abs((c2[i]/c1[i]) - r)/r) > .8) {
             return false;
         }
   } 
   return true;
}

function beenChecked(x,y,checked) {
    console.log(checked);
    return (checked[""+x+","+y] == 1);
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

function searchSegment(pt, color, checked, ctx, cData, width, height, direc) {
    var segmentN = false;
    var segmentS = false;

    var nQueue = [];
    var sQueue = [];

    //ex is East x; it'll be the farthest point east we can go in the current segment
    var ex = pt[0];

    while(validPoint(ex,pt[1],color,checked,ctx,cData,width,height)) {
        checked[""+ex+","+pt[1]] = 1;
        if(validPoint(ex,pt[1]+1,color,checked,ctx,cData,width,height)) {
            if(!segmentN) {
                nQueue.push([ex, pt[1]+1]);
                segmentN = true;
            }
        } else {
            if(segmentN) {
                segmentN = false;
            }
        }
        if(validPoint(ex,pt[1]-1,color,checked,ctx,cData,width,height)) {
            if(!segmentS) {
                sQueue.push([ex, pt[1]-1]);
                segmentS = true;
            }
        } else {
            if(segmentS) {
                segmentS = false;
            }
        }
        ex--;
    }
    nQueue = nQueue.reverse();
    sQueue = sQueue.reverse();

    //Reset the point so we can start looking west
    var wx = pt[0]+1;

    //Eliminate duplicate segments
    segmentN = validPoint(wx-1,pt[1]+1,color,checked,ctx,cData,width,height);
    segmentS = validPoint(wx-1,pt[1]-1,color,checked,ctx,cData,width,height);

    //Start going west
    while(validPoint(wx,pt[1],color,checked,ctx,cData,width,height)) {
        checked[""+wx+","+pt[1]] = 1;
        if(validPoint(wx,pt[1]+1,color,checked,ctx,cData,width,height)) {
            if(!segmentN) {
                nQueue.push([wx, pt[1]+1]);
                segmentN = true;
            }
        } else {
            if(segmentN) {
                segmentN = false;
            }
        }

        if(validPoint(wx,pt[1]-1,color,checked,ctx,cData,width,height)) {
            if(!segmentS) {
                sQueue.push([wx, pt[1]-1]);
                segmentS = true;
            }
        } else {
            if(segmentS) {
                segmentS = false;
            }
        }
        wx++;
    }

    var data = {
        ex: ex,
        wx: wx,
        nQueue: nQueue,
        sQueue: sQueue,
    };
    return data;
} 

function matchSeams(newSeam, oppSeams, seams) {
    var match = false;
    for(var i=0; i<oppSeams.length; i++) {
        var oSeam = oppSeams[i];
        console.log("Comparing "+newSeam+" and "+oSeam);
        if((Math.abs(newSeam[0][1] - oSeam[0][1]) < 2) && 
/*           ((newSeam[0][0] > oSeam[1][0]) || 
            (newSeam[1][0] > oSeam[0][0]))) {
*/          (!(newSeam[1][0] < oSeam[0][0]))) {
            match = true;
            console.log("Matched "+newSeam+" and "+oSeam);
            return(oSeam);
        }
    }
    if(!match) {
        console.log("New seam added: "+newSeam);
        seams.push(newSeam);
        return [];
    }
}

function findOneBigHugeFuckingSector(dObj, x, y, sector, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");
    x = Math.round(x); y = Math.round(y);
    var nPtr = 0;
    var sPtr = 0;
    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [];
    var nQueue = [];
    var sQueue = [];
    var sectors = {};
    var cData = ctx.getImageData(0,0,width,height).data;
    var sectorPtr = 0;

    function createSeed(seed) {
        var sector = {
            seed: seed,
            id: sectorPtr,
            lPts: [],
            rPts: [],
        };
        sectors[sector.id] = sector;
        queue.push(sector);
        sectorPtr++;
        return sector.id;
    }

    createSeed([x,y]);

    while(ptr < queue.length) {

        //queue holds "sector seeds"; these are hashes that hold their intitial seed point and will become sectors
        var sector = queue[ptr];
        var pt = sector.seed;

        console.log("Expanding sector "+sector.id+".");

        var data = searchSegment(pt, color, checked, ctx, cData, width, height, 'both');

        //ex and wx now coorespond to the endpoints of this segment. nQueue and sQueue hold the seeds for the segments to the North and South of us
        sector.lPts.push([data.ex,pt[1]]);
        sector.rPts.push([data.wx,pt[1]]);

        //If there are 2+ or no segments above us, the segment seeds of nQueue become sector seeds, and the children of the current sector
        if(data.nQueue.length != 1) {
            for(var i=0; i<data.nQueue.length; i++) {
                var childId = createSeed(data.nQueue[i]);
                sector.lPts.push(childId);
                console.log("From initial N exploration, found sector "+childId+" seeded by "+data.nQueue[i]);
            }
        } else {
            var nQueue = data.nQueue;
            while(nQueue.length == 1) {
                pt = nQueue[0];
                var nData = searchSegment(pt, color, checked, ctx, cData, width, height, 'north');
                nQueue = nData.nQueue;

                // When you write code like this, it's time to take a good hard look at where your life is going.
                var seChildren = [];

                for(var i=0; i<nData.sQueue.length; i++) {
                    var childId = createSeed(nData.sQueue[i]);

                    console.log("From N->S, found sector "+childId+" seeded by "+nData.sQueue[i]);

                    if(nData.sQueue[i][0] > pt[0]) { 
                        sector.rPts.splice(0,0,childId);
                    } else {
                        seChildren.push(childId);
                    }
                }
                sector.lPts = sector.lPts.concat(seChildren.reverse());
                sector.rPts.splice(0,0,[nData.wx,pt[1]]);
                sector.lPts.push([nData.ex,pt[1]]);

            }
            for(var i=0; i<nQueue.length; i++) {
                var childId = createSeed(nQueue[i]);
                sector.lPts.push(childId);
                console.log("From N->N, found sector "+childId+" seeded by "+nQueue[i]);
            }
        }

        //If there are 2+ or no segments below us, the segment seeds of sQueue become sector seeds
        if(data.sQueue.length != 1) {
            for(var i=0; i<data.sQueue.length; i++) {
                var childId = createSeed(data.sQueue[i]);
                sector.rPts.push(childId);
                console.log("From initial S exploration, found sector "+childId+" seeded by "+data.sQueue[i]);
            }
        } else {
            var sQueue = data.sQueue;
            while(sQueue.length == 1) {
                pt = sQueue[0];
                var sData = searchSegment(pt, color, checked, ctx, cData, width, height, 'south');
                sQueue = sData.sQueue;

                var neChildren = [];

                for(var i=0; i<sData.nQueue.length; i++) {
                    var childId = createSeed(sData.nQueue[i]);

                    console.log("From S->N, found sector "+childId+" seeded by "+sData.nQueue[i]);

                    if(sData.nQueue[i][0] > pt[0]) {
                        sector.rPts.push(childId);
                    } else {
                        neChildren.push(childId);
                    }
                }
                sector.lPts = neChildren.reverse().concat(sector.lPts);
                sector.rPts.push([sData.wx,pt[1]]);
                sector.lPts.splice(0,0,[sData.ex,pt[1]]);

            }
            var sChildren = [];
            for(var i=0; i<sQueue.length; i++) {
                var childId = createSeed(sQueue[i]);
                sChildren.push(childId);
                console.log("From S->S, found sector "+childId+" seeded by "+sQueue[i]);
            }
            sector.rPts = sector.rPts.concat(sChildren.reverse());

        }
        ptr++;
    }

    // Now we have a bunch of sectors. Time to add them all together

    gSectors = sectors;

    var botSeams = [];
    var topSeams = [];

    //Process this set of points, calling processSector if needed
    function processPoints(seed, points) {
        var y = seed[1];
        var pts = [];

        for(var i=0; i<points.length; i++) {
            if(typeof points[i] == "object") {
                //This is a point. Add it to the list
                pts.push(points[i]);
                y = points[i][1];
            } else {
                console.log("Encountered sector "+points[i]+" after "+points[i-1]);
                //This is a sector's id. Recusively get its points and add them to the list
                var child = sectors[points[i]];

                console.log("Comparing y: "+y+" and seed: "+child.seed[1]);
                if(child.rPts[0][1] == y) { y = points[i+1][1]; }

                if(child.rPts[0][1] < y) {
                    //This sector was above us. Process its points in order
                    console.log("New sector was above old");
                    var childPts = processSector(child.id, 1);
                    pts = pts.concat(childPts);
                } else {
                    console.log("New sector was below old");
                    //This sector was below us. Process its points in reverse.
                    var childPts = processSector(child.id, -1);
                    pts = pts.concat(childPts);
                }
            }
        }
        return pts;
    }

    // Recursively find the list of points defining this sector and its children
    function processSector(id, mode) {
        //mode ==  1 : rPts, then lPts
        //mode == -1 : lPts, then rPts

        var sector = sectors[id];
        var pts = [];

        if(sector.rPts.length == 1) { return []; }

        switch(mode) {
            case 1:
                console.log("Processing sector "+id+" rPts.");
                pts = pts.concat(processPoints(sector.seed, sector.rPts));
                var newSeam = [sector.lPts[0],pts[pts.length-1]];
//                pts = pts.concat(matchSeams(newSeam, botSeams, topSeams));
                console.log("Processing sector "+id+" lPts.");
                pts = pts.concat(processPoints(sector.seed, sector.lPts));
                break;
            case -1:
                console.log("Processing sector "+id+" lPts.");
                pts = pts.concat(processPoints(sector.seed, sector.lPts));
                var newSeam = [pts[pts.length-1], sector.rPts[0]];
//                pts = pts.concat(matchSeams(newSeam, topSeams, botSeams));
                console.log("Processing sector "+id+" rPts.");
                pts = pts.concat(processPoints(sector.seed, sector.rPts));
                break;

        }
        return pts;
    }

    var pts = processSector(0,1);

    if(dObj.lCorner == -1) {
        dObj.lCorner = [pts[0][0], pts[0][1]];
        dObj.rCorner = [pts[0][0], pts[0][1]];
    }
    for(var i=0; i<pts.length; i++) {
        var sPt = pts[i];
        if(sPt[0] < dObj.lCorner[0]) { dObj.lCorner[0] = sPt[0]; }
        if(sPt[0] > dObj.rCorner[0]) { dObj.rCorner[0] = sPt[0]; }
        if(sPt[1] < dObj.lCorner[1]) { dObj.lCorner[1] = sPt[1]; }
        if(sPt[1] > dObj.rCorner[1]) { dObj.rCorner[1] = sPt[1]; }
    }
    dObj.mx = Math.round((dObj.lCorner[0]+dObj.rCorner[0])/2);
    dObj.my = Math.round((dObj.lCorner[1]+dObj.rCorner[1])/2);

    dObj.pts = pts;
}

function findSectors(dObj, x, y, sectors, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");
    x = Math.round(x); y = Math.round(y);
    var nPtr = 0;
    var sPtr = 0;
    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [[x,y]];
    var nQueue = [];
    var sQueue = [];

    var cData = ctx.getImageData(0,0,width,height).data;

    while(ptr < queue.length) {

        //queue holds "sector seeds"; the initial point we use to find the sector
        var pt = queue[ptr];

        //lPts/rPts will hold the points bounding the left and right sides of this sector
        var lPts = [];
        var rPts = [];

        var data = searchSegment(pt, color, checked, ctx, cData, width, height, 'both');

        //ex and wx now coorespond to the endpoints of this segment. nQueue and sQueue hold the seeds for the segments to the North and South of us
        lPts.push([data.ex,pt[1]]);
        rPts.push([data.wx,pt[1]]);

        //If there are 2+ or no segments above us, the segment seeds of the nQueue become sector seeds
        if(data.nQueue.length != 1) {
            queue = queue.concat(data.nQueue);
        } else {
            var nQueue = data.nQueue;
            while(nQueue.length == 1) {
                pt = nQueue[0];
                var nData = searchSegment(pt, color, checked, ctx, cData, width, height, 'north');
                //Account for joints between sectors
                if(nData.sQueue.length > 0) {
                    for(var i=0; i<nData.sQueue.length; i++) {
                        var sPt = nData.sQueue[i];
                        if(sPt[0] < pt[0]) {
                            lPts.push([sPt[0], pt[1]-1]);
                        } else {
                            rPts.splice(0,0,[sPt[0], pt[1]-1]);
                        }
                    }
                    lPts.push([nData.ex,pt[1]-1]);
                    rPts.splice(0,0,[nData.wx,pt[1]-1]);
                } else {
                    lPts.push([nData.ex,pt[1]]);
                    rPts.splice(0,0,[nData.wx,pt[1]]);
                }
                nQueue = nData.nQueue;
                queue = queue.concat(nData.sQueue);
            }
            if(nQueue.length > 0) {
                lPts[lPts.length-1][1] += 1;
                rPts[0][1] += 1;
            }
            queue = queue.concat(nQueue);
        }

        //If there are 2+ or no segments below us, the segment seeds of sQueue become sector seeds
        if(data.sQueue.length != 1) {
            queue = queue.concat(data.sQueue);
        } else {
            var sQueue = data.sQueue;
            while(sQueue.length == 1) {
                pt = sQueue[0];
                var sData = searchSegment(pt, color, checked, ctx, cData, width, height, 'south');
                if(sData.nQueue.length > 0) {
                    for(var i=0; i<sData.nQueue.length; i++) {
                        var nPt = sData.nQueue[i];
                        if(nPt[0] > pt[0]) {
                            rPts.push([nPt[0], pt[1]+1]);
                        } else {
                            lPts.splice(0,0,[nPt[0], pt[1]+1]);
                        }
                    }
                    lPts.splice(0,0,[sData.ex,pt[1]+1]);
                    rPts.push([sData.wx,pt[1]+1]);
                } else {
                    lPts.splice(0,0,[sData.ex,pt[1]]);
                    rPts.push([sData.wx,pt[1]]);
                }
                sQueue = sData.sQueue;
                queue = queue.concat(sData.nQueue);
            }
            if(sQueue.length > 0) {
                lPts[0][1] -= 1;
                rPts[rPts.length-1][1] -= 1;
            }
            queue = queue.concat(sQueue);
        }

        //Close up this sector
        var sector = lPts.concat(rPts);
//        sector[0][1] -= 1;
//        sector[sector.length-1][1] -= 1;
        sectors.push(sector);

        if(dObj.lCorner == -1) { 
            dObj.lCorner = [sector[0][0], sector[0][1]];
            dObj.rCorner = [sector[0][0], sector[0][1]];
        }
        for(var i=0; i<sector.length; i++) {
            var sPt = sector[i];
            if(sPt[0] < dObj.lCorner[0]) { dObj.lCorner[0] = sPt[0]; }
            if(sPt[0] > dObj.rCorner[0]) { dObj.rCorner[0] = sPt[0]; }
            if(sPt[1] < dObj.lCorner[1]) { dObj.lCorner[1] = sPt[1]; }
            if(sPt[1] > dObj.rCorner[1]) { dObj.rCorner[1] = sPt[1]; }
        }
        ptr++;
    }
    dObj.mx = Math.round((dObj.lCorner[0]+dObj.rCorner[0])/2);
    dObj.my = Math.round((dObj.lCorner[1]+dObj.rCorner[1])/2);
}


function createFill(dObj){
    assignID(dObj);

    var height = canvas.height;
    var width = canvas.width;
    var x = dObj.pts[0][0];
    var y = dObj.pts[0][1];
    dObj.sectors = [];
    findSectors(dObj,x,y,dObj.sectors,width,height,canvas.getContext('2d'));
    findOneBigHugeFuckingSector(dObj,x,y,[],width,height,canvas.getContext('2d'));
    dObj.draw = function(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = "black";//this.color;

//        ctx.translate(1,0);
        ctx.translate(Math.round(this.mx), Math.round(this.my));
        ctx.rotate(this.rotation);
        ctx.scale(this.xScale, this.yScale);

/*
        for(var i=0; i<this.sectors.length; i++) {
            if(i == this.highlight) { 
                ctx.fillStyle = "red";
            } else {
                ctx.fillStyle = this.color;
            }
            var sector = this.sectors[i];
            ctx.beginPath();
            ctx.moveTo(sector[0][0]-this.mx, sector[0][1]-this.my);
            for(var j=1; j<sector.length; j++) {
                ctx.lineTo(sector[j][0]-this.mx, sector[j][1]-this.my);
            }
            ctx.closePath();
            if(sector.length == 2) { ctx.stroke(); }
            else { ctx.fill(); }
        }
*/
        ctx.beginPath();
        ctx.moveTo(this.pts[0][0]-this.mx, this.pts[0][1]-this.my);
        for(var i=1; i<this.pts.length; i++) {
            ctx.lineTo(this.pts[i][0]-this.mx, this.pts[i][1]-this.my);
        }
        ctx.closePath();
        ctx.fill();
//        ctx.stroke();
        ctx.restore();
    };
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
    dObj.move = function(dx,dy) {
/*
        for(var i=0; i<this.sectors.length; i++) {
            for(var j=0; j<this.sectors[i].length; j++) {
                this.sectors[i][j][0]+=dx;
                this.sectors[i][j][1]+=dy;
            }
        }
*/
        for(var i=0; i<this.pts.length; i++) {
            this.pts[i][0]+=dx;
            this.pts[i][1]+=dy;
        }
        this.lCorner[0]+=dx;
        this.rCorner[0]+=dx;
        this.lCorner[1]+=dy;
        this.rCorner[1]+=dy;

        this.mx += dx;
        this.my += dy;
    };
    dObj.drawIcons = function(ctx) {
        var mobileX = (orienting() ? 32 : 0);
        var mobileY = mobileX;

        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        var scaleIcon = document.getElementById('resize_icon');
        ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        var rotateIcon = document.getElementById('rotate_icon');
        ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);

        var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        var downIcon = document.getElementById('arrow_down');
        ctx.drawImage(downIcon, leftBottom[0], leftBottom[1]-32);

        var rightBottom = transformPoint(
            this.rCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        var upIcon = document.getElementById('arrow_up');
        ctx.drawImage(upIcon, rightBottom[0]-32, rightBottom[1]-32);
    }
    dObj.rotate = function(dr) {
        this.rotation += dr;
    };
    dObj.scale = function(dx, dy) {
        if((this.rCorner[0] == this.lCorner[0])) { this.xScale -= dx/this.width; }
        else { this.xScale -= (dx/((this.rCorner[0]-this.lCorner[0])/2)); }
        if((this.rCorner[1] == this.lCorner[1])) { this.yScale -= dy/this.width; }
        else { this.yScale -= (dy/((this.rCorner[1]-this.lCorner[1])/2)); }
    };
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
                var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
        var rightBottom = transformPoint(
            this.rCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
        else if(distance([x,y],[rightBottom[0], rightBottom[1]]) < 32) { return 'layerUp'; }
        else if(distance([x,y],[leftBottom[0], leftBottom[1]]) < 32) { return 'layerDown'; }
        else { return false; }
    }
    dObj.midX = function() { return this.mx; }
    dObj.midY = function() { return this.my; }


    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
			selectedId = -1;
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
}
