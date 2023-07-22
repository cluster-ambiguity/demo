import { useEffect } from 'react';
import './App.css';
import * as RENDERER from './functionalities/scatterplotRendering';
import * as UTILS from './functionalities/utils';
import axios from 'axios';
import * as CLAMSRENDERER from './functionalities/clamsResultRendering';
import * as d3 from 'd3';


function App() {

	const mainSvgSize = 500;
	const mainSvgMargin = 30;
	const clamsViewSize = mainSvgSize / 2;
	const clamsViewMargin = mainSvgMargin / 1.2;
	const datasetList = require("./dataset_list.json");
	let canvas, ctx;
	let clamsCanvas, clamsCtx;

	const colorScale = d3.scaleOrdinal(d3.schemeSet3).domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

	const SERVER_URL = "http://147.46.242.161:9999"

	// data
	let data = null;
	let normalizedData = null;
	let smallNormalizedData = null;
	let sepMat = null;
	let ambMat = null;
	let means = null;
	let covs= null;
	let ambiguity = null;
	let labels = null;

	let useEffectRunOnce = false;

	useEffect(() => {
		if (useEffectRunOnce) {return;}
		useEffectRunOnce = true;
		canvas = document.getElementById("mainCanvas");
		ctx = canvas.getContext("2d");
		clamsCanvas = document.getElementById("clamsGMMCanvas");
		clamsCtx = clamsCanvas.getContext("2d");
		RENDERER.initiateSplot(mainSvgSize, canvas, ctx);
		RENDERER.initiateSplot(clamsViewSize, clamsCanvas, clamsCtx);

		// load initial data
		const datasetName = document.getElementsByClassName("svgSelect")[0].value 
		data = require(`./pre_datasets/${datasetName}`);
		normalizedData = UTILS.normalize(data, mainSvgSize, mainSvgMargin);
		RENDERER.drawSplot(mainSvgSize, canvas, ctx, normalizedData,2,  true)
		runClams();
	
	}, []);

	
	const selectScatterplot = (e) => {
		if (e.target.value === "none") {
			RENDERER.initializeSplot(mainSvgSize, canvas, ctx);
			return;
		}
		data = require(`./pre_datasets/${e.target.value}`);
		normalizedData = UTILS.normalize(data, mainSvgSize, mainSvgMargin);
		RENDERER.drawSplot(mainSvgSize, canvas, ctx, normalizedData, 2, true);
		initiateClams();
		runClams();
	}

	const handleFileUpload = (e) =>{
		const file = e.target.files[0];
		if (file && file.type === 'application/json') {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const jsonContent = JSON.parse(e.target.result);
					data = JSON.parse(JSON.stringify(jsonContent));
					normalizedData = UTILS.normalize(jsonContent, mainSvgSize, mainSvgMargin);
					RENDERER.drawSplot(mainSvgSize, canvas, ctx, normalizedData, 2, true);
					initiateClams();
					runClams();
					
				} catch (error) {
					alert('Invalid JSON file');
				}
			};
			reader.readAsText(file);
		} else {
			alert('Please upload a JSON file');
		}
	}

	const initiateClams = () => {
		d3.select("#sepAmbSvg").selectAll("*").remove();
		d3.select("#sepMat").selectAll("*").remove();
		d3.select("#ambMat").selectAll("*").remove();
		document.getElementById("clamsGMMCanvas").getContext("2d").clearRect(0, 0, clamsViewSize, clamsViewSize);
		document.getElementById("ambDescriptionP").innerHTML = "";
	}

	const runClams = () => {
		smallNormalizedData = UTILS.normalize(data, clamsViewSize, clamsViewMargin);
		document.getElementById("loadingAlarm").style.visibility = "visible";
		document.getElementById("svgInput").disabled = true;
		document.getElementById("svgInput").style.cursor = "not-allowed";
		document.getElementById("uploadButtonDiv").style.opacity = "0.5";
		document.getElementById("uploadButtonDiv").style.cursor = "not-allowed";
		document.getElementById("svgPre").disabled = true;
		document.getElementById("svgPre").style.cursor = "not-allowed";
		// document.getElementById("svgSelect").disabled = true;
		axios.post(`${SERVER_URL}/clams`, {
			data: smallNormalizedData
		}).then((res) => {
			const responseParseResult = UTILS.extractAmbDataFromResponse(res);
			ambiguity = responseParseResult.ambiguity;
			sepMat = responseParseResult.sepMat;
			ambMat = responseParseResult.ambMat;
			means  = responseParseResult.means;
			covs   = responseParseResult.covs;
			labels = UTILS.extractLabels(responseParseResult.proba);
			document.getElementById("loadingAlarm").style.visibility = "hidden";
			document.getElementById("svgInput").disabled = false;
			document.getElementById("svgInput").style.cursor = "pointer";
			document.getElementById("uploadButtonDiv").style.opacity = "1";
			document.getElementById("uploadButtonDiv").style.cursor = "pointer";
			document.getElementById("svgPre").disabled = false;
			document.getElementById("svgPre").style.cursor = "pointer";
			CLAMSRENDERER.renderMat(document.getElementById("sepMat"), clamsViewSize, sepMat, colorScale, true);
			CLAMSRENDERER.renderMat(document.getElementById("ambMat"), clamsViewSize, ambMat, colorScale);
			RENDERER.initializeSplot(clamsViewSize, clamsCanvas, clamsCtx);
			covs = UTILS.decomposeCov(covs);
			RENDERER.drawSplot(clamsViewSize, clamsCanvas, clamsCtx, smallNormalizedData, 0.7);
			RENDERER.installLabels(labels);
			CLAMSRENDERER.renderGMM(clamsCanvas, clamsCtx, means, covs, colorScale, smallNormalizedData, ambiguity);
			CLAMSRENDERER.initiateSepAmbGraph(document.getElementById("sepAmbSvg"), clamsViewSize, clamsViewMargin);
			document.getElementById("ambDescriptionP").innerHTML = "The cluster ambiguity of the scatterplot is <b>" + ambiguity.toFixed(2) + "</b>.";
		})
		.catch((err) => {
			console.log(err)
			runClams();
			// alert("Oops! Something went wrong with the server. Please try again.")
		})

	}

  return (
    <div className="App">
			<h1>CLAMS DEMO INTERFACE</h1>
			<div className="suppDiv">
				<h2>Supplemental material of the paper <b><i>CLAMS</i>: A Cluster Ambiguity Measure for Estimating Perceptual Variability in Visual Clustering</b></h2>
			</div>
			<p>
				<b> <i>Please give a few seconds for the CLAMS results to load. The connection might be slow or unstable.</i> </b>
			</p>
			<p>
				We introduce a visual quality measure (VQM) called
				CLAMS uses a statistical model derived from perceptual data to
				automatically assess cluster ambiguity in monochrome scatterplots
				In this interactive demo, you will experience the functionality of <b>CLAMS</b>. 
				You will observe applying CLAMS to a scatterplot to measure cluster ambiguity.
				 You can <b>upload</b> scatterplot data in JSON format (holding 2D array) or <b> select</b> the provided 
				 sample scatterplots through a drop-down menu. Once you have drawn or uploaded the scatterplot
				 as desired, wait a few seconds for CLAMS to compute cluster ambiguity.
			</p>
			<h3>
				Instruction
			</h3>

			<p>
				After you select or upload a dataset (default: t-SNE projection of Fashion-MNIST) 
				and CLAMS finishes computing cluster ambiguity of the scatterplot, 
				you will see four visualizations depicting the intermediate results CLAMS. 
				(1) In the lower-left corner, you will see the same scatterplot and the 
				Gaussian Mixture Model (GMM) fitted to the scatterplot. 
				Each Gaussian component is colored differently; 
				(2) you can see the pairwise separability and 
				(3) the pairwise ambiguity of the Gaussian components in the heatmaps on the top row. 
				The saturation of the cells in the heatmaps indicates the pairwise separability and ambiguity 
				of the Gaussian components corresponding to the row and column. 
				The darker the color, the higher the scores. 
				Note that you can highlight the corresponding Gaussian components and 
				data points in the scatterplot by <b>hovering</b> the mouse over the cells in the heatmaps. 
				(4) Moreover, this will show the graph's corresponding separability and ambiguity scores in the 
				lower right corner. 
				Our interface calculates the ambiguity score for each selected dataset's scatterplot.
			</p>
			<div id="demoDiv">
				<div id="titleDiv">
					<div className="titleDivSmall" style={{ width: mainSvgSize + mainSvgMargin}}>
						<h3> INPUT SCATTERPLOT</h3>
					</div>
					<div className="titleDivSmall" style={{ width: mainSvgSize }}>
						<h3> CLAMS OUTPUT</h3>
					</div>
				</div>
				<div id="mainSvgDiv">
					
					<div id="mainCanvasDiv">
						<canvas id="mainCanvas" width={mainSvgSize} height={mainSvgSize}></canvas>
						<div >
							{/* <button id="uploadButton" className="svgButton">Upload JSON dataset</button> */}
							<div id="mainSvgButtonDiv">
								<div>
									<label htmlFor="svgInput">
										<div id="uploadButtonDiv">
											Upload DATASET
										</div>
										<input id="svgInput" type="file" accept=".json" onChange={handleFileUpload} />
									</label>
									<div className="buttonDesc">
										Upload your JSON dataset with 2D array
									</div>
								</div>
								<div>
									<select id="svgPre" className="svgSelect" onChange={selectScatterplot}>
										{/* <option value="none">Select a Scatterplot</option> */}
										{datasetList.map((dataset, i) => (
											<option value={dataset} key={i}>{dataset}</option>
										))}
									</select>
									<div className="buttonDesc">
										Select available dataset
									</div>
								</div>

							</div>
						</div>
					</div>
					<div id="clamsResultDiv">
						<div id="loadingAlarm" style={{ visibility: "hidden" }}>
							Computing CLAMS...
						</div>
						<div>
							<svg id="sepMat" className="mat" width={clamsViewSize} height={clamsViewSize}></svg>
							<svg id="ambMat" className="mat" width={clamsViewSize} height={clamsViewSize}></svg>
						</div>
						<div>
							<canvas id="clamsGMMCanvas" width={clamsViewSize} height={clamsViewSize}></canvas>
							<svg id="sepAmbSvg" width={clamsViewSize} height={clamsViewSize}></svg>
						</div>
						<div id="ambDescription">
							<p id="ambDescriptionP"></p>
						</div>

					</div>
				</div>
			</div>
			<p>
				For more information and discussions, please read our academic paper 
				"<i>CLAMS</i>: A Cluster Ambiguity Measure for Estimating Perceptual Variability in Visual Clustering". 
			</p>
			<h3>
				Thank you for enjoying CLAMS!
			</h3>
    </div>
  );
}

export default App;
