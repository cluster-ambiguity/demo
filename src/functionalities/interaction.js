import * as d3 from 'd3';
import * as CLAMSRENDERING from './clamsResultRendering';
import * as RENDERER from "./scatterplotRendering";

export function mouseHoverMatCell(rowCell, matCell, val) {
	d3.selectAll(`.class_${rowCell}_${matCell}`)
		.attr("stroke", "red")
		.attr("stroke-width", 5)
		.attr("stroke-opacity", 1);
	
	CLAMSRENDERING.emphasizeGMM([rowCell, matCell]);
	CLAMSRENDERING.updateSepAmbGraph(rowCell, matCell);
	
	RENDERER.drawSplotWithLabels(2, [rowCell, matCell]);
}

export function mouseOutMatCell(rowCell, matCell) {
	d3.selectAll(`.class_${rowCell}_${matCell}`)
		.attr("stroke", "none");
	
	CLAMSRENDERING.emphasizeGMM([]);
	CLAMSRENDERING.deleteSepAmbGraph();

	RENDERER.drawSplotWithLabels(2, []);
}