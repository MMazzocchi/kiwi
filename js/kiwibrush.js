function createBrush(dObj, brushMode) {

    //If this brush is a simple or graphite brush
    if(brushMode == 'simple' || brushMode == 'graphite'){
        dObj.draw = function(ctx) {

            //Rotate and scale the canvas
            ctx.save();
            ctx.translate(this.mx,this.my);
            ctx.rotate(this.rotation);
            ctx.scale(this.xScale, this.yScale);

            //Begin at the first point
            ctx.beginPath();
            ctx.moveTo(this.pts[0][0]-this.mx, this.pts[0][1]-this.my);

            //Set strokestyle and other parameters
            ctx.strokeStyle = this.color;
            if(this.type == 'graphite'){
                ctx.strokeStyle = this.pattern;
            }
            ctx.fillStyle = this.color;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = this.width;
            ctx.globalAlpha = this.opacity;

            if(this.pts.length == 1) {

                //Fill a circle representing one point
                ctx.fillStyle = this.color;
                if(this.type == 'graphite') {
                    ctx.fillStyle = this.pattern;
                }
                ctx.lineWidth = 0;
                ctx.arc(this.pts[0][0]-this.mx,
                    this.pts[0][1]-this.my,
                    this.width/2,
                    0, 2*Math.PI);
                ctx.fill();

            } else if(!this.bezier) {

                // Draw the line without beziers
                for(var i=1; i<this.pts.length; i++) {
                    ctx.lineTo(this.pts[i][0]-this.mx, this.pts[i][1]-this.my);
                };
                ctx.stroke();

            } else {

                // Draw the line with beziers
                for(var i=0; i<this.pts.length; i+=3) {
                    if(this.pts.length <= i+4) {
                        for(var j=i; j<this.pts.length; j++) {
                            ctx.lineTo(this.pts[j][0]-this.mx,this.pts[j][1]-this.my);
                        }
                    } else {
					//quadraticCurveTo()
                        ctx.bezierCurveTo(this.pts[i+1][0]-this.mx, this.pts[i+1][1]-this.my,
                            this.pts[i+2][0]-this.mx, this.pts[i+2][1]-this.my,
                            this.pts[i+3][0]-this.mx, this.pts[i+3][1]-this.my);
						/*
							var p0 = [this.pts[i-1][0]-this.mx, this.pts[i-1][1]-this.my]
							var p1 = [this.pts[i][0]-this.mx, this.pts[i][1]-this.my]
							var p2 = [this.pts[i+1][0]-this.mx, this.pts[i+1][1]-this.my];
							var p3 = [this.pts[i+2][0]-this.mx, this.pts[i+2][1]-this.my];
							var p4 = [this.pts[i+3][0]-this.mx, this.pts[i+3][1]-this.my];
							
							var x1 = p0[0];
							var y1 = p0[1];
							
							var x2 = p1[0];
							var y2 = p1[1];
							
							var x3 = p2[0];
							var y3 = p2[1];
							
							var x4 = p3[0];
							var y4 = p3[1];
							
							var den = ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
							console.log(den);
							
							var intersect = [((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))
							/den,
							((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))
							/den]
							if(den != 0)
								ctx.bezierCurveTo(intersect[0],intersect[1],p3[0],p3[1],p4[0],p4[1]);
							else
							*/
                    }
                };
                ctx.stroke();
            }
            ctx.restore();
        };

    } else if(brushMode == 'spray'){

        //Create a spray can brush
        dObj.draw = function(ctx) {
        ctx.save();
            ctx.translate(this.mx,this.my);
            ctx.rotate(this.rotation);
            ctx.scale(this.xScale, this.yScale);
            ctx.beginPath();
            ctx.moveTo(this.mx, this.pts[0][1]-this.my);
            ctx.lineWidth = this.width;
            ctx.globalAlpha = this.opacity;
			//ctx.globalCompositeOperation = 'source-out';
            var w = dObj.width;

            for(var i=1; i<this.pts.length; i++) {
			
			//drawSoftLine(ctx, this.pts[i-1][0]-this.mx,  this.pts[i-1][1]-this.my, this.pts[i][0]-this.mx, this.pts[i][1]-this.my,  dObj.width,  255, 0,   0,   1);
			//ctx.drawImage(dObj.scanvas,this.pts[i][0]-w/2-this.mx, this.pts[i][1]-w/2-this.my);
			
                var d = distance(this.pts[i-1],this.pts[i]);
                var space =dObj.width/4;
                var s = Math.ceil(d/space);
                var v = [this.pts[i-1][0]-this.pts[i][0],this.pts[i-1][1]-this.pts[i][1]];
                //console.log(d);
                for(var j=0; j<s; j++){
                    ctx.drawImage(dObj.scanvas,(j*1/s*v[0]+this.pts[i][0])-this.mx-w/2, (j*1/s*v[1]+this.pts[i][1])-this.my-w/2);
                    //ctx.lineTo(this.pts[i][0]-this.mx, this.pts[i][1]-this.my);
                }
				
            };
            ctx.stroke();
        ctx.restore();
        }
    }
}
