import * as d3 from "d3";

let LABELS = null;

export function installLabels(labels) {
	LABELS = labels;
}

export function initiateSplot(size, canvas, ctx) {
	ctx.clearRect(0, 0, size, size);
}

export function initializeSplot(size, canvas, ctx) {
	ctx.clearRect(0, 0, size, size);
}

let CANVAS, CTX, DATA, SIZE;

export function drawSplot(size, canvas, ctx, data, rad = 2, isBig = false) {
	ctx.clearRect(0, 0, size, size);
	data.forEach(d => {
		// draw circle
		ctx.beginPath();
		ctx.arc(d[0], d[1], rad, 0, 2 * Math.PI);
		ctx.fillStyle = "black";
		ctx.fill();
	});

	if (isBig){
		CANVAS = canvas;
		CTX = ctx;
		DATA = data;
		SIZE = size;
	}

}

export function drawSplotWithLabels(rad = 2, labelIdices) {
	const colorScale = d3.scaleOrdinal(d3.schemeSet3).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	CTX.clearRect(0, 0, SIZE, SIZE);
	DATA.forEach((d, i) => {
		// draw circle
		CTX.beginPath();
		CTX.arc(d[0], d[1], rad, 0, 2 * Math.PI);
		if (labelIdices.includes(LABELS[i])) {
			CTX.fillStyle = colorScale(LABELS[i]);
		} else {
			CTX.fillStyle = "black";
		}
		CTX.fill();
	});
}