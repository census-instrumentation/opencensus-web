import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { exportRootSpanAfterLoadEvent } from '@opencensus/web-all';

ReactDOM.render(<App name="Cristian"/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


// window.ocAgent = 'http://104.196.50.13/';
window.ocAgent = 'http://localhost:55678';
window.ocSampleRate = 1.0; // Sample at 100% for test only. Default is 1/10000.

// Send the root span and child spans for the initial page load to the
// OpenCensus agent if this request was sampled for trace.
exportRootSpanAfterLoadEvent();
