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

function organize_by_date(items) {
    var table = {}

    items.map((item) => {table[item["year"]] = {}})
    items.map((item) => {table[item["year"]][item["month"]] = []})
    items.map((item) => {table[item["year"]][item["month"]].push(item)})

    return table
}

function load_data(simulation) {
    d3.csv("edges.csv", function(error, edges) {
        if (error) throw error;
        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((d) => {
            return {"id": d, "group": d % 3}
        })

        var frames = [
           [2017, 1], [2017, 2], [2017, 3], [2017, 4], [2017, 5], [2017, 6], [2017, 7], [2017, 8], [2017, 9], [2017, 10], [2017, 11], [2017, 12],
           [2018, 1], [2018, 2], [2018, 3], [2018, 4], [2018, 5], [2018, 6], [2018, 7], [2018, 8], [2018, 9], [2018, 10], [2018, 11], [2018, 12],
           [2019, 1], [2019, 2], [2019, 3], [2019, 4], [2019, 5], [2019, 6], [2019, 7], [2019, 8], [2019, 9], [2019, 10], [2019, 11], [2019, 12],
        ]

        d3.select("#timeline")
            .attr("value", 0)
            .attr("min", 0)
            .attr("max", frames.length - 1)

        var edges = edges.map((d) => {
            return {
                "source": d["from"],
                "target": d["to"],
                "year": d["year"],
                "month": d["month"],
                "weight": d["weight"] / 50,
            }
        })
        
        var organized_edges = organize_by_date(edges)

        var link = d3.select("svg").append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(organized_edges[2017][2])
            .enter().append("line")
            .attr("stroke-width", function(d) { return Math.sqrt(d.weight); });

        var nodeEnter = d3.select("svg").append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter()

		var node = nodeEnter.append("g")

		d3.select("svg")
			.append("clipPath")
			.attr("id", "circle-clip")
			.append("circle")
			.attr("r", 25)
			.attr("fill", "transparent")

		node
			.append("image")
			.attr("xlink:href", "https://i.stack.imgur.com/WCveg.jpg")
			.attr("x", -30)
			.attr("y", -30)
			.attr("width", 60)
			.attr("height", 60)
			.attr("clip-path","url(#circle-clip)")

		node
			.append("circle")
			.attr("r", 25)
			.attr("stroke", (data) => {return color(data.group)})
			.attr("stroke-width", "3px")
			.attr("fill", "transparent")

        simulation
            .nodes(nodes)
            .on("tick", ticked)

        simulation.force("link")
            .links(organized_edges[2017][2])

        resize()
        d3.select(window).on("resize", resize)
        d3.select("#timeline").on("change", () => {
            var item = document.getElementById("timeline")
            load_frame(frames[item.value])
        })

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; })

			node
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
			});


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
                .alpha(1)
                .restart()
        }

        function load_frame(item) {
            var year = item[0],
                month = item[1]
            var data = organized_edges[year][month]

            var link = d3.select("svg g")
                .selectAll("line")
                .data(data)

            simulation.force("link")
                .links(data)

            simulation
                .alpha(1)
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
