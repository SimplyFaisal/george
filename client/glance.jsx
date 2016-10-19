import React from 'react';
import axios from 'axios';
import * as d3 from "d3";

export default class GlancePage extends React.Component {
  state = {isLoading: true}
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div>
        {this.state.isLoading ? 'loading...': ''}
        <svg id="glance" height="600" width="600"></svg>
      </div>
    )
  }
  componentDidMount = () => {
    axios.get('http://localhost:8000/glance')
      .then((response) => {
        this.setState({isLoading: false});
        let svg = d3.select('#glance');
        let width = +svg.attr("width");
        let color = d3.scaleOrdinal(d3.schemeCategory20c);
        let children = response.data.topics.map((x) => {return {id: x}});
        let root = d3.hierarchy({children: children})
            .sum(d => 1);
        let pack = d3.pack()
            .size([width, width])
            .padding(1.5);

        var node = svg.selectAll(".node")
          .data(pack(root).leaves())
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.append("circle")
          .attr("id", function(d) { return d.data.id; })
          .attr("r", 30)
          .style("fill", 'steelblue');

        node.append("clipPath")
          .attr("id", function(d) { return "clip-" + d.data.id; })
        .append("use")
          .attr("xlink:href", function(d) { return "#" + d.data.id; });

        node.append("text")
            .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
          // .selectAll("tspan")
          // .data(d => d)
          // .enter().append("tspan")
          //   .attr("x", 0)
          //   .attr("y", 0)
            .text(function(d) {
              return d.data.id;
            });
  });
  }
}
