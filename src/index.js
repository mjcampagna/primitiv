import 'normalize.css';
import './app.css';

import { imgSrcToBlob } from 'blob-util';

// import primitive from './primitive/app.js';
	// import * as ui from "./primitive/ui.js";
	import Canvas from "./primitive/canvas.js";
	import {Triangle, Rectangle, Ellipse} from "./primitive/shape.js";
	import Optimizer from "./primitive/optimizer.js";


let cfg = {
	steps: 50,
	computeSize: 256, 
	viewSize: 512, 
	shapes: 200, 
	alpha: 0.5,
	mutations: 30,
	mutateAlpha: true,
	shapeTypes: [Triangle],
	fill: 'auto'
};

const nodes = {
	output: document.querySelector("#output"),
	original: document.querySelector("#original"),
	steps: document.querySelector("#steps"),
	raster: document.querySelector("#raster"),
	vector: document.querySelector("#vector"),
	vectorText: document.querySelector("#vector-text"),
	types: Array.from(document.querySelectorAll("#output [name=type]"))
};

let steps;

function go(original, cfg) {

	nodes.steps.innerHTML = '';
	nodes.original.innerHTML = '';
	nodes.raster.innerHTML = '';
	nodes.vector.innerHTML = '';
	nodes.vectorText.value = '';

	nodes.output.style.display = '';
	nodes.original.appendChild(original.node);

	let optimizer = new Optimizer(original, cfg);
	steps = 0;

	let cfg2 = Object.assign({}, cfg, {width:cfg.scale*cfg.width, height:cfg.scale*cfg.height});
	let result = Canvas.empty(cfg2, false);
	result.ctx.scale(cfg.scale, cfg.scale);
	nodes.raster.appendChild(result.node);

	let svg = Canvas.empty(cfg, true);
	svg.setAttribute("width", cfg2.width);
	svg.setAttribute("height", cfg2.height);
	nodes.vector.appendChild(svg);

	let serializer = new XMLSerializer();

	optimizer.onStep = (step) => {
		if (step) {
			result.drawStep(step);
			svg.appendChild(step.toSVG());
			let percent = (100*(1-step.distance)).toFixed(2);
			nodes.vectorText.value = serializer.serializeToString(svg);
			nodes.steps.innerHTML = `(${++steps} of ${cfg.steps}, ${percent}% similar)`;
		}
	};
	optimizer.start();

}

document.addEventListener('submit', event => {
	event.preventDefault();
	let input = document.querySelector("input[type=file]");
	let url;
	if (input.files.length > 0) {
		let file = input.files[0];
		url = URL.createObjectURL(file);
	}
	Canvas.original(url, cfg).then(original => go(original, cfg));
});

document.addEventListener('click', event => {
	if ( event.target.nodeName === 'IMG' ) {
		const src = event.target.getAttribute('src');
		imgSrcToBlob(src).then( blob => {
			let url = URL.createObjectURL(blob);
			Canvas.original(url, cfg).then(original => go(original, cfg));
		})
		.catch( err => console.log('Image failed to load...', err) );
	}
});
