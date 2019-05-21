import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { exportRootSpanAfterLoadEvent } from '@opencensus/web-all';

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();

window.ocAgent = 'http://localhost:55678';
window.ocSampleRate = 1.0; // Sample at 100% for test only. Default is 1/10000.

// Send the root span and child spans for the initial page load to the
// OpenCensus agent if this request was sampled for trace.
exportRootSpanAfterLoadEvent();
