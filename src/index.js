var color = d3.scaleOrdinal(d3.schemeCategory20);
var edgeWidthScale = d3.scaleLinear()
	.range([1,8]);
var nodeScaleScale = d3.scaleLinear()
	.range([.8, 1.6])
var distanceScale = d3.scalePow()
	.range([250, 25])

function create_vis() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    var svg = d3.select("#network")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    svg.append("g").attr("id", "edges")
    svg.append("g").attr("id", "nodes")

    d3.select("#network svg")
        .append("clipPath")
        .attr("id", "circle-clip")
        .append("circle")
        .attr("r", 15)
        .attr("fill", "transparent")
}

var ticked = function() {
    var svgNodes = d3.select("#nodes")
        .selectAll("g")

    var svgEdges = d3.select("#edges")
        .selectAll("line")

    svgEdges
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })

    svgNodes
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + "), scale(" + nodeScaleScale(d.value) + ")"
        })
}


function resize(simulation) {
    return function() {
        var width = document.getElementById("network").clientWidth,
        height = document.getElementById("network").clientHeight

        d3.select("#network svg")
            .attr("width", width)
            .attr("height", height)

        simulation
            .force("center")
            .x(width / 2)
            .y(height / 2)

        simulation
            .alpha(1)
            .restart()
    }
}

function create_simulation() {
    var width = document.getElementById("network").clientWidth
    var height = document.getElementById("network").clientHeight
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance((d) => {
			if (d.source.group !== d.target.group)
				return distanceScale(d.value)
			else
				return Math.min(distanceScale(d.value), 50)

		}))
        .force("charge", d3.forceManyBody().strength(-80))
		.force("x", d3.forceX())
		.force("y", d3.forceY())
		.alphaTarget(1)
        .force("center", d3.forceCenter(width / 2, height / 2))

    resize(simulation)()
    d3.select(window).on("resize", resize(simulation))

    return simulation

}

function organize_by_date(items) {
    var table = {}

    items.map((item) => {table[item["year"]] = {}})
    items.map((item) => {table[item["year"]][item["month"]] = []})
    items.map((item) => {
        var array = table[item["year"]][item["month"]]
        if (array.indexOf(item) === -1)
            array.push(item)}
    )

    return table
}

function get_profile_picture(profiles, id) {
	console.log(id)
    id = id.split(" ")[0]
	console.log(id)
    return profiles[id][1].value
}

function refreshNodes(nodes, profiles) {
	nodes = nodes.sort((d) => {return d.value})
    var svgNodes = d3.select("#nodes")
        .selectAll("g")
        .data(nodes, (d) => {return d.id})

    svgNodes
        .select("circle")
        .attr("stroke", (d) => {return color(d.group)})


    var node = svgNodes
        .enter()
        .append("g")
        .attr("stroke", "black")
		.on("click", function(d) {select_profile(profiles[d.real_id])})

    node
        .append("circle")
        .attr("r", 15)
        .attr("fill", "transparent")
        .attr("stroke", (d) => {return color(d.group)})

    node
        .append("image")
            .attr("xlink:href", (d) => {return get_profile_picture(profiles, d.id)})
            .attr("x", -30)
            .attr("y", -30)
            .attr("width", 60)
            .attr("height", 60)
            .attr("clip-path","url(#circle-clip)")

    node.merge(svgNodes)

    

    svgNodes.exit().remove()
}

function refreshEdges(edges) {
	edges = edges.sort((d) => {return d.source.value})
	edges = edges.sort((d) => {return d.target.value})
    var svgEdges = d3.select("#edges")
        .selectAll("line")
        .data(edges, (d) => {return d.source.id + " " + d.target.id})

    svgEdges
        .attr("stroke-width", (d) => {return edgeWidthScale(d.value)})

    svgEdges
        .enter()
        .append("line")
        .attr("stroke-width", (d) => {return edgeWidthScale(d.value)})
        .merge(svgEdges)

    svgEdges.exit().remove()
}

function refreshSimulation(nodes, edges, simulation) {
    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(edges);
}

function refresh(nodes, edges, frame, simulation, profiles) {
    var nodes = nodes[frame[0]][frame[1]]
    var edges = edges[frame[0]][frame[1]]

    refreshNodes(nodes, profiles)
    refreshEdges(edges)
    refreshSimulation(nodes, edges, simulation)
}

function load_data(simulation) {
    d3.queue()
        .defer(d3.csv, "edges.csv")
        .defer(d3.csv, "nodes.csv")
        .defer(d3.json, "profiles.json")
    .await((error, edges, nodes, profiles) => {
        if (error) throw error;
        nodes = nodes.map((d) => {
            return {
                "id": d.id + " " + d.year + " " + d.month,
                "real_id": d.id,
                "value": d.weight,
                "group": d.group,
                "year": d.year,
                "month": d.month,
            }
        })

        var frames = [
            [2010, 10], [2010, 11], [2010, 12],
            [2011, 1], [2011, 2], [2011, 3], [2011, 4], [2011, 5], [2011, 6], [2011, 7], [2011, 8], [2011, 9], [2011, 10], [2011, 11], [2011, 12],
            [2012, 1], [2012, 2], [2012, 3], [2012, 4], [2012, 5], [2012, 6], [2012, 7], [2012, 8], [2012, 9], [2012, 10], [2012, 11], [2012, 12],
            [2013, 1], [2013, 2], [2013, 3], [2013, 4], [2013, 5], [2013, 6], [2013, 7], [2013, 8], [2013, 9], [2013, 10], [2013, 11], [2013, 12],
            [2014, 1], [2014, 2], [2014, 3], [2014, 4], [2014, 5], [2014, 6], [2014, 7], [2014, 8], [2014, 9], [2014, 10], [2014, 11], [2014, 12],
            [2015, 1], [2015, 2], [2015, 3], [2015, 4], [2015, 5], [2015, 6], [2015, 7], [2015, 8], [2015, 9], [2015, 10], [2015, 11], [2015, 12],
            [2016, 1], [2016, 2], [2016, 3], [2016, 4], [2016, 5], [2016, 6], [2016, 7], [2016, 8], [2016, 9], [2016, 10], [2016, 11], [2016, 12],
            [2017, 1], [2017, 2], [2017, 3], [2017, 4], [2017, 5], [2017, 6], [2017, 7], [2017, 8], [2017, 9], [2017, 10], [2017, 11]];

        d3.select("#timeline")
            .attr("value", 0)
            .attr("min", 0)
            .attr("max", frames.length - 1)
        d3.select("#date span").text(frames[0][0] + "-" + frames[0][1]);

        var edges = edges.map((d) => {
            return {
                "source": d["from"] + " " + d.year + " " + d.month,
                "target": d["to"] + " " + d.year + " " + d.month,
                "year": d["year"],
                "month": d["month"],
                "value": d["weight"],
            }
        })
        
        var organized_edges = organize_by_date(edges)
        var organized_nodes = organize_by_date(nodes)

        refresh(organized_nodes, organized_edges, frames[0], simulation, profiles)

        d3.select("#timeline")
            .on("change", () => {
                var x = document.getElementById("timeline").value
                refresh(organized_nodes, organized_edges, frames[x], simulation, profiles)
                simulation.alpha(.4).restart()
                d3.select("#date span").text(frames[x][0] + "-" + frames[x][1]);
            })
    })
}

function select_profile(profile) {
	d3.select("#personName").text(profile[0].value)
	timeseries_continuous("#pagerank", profile[7].values, "Page rank")
	timeseries_continuous("#closeness", profile[6].values, "Closeness")
	timeseries_continuous("#posts", profile[4].values, "Posts")
}

function timeseries_continuous(selector, data, name) {
	bb.generate({
		"data": {
			"x": "x",
			"type": "area-spline",
			"columns": [
				["x"].concat(data.map((i) => {return i[0] + "-01"})),
				[name].concat(data.map((i) => {return i[1]})),
			]
		},
		"point": {
			"show": false
		  },
		"axis": {
			"x": {
			"type": "timeseries",
			"tick": {
				"format": ""
				}
			}
		},
		"bindto": selector
	})

}

function init_network() {
    var vis = create_vis()
    var simulation = create_simulation()
    load_data(simulation)
}

$(document).ready(() => {
    init_network()
});
