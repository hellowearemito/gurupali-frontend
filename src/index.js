function create_vis() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    d3.select("#network").append("div").attr("id", "nodes")
    d3.select("#network").append("div").attr("id", "edges")
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
        .selectAll("p")
        .data(nodes)

    svgNodes
        .text((d) => {return d.id})

    svgNodes
        .enter()
        .append("p")
        .text((d) => {return d.id})
        .merge(svgNodes)

    svgNodes.exit().remove()
}

function refreshEdges(edges) {
    var svgEdges = d3.select("#edges")
        .selectAll("p")
        .data(edges)

    svgEdges
        .text((d) => {return d.source + "->" +d.target})

    svgEdges
        .enter()
        .append("p")
        .text((d) => {return d.source + "->" +d.target})
        .merge(svgEdges)

    svgEdges.exit().remove()
}

function refresh(nodes, edges, frame) {
    var nodes = nodes[frame[0]][frame[1]]
    var edges = edges[frame[0]][frame[1]]

    refreshNodes(nodes)
    refreshEdges(edges)
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
                //"value": d.weight,
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

        refresh(organized_nodes, organized_edges, frames[0])

        d3.select("#timeline")
            .on("change", () => {
                var x = document.getElementById("timeline").value
                refresh(organized_nodes, organized_edges, frames[x])
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
