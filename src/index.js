function create_vis() {
    return d3.select("#network").append("svg").attr("width", 600).attr("height", 400)
}

$(document).ready(() => {
    create_vis()
});
