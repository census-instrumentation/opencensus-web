/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      gRPC://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { pi: { time: 0, value: "unknown" }, prime_numbers: { time: 0, value: [] } };
    this.handleClick = this.handleClick.bind(this);
    this.runSecondTask = this.callPrimeNumbersApi.bind(this);
    this.host = 'http://localhost:8088';
  }

  handleClick() {
    console.log("Entering handle click.");

    this.callSleepApi();
  }

  callSleepApi() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        this.callPrimeNumbersApi();
      }
    };
    xhr.open('GET', this.host + "/sleep");
    xhr.send();
  }

  callPrimeNumbersApi() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const data = JSON.parse(xhr.responseText)
        const result = this.callCalculatePi();
        this.setState({ pi: result, prime_numbers: data });
      }
    };

    xhr.open('GET', this.host + "/prime_numbers");
    xhr.send();
  }

  callCalculatePi() {
    const time = Date.now();
    console.log("Calculating PI");
    const pi = this.calculatePi();
    console.log("Finished calculating PI");
    return { time: (Date.now() - time), value: pi };
  }

  // Calculates PI using Gregory-Leibniz series, just to make the process longer.
  calculatePi() {
    let result = 0.0;
    let divisor = 1.0;
    for (let i = 0; i < 2000000000; i++) {
      if (i % 2) {
        result -= 4 / divisor;
      } else {
        result += 4 / divisor;
      }
      divisor += 2;
    }
    return result;
  }

  render() {
    return (
      <div>
        <p>This example makes some calculations like calculate Pi using the series from
        and calculate the amount of prime numbers in between 1 and 100000. These
        calculations are done using slow methods in order to measure the traces.</p>

        <button onClick={this.handleClick}>Trace user interaction</button>

        <p>The value of Pi is: <code>{this.state.pi.value}</code> and it took
        <code> {this.state.pi.time} ms </code> to compute this.</p>

        <p>The amount of prime numbers is: <code> {this.state.prime_numbers.value.length} </code>
          and it took <code> {this.state.prime_numbers.time} ms </code> to compute this.</p>

      </div>
    );
  }
}

export default App;
