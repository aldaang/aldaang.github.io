var tip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-10, 0])	
	.html(function(d) {
		return "<strong>Value:</strong> <span style='color:red'>" + d.values[selectedIndex] + "</span>";
	});

function RadarChart(id, data, options, legendData) {
	var cfg = {
		w: 1600,
		h: 1600,
		margin: { top: 20, right: 20, bottom: 20, left: 20},
		levels: 5,
		maxValue: 0.5,
		labelFactor: 1.25,
		wrapWidth: 60,
		opacityArea: 0.35,
		dotRadius: 4,
		opacityCircles: 0.1,
		strokeWidth: 2,
		roundStrokes: false,
		color: d3.scale.category10(),
		labelScale: 1,
		legendBoxSize: 10,
		paddingX: 1600,
		paddingY: 1600
	};
	
	if('undefined' !== typeof options) {
		for(var i in options) {
			if('undefined' !== typeof options[i]) {
				cfg[i] = options[i];
			}
		}
	}
	
	var maxValue = 1;
	// var maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) {return d3.max(i.map(function(o) {return o.value;}))}));
	
	var allAxis = (data[0].map(function(i, j) {return i.axis})),
		total = allAxis.length,
		radius = Math.min(cfg.w/2, cfg.h/2),
		Format = d3.format("g")
		angleSlice = Math.PI * 2 / total;
		
	var rScale = d3.scale.linear()
		.range([0, radius])
		.domain([0, maxValue]);
		
	d3.select(id).select("svg").remove();
	
	var svg = d3.select(id).append("svg")
		.attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
		.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
		.attr("class", "radar"+id);
		
	var g = svg.append("g")
		.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
		
	var filter = g.append('defs').append('filter').attr('id', 'glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');
		
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	axisGrid.selectAll(".levels")
		.data(d3.range(1,(cfg.levels+1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function(d, i) { return radius/cfg.levels*d; })
		.style("fill", "#CDCDCD")
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", cfg.opacityCircles)
		.style("filter", "url(#glow)");
		
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1,(cfg.levels+1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", function(d) { return -d*radius/cfg.levels; })
		.attr("dy", "0.4em")
		.style("font-size", "10px")
		.attr("fill", "#737373")
		.text(function(d,i) { return Format(maxValue * d/cfg.levels); });
		
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
		
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i) { return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i) { return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "white")
		.style("stroke-width", "2px");
		
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "14px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
		.text(function(d){return d})
		
	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//The radial line function
	var radarLine = d3.svg.line.radial()
		.interpolate("linear-closed")
		.radius(function(d) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });
		
	if(cfg.roundStrokes) {
		radarLine.interpolate("cardinal-closed");
	}
				
	//Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");
			
	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);	
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});
		
	//Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");		
	
	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8);
	
	// Create a legend
	var legend = svg.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 200)
		.attr("transform", "translate(-775, 10)");
		
	legend.selectAll("rect")
		.data(legendData)
		.enter()
		.append("rect")
		.attr("x", 1600 - 65)
		.attr("y", function(d,i) { return i * 20; })
		.attr("width", 10)
		.attr("height", 10)
		.style("fill", function(d,i) { return color(i); });
		
	legend.selectAll("text")
		.data(legendData)
		.enter()
		.append("text")
		.attr("x", 1600 - 52)
		.attr("y", function(d,i) { return i * 20 + 9; })
		.attr("font-size", "12px")
		.attr("fill", "#737373")
		.text(function(d) { return d.name; });

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////
	
	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");
		
	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
					
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(Format(d.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
		
	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);
	
	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////

	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.4, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}//wrap	
}

var headers;
var artists;
var artistProperty = 0;
var root;

var margin = 50;
var width = 500 - margin * 2;
var height = 500 - margin * 2;

var xScale = d3.scale.linear().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);
var sizeScale = d3.scale.linear().range([3, 20]);

var xAxis = d3.svg.axis().orient("bottom")
	.scale(xScale);
	
var yAxis = d3.svg.axis().orient("left")
	.scale(yScale);
	
var xAxisIndex = 0, yAxisIndex = 0, sizeIndex = 0;

var selectedIndex = 0;

function createBars() {
	d3.selectAll(".bar").remove();
	d3.selectAll(".yAxis").remove();
	d3.selectAll(".text").remove();
	
	headers = displayExtraData.filter(
		function (d) {
			return d.type == "indicators";
		}
	);
	
	headers = headers[0].values;
	
	artist = displayExtraData.filter(
		function (d) {
			return d.type == "artist";
		}
	);
	
	var buttonsData = [
		{name:"", target: "y"}
	];
	 
	var buttonGroups = d3.select("#buttons").selectAll(".buttonGroup")
		.data(buttonsData)
		.enter()
		.append("span")
		.attr("class", "buttonGroup");
		
	buttonGroups.append("label").html(function (d) { return d.name; });
	
	buttonGroups.append("select")
		.on("change", function (d) {
			selectedIndex = d3.select(this).property("selectedIndex");
			if (d.target == "y") {
				yAxisIndex = selectedIndex;
				sizeIndex = selectedIndex;
			}
			updateVis();
		})
		.selectAll("option")
		.data(headers)
		.enter()
		.append("option")
		.text(function (d) { return d; });
	
	root = d3.select("#chart").selectAll("svg");
	
	root = root.append("g")
		.attr("transform", "translate(50, 50)");
		
	root.append("g")
		.attr("class", "yAxis")
		.call(yAxis)
		.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("y", -50)
		.attr("dy", ".71em")
		.style("text-anchor", "end");
		
	var maxVal = d3.max(artist, function (d) { 
		return d.values[artistProperty];
	});
	
	root.selectAll(".bar").data(artist)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", function (d, i) {
				return i * 21;
			})
		.attr("y", function (d, i) {
				return 400 - 400 * d.values[artistProperty] / maxVal;
			})
		.attr("width", 15)
		.attr("height", function (d, i) {
				return 400 * d.values[artistProperty] / maxVal;
			})
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide);
			
	root.selectAll(".text").data(artist)
		.enter()
		.append("text")
		.text(function (d) { 
			return d.name;
			})
		.attr("class", "text")
		.attr("y", function (d, i) {
				return i * 21;
			})
		.attr("dx", "-25em")
		.attr("dy", "0.8em")
		.style("text-anchor", "beginning")
		.attr("transform", "rotate(-90)");
		
	root.call(tip);
}

 function updateVis() {
	 var maxY = d3.max(artist, function (d) { return d.values[yAxisIndex];});
	 var maxSize = d3.max(artist, function (d) { return d.values[sizeIndex];});
	 
	 yScale.domain([0, maxY]);
	 sizeScale.domain([0, maxSize]);
	 
	 sizeScale.domain([0, d3.max(artist, function (d) { return d.values[sizeIndex]})]);
	 
	 var maxVal = d3.max(artist, 
		function (d) {
			return d.values[sizeIndex];
		})
	
	var duration = 350;
	
	root.selectAll(".artist")
	.attr("transform", function (d) {
		var xValue = xScale(d.values[xAxisIndex]);
		var yValue = yScale(d.values[yAxisIndex]);
		return "translate(" + xValue + "," + yValue + ")";
	})
	
	yAxis.scale(yScale);
	
	root.selectAll(".bar")
		.transition()
		.duration(duration)
		.delay(function (d, i) {
			return i * 15;
		})
		.attr("y", function (d, i) {
			return 400 - 400 * d.values[sizeIndex] / maxSize;})
		.attr("height", function (d, i) {
			return 400 * d.values[sizeIndex] / maxSize;
		})
		
	root.select(".xAxis").call(xAxis)
	root.select(".yAxis").call(yAxis)
	.select(".label").text(headers[yAxisIndex]);
	
	root.call(tip);
 }
 
 function createButtons() {
	 var buttonsData = [
		{name:"", target: "y"}
	 ];
	 
	 var buttonGroups = d3.select("#buttons").selectAll(".buttonGroup")
		.data(buttonsData)
		.enter()
		.append("span")
		.attr("class", "buttonGroup");
		
	buttonGroups.append("label").html(function (d) { return d.name; });
	
	buttonGroups.append("select")
		.on("change", function (d) {
			var selectedIndex = d3.select(this).property("selectedIndex");
			if (d.target == "y") {
				yAxisIndex = selectedIndex;
				sizeIndex = selectedIndex;
			}
			updateVis();
		})
		.selectAll("option")
		.data(headers)
		.enter()
		.append("option")
		
		.text(function (d) { return d; });
 }

function handleClick(cb) {
	if (cb.checked == true) {
		displayData.push(data[cb.id]);
		selectedArtists.push(artists[cb.id]);
		displayExtraData.push(miscData[cb.id]);
	}
	else if (cb.checked == false) {
		displayData.splice(displayData.indexOf(cb.id), 1);
		selectedArtists.splice(selectedArtists.indexOf(cb.id), 1);
		displayExtraData.splice(displayExtraData.indexOf((cb.id + 1)), 1);
	}
	
	RadarChart(".radarChart", displayData, radarChartOptions, selectedArtists);

	createBars();
}