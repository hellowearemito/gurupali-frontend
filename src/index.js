function create_vis() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    var svg = d3.select("#network")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    svg.append("g").attr("id", "nodes")
    svg.append("g").attr("id", "edges")
}

var ticked = function() {
    var svgNodes = d3.select("#nodes")
        .selectAll("circle")

    var svgEdges = d3.select("#edges")
        .selectAll("line")

    svgEdges
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    svgNodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

function create_simulation() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    return d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(100))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
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

function refreshNodes(nodes) {
    var svgNodes = d3.select("#nodes")
        .selectAll("circle")
        .data(nodes)

    svgNodes
        .attr("r", (d) => {return d.weight * 10})

    svgNodes
        .enter()
        .append("circle")
        .attr("r", (d) => {return d.weight * 10})
        .attr("fill", "black")
        .merge(svgNodes)

    svgNodes.exit().remove()
}

function refreshEdges(edges) {
    var svgEdges = d3.select("#edges")
        .selectAll("line")
        .data(edges)

    svgEdges
        .attr("stroke-width", (d) => {return d.weight * 5})

    svgEdges
        .enter()
        .append("line")
        .attr("stroke-width", (d) => {return d.weight * 5})
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

function refresh(nodes, edges, frame, simulation) {
    var nodes = nodes[frame[0]][frame[1]]
    var edges = edges[frame[0]][frame[1]]

    refreshNodes(nodes)
    refreshEdges(edges)
    refreshSimulation(nodes, edges, simulation)
}

function load_data(simulation) {
    d3.queue()
        .defer(d3.csv, "edges.csv")
        .defer(d3.csv, "nodes.csv")
    .await((error, edges, nodes) => {
        if (error) throw error;
        nodes = nodes.map((d) => {
            return {
                "id": d.id + " " + d.year + " " + d.month,
                "weight": d.weight,
                "group": d.group,
                "year": d.year,
                "month": d.month,
            }
        })

        var frames = [
           [2017, 1], [2017, 2], [2017, 3]
        ]

        d3.select("#timeline")
            .attr("value", 0)
            .attr("min", 0)
            .attr("max", frames.length - 1)

        var edges = edges.map((d) => {
            return {
                "source": d["from"] + " " + d.year + " " + d.month,
                "target": d["to"] + " " + d.year + " " + d.month,
                "year": d["year"],
                "month": d["month"],
                "weight": d["weight"],
            }
        })
        
        var organized_edges = organize_by_date(edges)
        var organized_nodes = organize_by_date(nodes)

        refresh(organized_nodes, organized_edges, frames[0], simulation)

        d3.select("#timeline")
            .on("change", () => {
                var x = document.getElementById("timeline").value
                refresh(organized_nodes, organized_edges, frames[x], simulation)
            })
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
