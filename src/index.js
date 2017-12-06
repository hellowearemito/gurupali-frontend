var color = d3.scaleOrdinal(d3.schemeCategory20);
var edgeWidthScale = d3.scaleLinear()
	.range([1,8]);
var nodeScaleScale = d3.scaleLinear()
	.range([.8, 1.6])
var distanceScale = d3.scalePow()
	.range([250, 50])

var sameGroupDistanceScale = d3.scalePow()
	.range([75, 40])

var nodeRadius = 15
var nodeImageSize = nodeRadius * 2
var group_positions = {}



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
        .attr("r", nodeRadius)
        .attr("fill", "transparent")
}

var ticked = function() {
    d3.selectAll("#network g, #network line").interrupt()
    var transitionDuration = 1500
    var transitionDurationScale = d3.scaleLinear()
        .range([2000,1000])
    var svgNodes = d3.select("#nodes")
        .selectAll("g")

    var svgEdges = d3.select("#edges")
        .selectAll("line")

    svgEdges
        .transition()
        .duration((d) => {return transitionDurationScale(d.source.value)})
        .attrTween("x1", function(d) { return d3.interpolateNumber(this.getAttribute("x1"), d.source.x); })
        .attrTween("y1", function(d) { return d3.interpolateNumber(this.getAttribute("y1"), d.source.y); })
        .transition()
        .duration(700)
        .attr("opacity", .6)

    // Hack to animate the two ends of an edge separately
    svgEdges.append("g")
        .transition()
        .duration((d) => {return transitionDurationScale(d.target.value)})
        .attrTween("x2", function(d) {
            var parent_ = d3.select(this.parentNode)
            var i = d3.interpolateNumber(parent_.attr("x2"), d.target.x)
            return function(t) { parent_.attr("x2", i(t)) }
        })
        .attrTween("y2", function(d) {
            var parent_ = d3.select(this.parentNode)
            var i = d3.interpolateNumber(parent_.attr("y2"), d.target.y)
            return function(t) { parent_.attr("y2", i(t)) }
        })

    svgNodes
        .transition()
        .duration((d) => {return transitionDurationScale(d.value)})
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

        //simulation
            //.alpha(1)
            //.restart()
    }
}

function get_group_position(group, width, height) {
    var fallback = [width / 2, height / 2]

    if (isNaN(group_positions[group])) return fallback
    if (isNaN(group_positions[group][0])) return fallback
    
    return group_positions[group]
}

function create_simulation() {
    var width = document.getElementById("network").clientWidth
    var height = document.getElementById("network").clientHeight
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance((d) => {
			if (d.source.group !== d.target.group)
				return distanceScale(d.value)
			else
				return sameGroupDistanceScale(d.value)

		}))
        .force("charge", d3.forceManyBody().strength(-300))
		.force("x", d3.forceX().x((d) => {return get_group_position(d.group, width, height)[0]}).strength(.3))
		.force("y", d3.forceY().y((d) => {return get_group_position(d.group, width, height)[1]}).strength(.3))
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
    id = id.split(" ")[0]
    return "https://graph.facebook.com/" + id + "/picture?type=large"
}

function refreshNodes(nodes, profiles) {
    var width = document.getElementById("network").clientWidth,
        height = document.getElementById("network").clientHeight
	nodes = nodes.sort((d) => {return d.value})
    nodes.map((n) => {
        n.x = n.x === undefined ? width / 2 : n.x
        n.y = n.y === undefined ? height / 2 : n.y
    })

    var svgNodes = d3.select("#nodes")
        .selectAll("g")
        .data(nodes, id)

    svgNodes.exit().remove()

    svgNodes
        .select("circle")
        .attr("stroke", (d) => {return color(d.group)})


    var node = svgNodes
        .enter()
        .append("g")
        .attr("stroke", "black")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + "), scale(0)"
        })
		.on("click", function(d) {select_profile(profiles[d.real_id])})

    node
        .append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "transparent")
        .attr("stroke", (d) => {return color(d.group)})


    node
        .append("image")
            .attr("xlink:href", (d) => {return get_profile_picture(profiles, d.id)})
            .attr("x", -nodeImageSize / 2)
            .attr("y", -nodeImageSize / 2)
            .attr("width", nodeImageSize)
            .attr("height", nodeImageSize)
            .attr("clip-path","url(#circle-clip)")

    node.merge(svgNodes)

}

function refreshEdges(edges) {
    var width = document.getElementById("network").clientWidth,
        height = document.getElementById("network").clientHeight
	edges = edges.sort((d) => {return d.source.value})
	edges = edges.sort((d) => {return d.target.value})
    var svgEdges = d3.select("#edges")
        .selectAll("line")
        .data(edges, (d) => {return id(d.source) + " " + id(d.target)})

    svgEdges
        .attr("stroke-width", (d) => {return edgeWidthScale(d.value)})


    svgEdges
        .enter()
        .append("line")
        .attr("opacity", 0)
        .attr("stroke-width", (d) => {return edgeWidthScale(d.value)})
        .attr("x1", function(d) { return d.source.x !== undefined ? d.source.x : width / 2 })
        .attr("y1", function(d) { return d.source.y !== undefined ? d.source.y : height / 2 })
        .attr("x2", function(d) { return d.target.x !== undefined ? d.source.x : width / 2 })
        .attr("y2", function(d) { return d.target.y !== undefined ? d.source.y : height / 2 })
        .merge(svgEdges)

    svgEdges.exit().remove()
}

function refreshSimulation(nodes, edges, simulation) {
    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(edges);

    simulation.alpha(1).restart();
    for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
        simulation.tick();
    }
    simulation.stop();
    ticked()
    analyze_group_coordinates(nodes)
}

function avg(x) {
    return x.reduce((x, y) => {return x + y}) / x.length
}

function analyze_group_coordinates(nodes) {
    var groups_x = {}
    var groups_y = {}
    nodes.map((d) => {
        var group = d.group,
            x = d.x,
            y = d.y

        if (groups_x[group] === undefined) {groups_x[group] = [], groups_y[group] = []}
        groups_x[group].push(x)
        groups_y[group].push(y)
    })

    Object.keys(groups_x).map((group) => {
        group_positions[group] = [
            avg(groups_x[group]),
            avg(groups_y[group])
        ]
    })
}

function id(node) {
    return node.id !== undefined ? node.id.split(" ")[0] : node.split(" ")[0]
}

function filter_edges(edges) {
    return edges.filter((e) => {
        return e.value >= .10
    })
}

function filter_nodes(edges, nodes) {
    var used = {}

    edges.map((e) => {
        used[id(e.source)] = true
        used[id(e.target)] = true
    })

    return nodes.filter((n) => {
        return used[id(n.id)]
    })
}

function refresh(nodes, edges, frame, simulation, profiles) {
    var edges = filter_edges(edges[frame[0]][frame[1]])
    var nodes = filter_nodes(edges, nodes[frame[0]][frame[1]])

    refreshSimulation(nodes, edges, simulation)
    refreshNodes(nodes, profiles)
    refreshEdges(edges)
    refreshSimulation(nodes, edges, simulation)
}

function get_frames(nodes) {
    var dict = {}
    var years
    var result = []

    nodes.map((n) => {dict[n.year * 1] = {}})
    nodes.map((n) => {dict[n.year * 1][n.month * 1] = true})
    years = Object.keys(dict).sort()
    years.map((year) => {
        var months = Object.keys(dict[year]).sort((a, b) => {return a - b})
        months.map((month) => {
            result.push([year, month])
        })
    })

    return result
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

        var frames = get_frames(edges)

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
                //simulation.alpha(1).restart()
                d3.select("#date span").text(frames[x][0] + "-" + frames[x][1]);
            })
    })
}

function select_profile(profile) {
	d3.select("#personName").text(profile[0].value)
	timeseries_continuous("#pagerank", profile[6].values, "Page rank")
	timeseries_continuous("#closeness", profile[5].values, "Closeness")
	timeseries_continuous("#posts", profile[3].values, "Posts")
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
