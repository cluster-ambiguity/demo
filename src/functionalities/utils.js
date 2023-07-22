import * as d3 from 'd3';
import { SVD } from "svd-js" 

export function normalize(data, size, margin) {



	const minX = Math.min(...data.map(d => d[0]));
	const maxX = Math.max(...data.map(d => d[0]));
	const minY = Math.min(...data.map(d => d[1]));
	const maxY = Math.max(...data.map(d => d[1]));

	const xScale = d3.scaleLinear().domain([minX, maxX]).range([margin, size - margin]);
	const yScale = d3.scaleLinear().domain([minY, maxY]).range([size - margin, margin]);


	return data.map(d => [xScale(d[0]), yScale(d[1])]);

}

export function decomposeCov(covs) {
	return covs.map(cov => {
		const { u, v, q} = SVD(cov);
		const angle = Math.atan2(v[1][0], v[0][0]);
		let a = Math.sqrt(q[0]);
		let b = Math.sqrt(q[1]);
		// if (a < b) {
		// 	let temp = a;
		// 	a = b;
		// 	b = temp;
		// }
		return {
			a: a,
			b: b,
			angle: angle
		}
	});
	
}

export function extractAmbDataFromResponse(res) {
	const data = res.data;
	const ambiguity = data.ambiguity_score;
	const keyList = data.key_list;
	const keyListElement = keyList.reduce((acc, curr) => { return acc.concat(curr.split("_")) }, []);
	const maxKey = d3.max(keyListElement.map((key) => parseInt(key)));
	const sepMat = new Array(maxKey + 1).fill(0).map(() => new Array(maxKey + 1).fill(0));
	const ambMat = new Array(maxKey + 1).fill(0).map(() => new Array(maxKey + 1).fill(0));
	
	const means = data.means;
	const covs = data.covariances; 
	const proba = data.proba;
	for (let i = 0; i < keyList.length; i++) {
		const key = keyList[i].split("_");
		sepMat[key[1]][key[0]] = data.separability_list[i];
		ambMat[key[1]][key[0]] = data.ambiguity_list[i];
	}


	return {
		ambiguity: ambiguity,
		sepMat: sepMat,
		ambMat: ambMat,
		means: means,
		covs: covs,
		proba: proba
	}
}

export function extractLabels(proba) {
	// proba is a 2d array where each row represents the probability to be contained in each class
	// return a 1d array where each element represents the label of the corresponding data point
	// it should be probabilistic. 
	// if the probability of a data point to be in class 1 is 0.8 and 
	// the probability of a data point to be in class 2 is 0.2, 
	// then the label of the data point should be 1 in 80%

	const labels = [];
	for (let i = 0; i < proba.length; i++) {
		const prob = proba[i];
		const probAccumulate = new Array(prob.length).fill(0);
		prob.forEach((p, j) => {
			for (let k = j; k < prob.length; k++) {
				probAccumulate[k] += p;
			}
		});
		const rand = Math.random();
		let label = 0;
		for (let j = 0; j < probAccumulate.length; j++) {
			if (rand < probAccumulate[j]) {
				label = j
				break;
			}
		}
		labels.push(label);
	}
	return labels;

}