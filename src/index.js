var color = d3.scaleOrdinal(d3.schemeCategory20);
var edgeWidthScale = d3.scaleLinear()
	.range([1,8]);
var nodeScaleScale = d3.scaleLinear()
	.range([.8, 1.6])
var distanceScale = d3.scalePow()
	.range([250, 50])

var sameGroupDistanceScale = d3.scalePow()
	.range([75, 30])



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
				return sameGroupDistanceScale(d.value)

		}))
        .force("charge", d3.forceManyBody().strength(-300))
		.force("x", d3.forceX())
		.force("y", d3.forceY())
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
        var months = Object.keys(dict[year]).sort()
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
