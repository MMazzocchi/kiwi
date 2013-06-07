var selectedId = -1;
var xOld;
var yOld;
var xFirst;
var yFirst;
var dragMode = '';
var shift = false;
var xScaleOld;
var yScaleOld;

function beginScale(id, x, y) {
    xScaleOld = objectList[id].xScale;
    yScaleOld = objectList[id].yScale;
    var mx = objectList[id].midX();
    var my = objectList[id].midY();
    var pt = transformPoint(x-mx,y-my,
        mx, my,
        1, 1,
        objectList[id].rotation);
    xOld = pt[0]; yOld = pt[1];
    xFirst = pt[0]; yFirst = pt[1];
}

function translate(id, x, y) {
    var dx = x-xOld;
    var dy = y-yOld;
    objectList[id].move(dx,dy);
    xOld = x;
    yOld = y;
}

function rotate(id, x, y) {
    var obj = objectList[id];
    var theta = Math.atan2(y-obj.midY(), x-obj.midX());
    var pTheta = Math.atan2(yOld-obj.midY(), xOld-obj.midX());
    obj.rotate(theta-pTheta);
    xOld = x;
    yOld = y;
}

function scale(id, x, y) {
    var dx = x-xOld;
    var dy = y-yOld;
    if(shift || bindStamp) {
        var obj = objectList[id];
        var ratio = (yFirst-obj.midY())/(xFirst-obj.midX());
        obj.xScale=xScaleOld;
        obj.yScale=yScaleOld;
        if(Math.abs(x-xFirst) < Math.abs(y-yFirst)) {
            dx = x-xFirst;
            dy = (x-xFirst)*ratio;
        } else {
            dx = (y-yFirst)/ratio;
            dy = (y-yFirst);
        }
    }
    objectList[id].scale(dx,dy);
    xOld = x;
    yOld = y;

}

function resetScale(id, x, y) {
    var obj = objectList[id];
    obj.xScale = 0;
    obj.yScale = 0;
    obj.scale(x-obj.midX(), y-obj.midY());
}

function applyTransform(id, x, y, dragMode, e) {
    switch(dragMode) {
        case 'translate':
            translate(id, x, y);
            break;
        case 'rotate':
            rotate(id, x, y);
            break;
        case 'scale':
            var mx = objectList[id].midX();
            var my = objectList[id].midY();
            var pt = transformPoint(x-mx,y-my,
                mx, my,
                1, 1,
                objectList[id].rotation);
            x = pt[0]; y = pt[1];

            if(shift == !e.shiftKey) {
                shift = !shift;
                if(!shift) {
                    resetScale(id, x, y);
                }
            }
            scale(id, x, y);
            break;
    }
}

function endTransform(id, x, y, dragMode) {
    switch(dragMode) {
        case 'translate':
            var dx = x-xFirst;
            var dy = y-yFirst;

            var newAct = {
                undo: function() {
                    objectList[id].move(-dx, -dy);
                },
                redo: function() {
                    objectList[id].move(dx, dy);
                }
            };

            addAction(newAct);
            break;
        case 'rotate':
            var obj = objectList[id];
            var dTheta  = Math.atan2(y-obj.midY(), x-obj.midX()) - Math.atan2(yFirst-obj.midY(), xFirst-obj.midX());

            var newAct = {
                undo: function() {
                    objectList[id].rotate(-dTheta);
                },
                redo: function() {
                    objectList[id].rotate(dTheta);
                }
            };

            addAction(newAct);
            break;

        case 'scale':
            var obj = objectList[id];
            var mx = obj.midX();
            var my = obj.midY();
            var pt = transformPoint(x-mx,y-my,
                mx, my,
                1, 1,
                obj.rotation);
            x = pt[0]; y = pt[1];

            var dx = x-xFirst;
            var dy = y-yFirst;
            if(shift || bindStamp) {
                var ratio = (yFirst-obj.midY())/(xFirst-obj.midX());
                if(Math.abs(x-xFirst) < Math.abs(y-yFirst)) {
                    dx = x-xFirst;
                    dy = (x-xFirst)*ratio;
                } else {
                    dx = (y-yFirst)/ratio;
                    dy = (y-yFirst);
                }
            }

            var newAct = {
                undo: function() {
                    objectList[id].scale(-dx, -dy);
                },
                redo: function() {
                    objectList[id].scale(dx, dy);
                }
            };

            addAction(newAct);
            break;
    }
}
