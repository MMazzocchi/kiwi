		
function lineSplit(x, y){		
		var cury = erasePts[0][0];
		var curx = erasePts[0][1];
		var diffy = (y-erasePts[0][1]);
		var diffx = (x-erasePts[0][0]);
		var slopey = Math.abs(diffy/diffx);
		var slopex = Math.abs(diffx/diffy);
		while(curx != x && cury != y){
			if(diffx > 0){
				curx = curx + 1*slopex;
			}
			else{
				curx = curx - 1*slopex;
			}
			if(diffy > 0){
				cury = cury + 1*slopey;
			}
			else{
				cury = cury - 1*slopey;
			}
			erasePts.push([curx,cury]);
		}
		for(var i=0; i<erasePts.length; i++){
			var id = getObjectID(erasePts[i][0],erasePts[i][1]);
                if(id != -1) {
                    var layerId = -1;
					for(var j=0; j<layerList.length; j++) {
						if(layerList[j] == id) {
							layerId = j;
							break;
						}
					}
					var dObj = objectList[layerList[layerId]];
					if(dObj.objType == "line"){
						var splitPt = findClosest(erasePts[i][0], erasePts[i][1], dObj.pts);
						splitObj(dObj, splitPt);
					}
                }
		}
}

function splitObj(dObj, splitLoc){
	var newObject = jQuery.extend(true, {}, dObj);
	assignId(newObject);
	newObject.pts = dObj.pts.splice(splitLoc, dObj.pts.length-splitLoc);
}

function findClosest(x, y, array){
	var min = 9007199254740992;
	var minLoc;
	for(var i=0; i<array.length; i++){
		var distance = Math.sqrt(Math.pow(Math.abs(x-array[i][0]),2) + Math.pow(Math.abs(y-array[i][1]),2));
		if (distance < min){
			min = distance;
			minLoc = i;
		}
	}
	console.log(minLoc);
}