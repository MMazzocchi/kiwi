function OpacitySlider()
{
	var CPW = 90;
	var CPH = 38;
	var xm = 0;
	var px = 90;
	var slide_type = "";
	var slider;
	var ctx;
	var line_img;
  
	this.init = function(type){
		slide_type = type;
		if(slide_type == "opacity"){
			slider = document.getElementById('opac_canvas');
		}
		else if(slide_type == "thickness"){
			slider = document.getElementById('thick_canvas');
		}
		slider.width = CPW;
		slider.height = CPH;

		// Init Disc
		ctx = slider.getContext('2d');
		line_img = document.getElementById("slider_line");
//		ctx.drawImage(slider_img,0,0);
		var canvas_name;
		if(slide_type == "opacity"){
			canvas_name = "#opac_canvas";
		}
		else if(slide_type == "thickness"){
			canvas_name = "#thick_canvas";
		}
		$(canvas_name).mousedown( HandleClick );
		$(canvas_name).mousemove( HandleDrag );
		$(canvas_name).mouseup( HandleUp );
		$(canvas_name).bind('touchstart', HandleClick );
		$(canvas_name).bind('touchmove', HandleDrag );
		$(canvas_name).bind('touchend', HandleUp );
	}
  
	this.setOpacity = function(opac)
	{
		alpha = opac/CPW;
		myCP.updateColor();
		this.Refresh();
	}

	this.setThickness = function(thick)
	{
		thickness = thick*100/90;
		this.Refresh();
	}

	this.Refresh = function()
	{
		ctx.save();
		ctx.translate(px,0);
		ctx.rotate(90*Math.PI/180);
		ctx.globalCompositeOperation = "source-atop";
		ctx.drawImage(line_img,0,0);
		ctx.restore();
	}

	this.updateValue = function(x)
	{
		if (x >= xm && x <= CPW+xm)
		{
			px = x;
			if(slide_type == "opacity"){
				this.setOpacity(x);
			}
			else if(slide_type == "thickness"){
				this.setThickness(x);
			}
		}
	}

	var isDragging = false;

	function HandleClick(e)
	{
		e.preventDefault();
		var ofst = $(this).offset();
		var first = e;
		if (e.originalEvent !== undefined && "touches" in e.originalEvent) 
			first = e.originalEvent.touches[0];
		var px = first.pageX - ofst.left;
		if(slide_type == "opacity"){
			opacSlider.updateValue(px);
		}
		else if(slide_type == "thickness"){
			thickSlider.updateValue(px);
		}
		isDragging = true;
	}

	function HandleDrag(e)
	{
		if (isDragging) {
			e.preventDefault();
			var ofst = $(this).offset();
			var first = e;
			if (e.originalEvent !== undefined && "touches" in e.originalEvent) 
				first = e.originalEvent.touches[0];
			var px = first.pageX - ofst.left;
			if(slide_type == "opacity"){
				opacSlider.updateValue(px);
			}
			else if(slide_type == "thickness"){
				thickSlider.updateValue(px);
			}
		}
	}

	function HandleUp(e)
	{
		isDragging = false;
	}
}
