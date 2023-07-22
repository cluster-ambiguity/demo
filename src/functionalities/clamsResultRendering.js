import * as d3 from 'd3';
import { SVD } from "svd-js" 
import * as INTERACTION from "./interaction";
import * as RENDERER from "./scatterplotRendering";

let MEANS = null;
let COVS = null;
let CANVAS = null;
let CTX = null;
let COLORSCALE = null;
let DATA = null;
let AMBIGUITY = null;

export function renderGMM(canvas, ctx, means, covs, colorScale, data, ambiguity) {
	// render gmm info in the canvas
	// const ctx = canvas.getContext("2d");
	// ctx.clearRect(0, 0, size, size);

	// draw ellipse

	const scale = 2;

	means.forEach((mean, i) => {
		const a = covs[i].a;
		const b = covs[i].b;
		const angle = covs[i].angle;
		const color = colorScale(i);
		// ellipse with opacity 0.3
		ctx.beginPath();
		ctx.ellipse(mean[0], mean[1], a * scale, b * scale, angle, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.globalAlpha = 0.3;
		ctx.fill();
		ctx.globalAlpha = 1;
	});

	MEANS = means;
	COVS = covs;
	CANVAS = canvas;
	CTX = ctx;
	COLORSCALE = colorScale;
	DATA = data;
	AMBIGUITY = ambiguity;
}



export function emphasizeGMM(emphasizingIndices) {
	CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
	RENDERER.drawSplot(CANVAS.width, CANVAS, CTX, DATA, 0.7);

	// draw ellipse
	const scale = 2;
	MEANS.forEach((mean, i) => {
		const a = COVS[i].a;
		const b = COVS[i].b;
		const angle = COVS[i].angle;
		const color = COLORSCALE(i);
		// ellipse with opacity 0.3
		CTX.beginPath();
		CTX.ellipse(mean[0], mean[1], a * scale, b * scale, angle, 0, 2 * Math.PI);
		CTX.fillStyle = color;
		if (emphasizingIndices.includes(i)) {
			CTX.globalAlpha = 0.7;
			// add border
			CTX.lineWidth = 2;
		} else {
			CTX.globalAlpha = 0.3;
		}

		// ctx.globalAlpha = 0.3;
		CTX.fill();
		CTX.globalAlpha = 1;
	});

}

let SEP = null;

export function renderMat(svg, size, mat, colorScale, isSep=false) {
	const cellNum = mat.length;
	const cellSize = size / cellNum;

	if (isSep) {
		SEP = mat;
	}


	// matrix is a 2d array
	d3.select(svg)
		.selectAll("g")
	  .data(mat)
		.enter()
		.append("g")
		.attr("class", (d, i) => `g_${i}`)
		.attr("transform", (d, i) => `translate(0, ${(i - 1) * cellSize})`)
		.selectAll("rect")
			.data(d => d)
			.enter()
			.append("rect")
			.attr("x", (d, i) => (i + 1) * cellSize)
			.attr("y", 0)
			.attr("width", cellSize)
			.attr("height", cellSize)
			.attr("fill", "black")
			.attr("fill-opacity", d => d)
			.attr("class", function (d, j)  {
				const gClass = d3.select(this.parentNode).attr("class");
				const gClassIdx = gClass.split("_")[1];
				return `class_${gClassIdx}_${j}`;
			})
			.on("mouseover", function(d, i) {
				const cellClass = d3.select(this).attr("class");
				const [rowIdx, colIdx] = cellClass.split("_").map(d => parseInt(d)).slice(1, 3);
				if (rowIdx > colIdx)
					INTERACTION.mouseHoverMatCell(rowIdx, colIdx);
			})
			.on("mouseout", function(d, i) {
				const cellClass = d3.select(this).attr("class");
				const [rowIdx, colIdx] = cellClass.split("_").map(d => parseInt(d)).slice(1, 3);
				if (rowIdx > colIdx)
					INTERACTION.mouseOutMatCell(rowIdx, colIdx);
			})

	// render each row / col cell as a circle
	d3.select(svg)
		.append("g")
		.attr("class", "matRow")
		.attr("transform", `translate(0, ${size - cellSize})`)
		.selectAll("circle")
		.data(new Array(cellNum - 1).fill(0).map((d, i) => i))
		.enter()
		.append("circle")
		.attr("cx", (d, i) => (i + 1) * cellSize + cellSize / 2)
		.attr("cy", cellSize / 2)
		.attr("r", cellSize / 2 - 6)
		.attr("fill", (d, i) => colorScale(i))

	d3.select(svg)
		.append("g")
		.attr("class", "matCol")
		.selectAll("circle")
		.data(new Array(cellNum - 1).fill(0).map((d, i) => i))
		.enter()
		.append("circle")
		.attr("cx", cellSize / 2)
		.attr("cy", (d, i) => (i ) * cellSize + cellSize / 2)
		.attr("r", cellSize / 2 - 6)
		.attr("fill", (d, i) => colorScale(i + 1))

	if (isSep) {
		d3.select(svg)
			.append("g")
			.attr("transform", `translate(${size / 2 + 23}, ${15})`)
			.append("text")
			.text("Separability")
			.style("font-weight", "bold")
			.style("fill", "#186bf0")
	}
	else {
		d3.select(svg)
			.append("g")
			.attr("transform", `translate(${size / 2 + 28}, ${15})`)
			.append("text")
			.text("Ambiguity")
			.style("font-weight", "bold")
			.style("fill", "#f08f18")

	}
}

let XSCALE = null;
let YSCALE = null;


export function initiateSepAmbGraph(svg, size, margin) {
	// draw axes
	const xScale = d3.scaleLinear().domain([0, 1]).range([margin, size - margin]);
	const yScale = d3.scaleLinear().domain([0, 1]).range([size - margin, margin]);

	XSCALE = xScale;
	YSCALE = yScale;

	const xAxis = d3.axisBottom(xScale).ticks(5);
	const yAxis = d3.axisLeft(yScale).ticks(5);

	d3.select(svg)
		.append("g")
		.attr("class", "xAxis")
		.attr("transform", `translate(0, ${size - margin})`)
		.call(xAxis)
	
	d3.select(svg)
		.append("g")
		.attr("class", "yAxis")
		.attr("transform", `translate(${margin}, 0)`)
		.call(yAxis)
	
	// draw a y = x line
	d3.select(svg)
		.append("line")
		.attr("x1", margin)
		.attr("y1", size - margin)
		.attr("x2", size - margin)
		.attr("y2", margin)
		.attr("stroke", "#186bf0")
		.attr("stroke-width", 2)
		.attr("stroke-dasharray", "5, 5")

	// add a text label called "separability" along y=x line (45 degree)
	d3.select(svg)
		.append("text")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "middle")
		.attr("transform", "rotate(-45)")
		.attr("x", 0)
		.attr("y", size / 1.5)
		.attr("font-size", 12)
		.attr("font-weight", "bold")
		.attr("fill", "#186bf0")
		.text("Separability")
		


	// draw a shannon entropy function line (y = -xlogx - (1 - x)log(1 - x))
	const line = d3.line()
								.x(d => xScale(d.x))
								.y(d => yScale(d.y))
								.curve(d3.curveMonotoneX);
	
	const entropyLine = new Array(1000).fill(0).map((d, i) => {
		const x = (i + 1) / 1001;
		const y = -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
		return {x: x, y: y};
	});

	d3.select(svg)
		.append("path")
		.attr("d", line(entropyLine))
		.attr("stroke", "#f08f18")
		.attr("stroke-width", 2)
		.attr("fill", "none")
		.attr("stroke-dasharray", "5, 5")

	// add a text label called "ambiguity" along shannon entropy line (-20 degree)
	d3.select(svg)
	  .append("text")
		// .attr("text-anchor", "middle")/
		// .attr("alignment-baseline", "middle")
		.attr("transform", "rotate(76)")
		.attr("x", 170)
		.attr("y", -155)
		.attr("font-size", 12)
		.attr("font-weight", "bold")
		.attr("fill", "#f08f18")
		.text("Ambiguity")

}

export function updateSepAmbGraph(rowIdx, colIdx) {
	const sepVal = SEP[rowIdx][colIdx];

	d3.select("#sepAmbSvg")
	  .selectAll("#sepCircle")
		.remove();

	d3.select("#sepAmbSvg")
		.append("circle")
	  .attr("cx", XSCALE(sepVal))
		.attr("cy", YSCALE(sepVal))
		.attr("r", 5)
		.attr("fill", "#186bf0")
		.attr("stroke", "black")
		.attr("stroke-width", 2)
		.attr("id", "sepCircle")

	const ambVal = -sepVal * Math.log2(sepVal) - (1 - sepVal) * Math.log2(1 - sepVal);

	d3.select("#sepAmbSvg")
		.selectAll("#ambCircle")
		.remove();
	
	d3.select("#sepAmbSvg")
		.append("circle")
		.attr("cx", XSCALE(sepVal))
		.attr("cy", YSCALE(ambVal))
		.attr("r", 5)
		.attr("fill", "#f08f18")
		.attr("stroke", "black")
		.attr("stroke-width", 2)
		.attr("id", "ambCircle")

	document.getElementById("ambDescriptionP").innerHTML = `The separability is <b>${sepVal.toFixed(2)}</b>, and the ambiguity is <b>${ambVal.toFixed(2)}</b>.`;
}

export function deleteSepAmbGraph() {
	d3.select("#sepAmbSvg")
	  .selectAll("#sepCircle")
		.remove();

	d3.select("#sepAmbSvg")
		.selectAll("#ambCircle")
		.remove();
	document.getElementById("ambDescriptionP").innerHTML = "The cluster ambiguity of the scatterplot is <b>" + AMBIGUITY.toFixed(2) + "</b>.";
}