import * as d3 from "d3";

import miserables from "../data/miserables2.json";

// This a "constructor" function for creating instances of objects.
// I.e. it's like declaring a "class".
//
// This is indicated by the **naming convention** only,
// using a captial letter as the first letter in the name.
//
// E.g.
// const fg = new ForceGraph(data, options);
//
function ForceGraph(
  // The first argument is an object with properties named "nodes" and "links".
  // Here we "destructure" the object which gives us access to nodes and links.
  {
    nodes, // an iterable of node objects (typically [{id}, …])
    links, // an iterable of link objects (typically [{source, target}, …])
  },
  // The second argument is also an object.
  // Destructure here.
  {
    // nodeId is actually a function
    // If nodeId is not supplied by the calling code,
    // it defaults to a lamda (d) => d.id
    nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)

    // This is a function
    // const color = nodeGroup(node)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color

    nodeGroups, // an array of ordinal values representing the node groups

    // This is a function
    nodeTitle, // given d in nodes, returns a title string

    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)

    nodeStroke = "#fff", // node stroke color

    nodeStrokeWidth = 1.5, // node stroke width, in pixels

    nodeStrokeOpacity = 1, // node stroke opacity

    nodeRadius = 2, // node radius, in pixels

    nodeStrength,

    linkSource = ({ source }) => source, // given d in links, returns a node identifier string

    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string

    linkStroke = "#999", // link stroke color

    linkStrokeOpacity = 0.6, // link stroke opacity

    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels

    linkStrokeLinecap = "round", // link stroke linecap

    linkStrength,

    colors = d3.schemeTableau10, // an array of color strings, for the node groups

    width = 640, // outer width, in pixels

    height = 400, // outer height, in pixels

    invalidation, // when this promise resolves, stop the simulation
  } = {}
) {
  // Compute values.
  const N = d3.map(nodes, nodeId).map(intern);
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);

  // If nodeTitle is not provided, then set a default
  // The default is a lambda
  // Lamba takes two arguments
  // First argument is ignored (because it's named _)
  // Second argument "i" is an index, e.g. 0, 1, 2, 3
  // Probaby for use by the JS array "map" function
  //
  // E.g.
  // myNodes.map((node, index) => {
  //   // todo
  // })
  //
  // Here, N contains the ids which happen to also be names
  // So the names are used as the titles, somehow.
  if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];

  // T is an array of node titles (could be null)
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);

  // G is an array of node colours, used for grouping
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);

  // W is an array of stroke widths
  const W =
    typeof linkStrokeWidth !== "function"
      ? null
      : d3.map(links, linkStrokeWidth);

  // L is an array of stroke colours
  const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

  // Duplicate the input nodes and links with mutable objects for the simulation.
  // Create a new array of nodes and links, based on the original data.
  // Reuse the same name, so we lose the reference to the original values.
  nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
  links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

  // console.log(nodes);

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // Construct the forces.
  const forceNode = d3.forceManyBody();

  const forceLink = d3.forceLink(links).id((o) => {
    const { index } = o;
    return N[index];
  });

  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  forceLink.distance(function (d) {
    return 280;
  });

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", forceLink)
    // .force("charge", forceNode)
    // .force("center", d3.forceCenter())
    .on("tick", ticked);

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; height: intrinsic; border: 1px solid #888888;"
    );

  // console.log(svg);

  const link = svg
    .append("g")
    .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr(
      "stroke-width",
      typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
    )
    .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  // const node = svg
  //   .append("g")
  //   .attr("fill", nodeFill)
  //   .attr("stroke", nodeStroke)
  //   .attr("stroke-opacity", nodeStrokeOpacity)
  //   .attr("stroke-width", nodeStrokeWidth)
  //   .selectAll("circle")
  //   .data(nodes)
  //   .join("circle")
  //   .attr("r", nodeRadius * 4)
  //   .call(drag(simulation));

  // const node = svg
  //   .append("g")
  //   .selectAll("text")
  //   .data(nodes)
  //   .join("text")
  //   .text((d) => d.id)
  //   .call(drag(simulation));

  const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  node.append("circle").attr("fill", "#aaa").attr("r", 10);

  const labelWidth = (d) => d.id.length * 9;
  const labelX = (d) => (-1 * labelWidth(d)) / 2;

  const textHeight = 15; // Approx

  const labelYOffset = 10;
  const labelHeight = 20;

  node
    .append("rect")
    .attr("y", labelYOffset)
    .attr("x", labelX)
    .attr("width", labelWidth)
    .attr("height", labelHeight)
    // .attr("fill", ({ index }) => color(G[index]))
    // .attr("fill", "transparent");
    .attr("fill", "#eee")
    .attr("fill-opacity", 0.8);

  node
    .append("text")
    .attr("x", (d) => labelX(d) + 10)
    .attr("y", labelYOffset + textHeight)
    .attr("font-size", "0.8em")
    .text((d) => d.id);

  if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
  if (L) link.attr("stroke", ({ index: i }) => L[i]);
  // if (G) node.attr("fill", ({ index: i }) => color(G[i]));
  // if (T) node.append("title").text(({ index: i }) => T[i]);

  // node.append("text").text("HELLO");
  // .attr({ x: 20, y: 20 })

  if (invalidation != null) invalidation.then(() => simulation.stop());

  function intern(value) {
    return value !== null && typeof value === "object"
      ? value.valueOf()
      : value;
  }

  function ticked() {
    nodes[0].x = 0;
    nodes[0].y = 0;

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d, i) => {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return Object.assign(svg.node(), { scales: { color } });
}

const chart = ForceGraph(miserables, {
  nodeId: (d) => d.id,
  nodeGroup: (d) => d.group,
  nodeTitle: (d) => `${d.id}\n${d.group}`,
  linkStrokeWidth: (l) => Math.sqrt(l.value),
  width: 800,
  height: 600,
  // invalidation, // a promise to stop the simulation when the cell is re-run
});

document.getElementById("app").appendChild(chart);
