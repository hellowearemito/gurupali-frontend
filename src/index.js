
function create_vis() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    return d3.select("#network").append("svg").attr("width", width).attr("height", height)
}

function create_simulation() {
    var width = document.getElementById("network").clientWidth
    var height = 500

    return d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(100))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
}

function load_data(simulation) {
    d3.csv("edges.csv", function(error, edges) {
        if (error) throw error;
        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((d) => {
            return {"id": d, "group": d % 3}
        })

        var edges = edges.map((d) => {
            return {
                "source": d["from"],
                "target": d["to"],
                "weight": d["weight"] / 50,
            }
        })

        var link = d3.select("svg").append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(edges)
            .enter().append("line")
            .attr("stroke-width", function(d) { return Math.sqrt(d.weight); });

        var node = d3.select("svg").append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
                .attr("r", 5)
                .attr("fill", function(d) { return color(d.group); })

        simulation
            .nodes(nodes)
            .on("tick", ticked)

        simulation.force("link")
            .links(edges)

        resize()
        d3.select(window).on("resize", resize)

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        }

        function resize() {
            var width = document.getElementById("network").clientWidth,
                height = document.getElementById("network").clientHeight

            d3.select("svg")
                .attr("width", width)
                .attr("height", height)

            simulation
                .force("center")
                    .x(width / 2)
                    .y(height / 2)

            simulation
                .restart()
        }

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
