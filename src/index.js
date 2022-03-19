import * as d3 from "d3";

import miserables from "../data/miserables2.json";

const nodeId = (d) => d.id;
const cloneNode = (o) => Object.assign({}, o);

const linkStroke = (l) => "#999";
const linkStrokeWidth = (l) => Math.sqrt(l.value);
const linkStrokeOpacity = (l) => 0.6;
const cloneLink = (o) => Object.assign({}, o);

function onDrag(simulation) {
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

function onTick(nodes, link, node) {
  return function () {
    nodes[0].x = 0;
    nodes[0].y = 0;

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => {
      return "translate(" + d.x + "," + d.y + ")";
    });
  };
}

function makeGraph(data, options) {
  const { nodes: originalNodes, links: originalLinks } = data;
  const { width, height } = options;

  const nodes = d3.map(originalNodes, cloneNode);
  const links = d3.map(originalLinks, cloneLink);

  const forceNode = d3.forceManyBody().strength(-100);

  const forceLink = d3
    .forceLink(links)
    .strength(0.1)
    .distance((l) => 280)
    .id(nodeId);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", forceLink)
    .force("charge", forceNode)
    .force("center", d3.forceCenter());

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; height: intrinsic; border: 1px solid #888888;"
    );

  const link = svg
    .append("g")
    .attr("stroke", linkStroke)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr(
      "stroke-width",
      typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
    )
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(onDrag(simulation));

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
    .attr("fill", "#eee")
    .attr("fill-opacity", 0.8);

  node
    .append("text")
    .attr("x", (d) => labelX(d) + 10)
    .attr("y", labelYOffset + textHeight)
    .attr("font-size", "0.8em")
    .text(nodeId);

  link.attr("stroke-width", linkStrokeWidth);
  link.attr("stroke", linkStroke);

  simulation.on("tick", onTick(nodes, link, node));

  return svg.node();
}

const graph = makeGraph(miserables, {
  width: 800,
  height: 500,
});

document.getElementById("app").appendChild(graph);
