/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import 'zone.js/dist/zone.js';
import {
  tracing,
  Span,
  ATTRIBUTE_HTTP_STATUS_CODE,
  ATTRIBUTE_HTTP_METHOD,
  WindowWithOcwGlobals,
} from '@opencensus/web-core';
import {
  InteractionTracker,
  RESET_TRACING_ZONE_DELAY,
} from '../src/interaction-tracker';
import {
  doPatching,
  setXhrAttributeHasCalledSend,
} from '../src/monkey-patching';
import { spanContextToTraceParent } from '@opencensus/web-propagation-tracecontext';
import { createFakePerfResourceEntry, spyPerfEntryByType } from './util';
import { getInitialLoadSpanContext } from '@opencensus/web-initial-load';

describe('InteractionTracker', () => {
  doPatching();
  InteractionTracker.startTracking();
  let onEndSpanSpy: jasmine.Spy;
  const windowWithOcwGlobals = window as WindowWithOcwGlobals;
  // Sample 100% of interactions for the testing. Necessary as the sampling
  // decision is supposed to be done in the initial load page and the
  // interaction tracker uses the same sampling decision.
  windowWithOcwGlobals.ocSampleRate = 1.0;
  getInitialLoadSpanContext();

  // Use Buffer time as we expect that these interactions take
  // a little extra time to complete due to the setTimeout that
  // is needed for the final completion and runs in a different
  // tick.
  const TIME_BUFFER = 10;
  const XHR_TIME = 60;
  const SET_TIMEOUT_TIME = 60;
  const BUTTON_TAG_NAME = 'BUTTON';

  tracing.registerExporter(tracing.exporter);
  beforeEach(() => {
    onEndSpanSpy = spyOn(tracing.exporter, 'onEndSpan');
  });

  it('should handle interactions with no async work', done => {
    fakeInteraction(noop);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      // As there is another setTimeOut that completes the interaction, the
      // span duraction is not precise, then only test if the interaction duration
      // finishes within a range.
      expect(rootSpan.duration).toBeLessThan(TIME_BUFFER);
      done();
    });
  });

  it('should handle interactions with macroTask', done => {
    const onclick = () => {
      setTimeout(noop, SET_TIMEOUT_TIME);
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
      expect(rootSpan.duration).toBeLessThanOrEqual(
        SET_TIMEOUT_TIME + TIME_BUFFER
      );
      done();
    });
  });

  it('should handle interactions with microTask', done => {
    const onclick = () => {
      const promise = getPromise();
      promise.then(noop);
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(TIME_BUFFER);
      done();
    });
  });

  it('should handle interactions with canceled tasks', done => {
    const interactionTime = SET_TIMEOUT_TIME - 10;
    const canceledTask = () => {
      const timeoutId = setTimeout(noop, SET_TIMEOUT_TIME);
      setTimeout(() => {
        clearTimeout(timeoutId);
      }, interactionTime);
    };
    fakeInteraction(canceledTask);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(interactionTime);
      //The duration has to be less than set to the canceled timeout.
      expect(rootSpan.duration).toBeLessThan(SET_TIMEOUT_TIME);
      done();
    });
  });

  it('should ignore interactions on elements with disable', done => {
    const onclick = () => {
      setTimeout(noop, SET_TIMEOUT_TIME);
    };
    const button = createButton('test interaction', true);
    fakeInteraction(onclick, button);

    const onclick2 = () => {
      setTimeout(noop, SET_TIMEOUT_TIME);
    };

    button.removeAttribute('disabled');
    fakeInteraction(onclick2, button);
    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      // Make sure `onEndSpan` is called only once;
      expect(onEndSpanSpy.calls.count()).toBe(1);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
      expect(rootSpan.duration).toBeLessThanOrEqual(
        SET_TIMEOUT_TIME + TIME_BUFFER
      );
      done();
    });
  });

  it('should handle interactions on elements without data-ocweb-id attribute', done => {
    const onclick = () => {
      setTimeout(noop, SET_TIMEOUT_TIME);
    };
    const button = createButton('');
    fakeInteraction(onclick, button);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('button#test_element click');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
      expect(rootSpan.duration).toBeLessThanOrEqual(
        SET_TIMEOUT_TIME + TIME_BUFFER
      );
      done();
    });
  });

  it('should ignore periodic tasks', done => {
    const onclick = () => {
      const interaval = setInterval(() => {
        clearInterval(interaval);
      }, SET_TIMEOUT_TIME);
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(TIME_BUFFER);
      done();
    });
  });

  it('should not start new interaction if second click handler occurs before 50 ms.', done => {
    const onclickInteraction1 = () => {
      setTimeout(noop, RESET_TRACING_ZONE_DELAY + 10);
    };
    fakeInteraction(onclickInteraction1);

    const onclickInteraction2 = () => {
      setTimeout(noop, SET_TIMEOUT_TIME);
    };
    // Schedule a second interactionto be run  before `RESET_TRACING_ZONE_DELAY`
    setTimeout(() => {
      fakeInteraction(onclickInteraction2);
    }, RESET_TRACING_ZONE_DELAY - 10);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      // As this click is done at 'RESET_TRACING_ZONE_DELAY - 10' and this click has a
      // setTimeout, the minimum time taken by this click is the sum of these values.
      const timeInteraction2 = RESET_TRACING_ZONE_DELAY - 10 + SET_TIMEOUT_TIME;
      expect(rootSpan.duration).toBeGreaterThanOrEqual(timeInteraction2);
      expect(rootSpan.duration).toBeLessThanOrEqual(
        timeInteraction2 + TIME_BUFFER
      );
      done();
    });
  });

  it('should create a new interaction and track overlapping interactions.', done => {
    const timeInteraction1 = RESET_TRACING_ZONE_DELAY + 10;
    const onclickInteraction1 = () => {
      setTimeout(noop, timeInteraction1);
    };
    fakeInteraction(onclickInteraction1);

    const onclickInteraction2 = () => {
      setTimeout(noop, RESET_TRACING_ZONE_DELAY);
    };
    // Schedule a second interaction starting after `RESET_TRACING_ZONE_DELAY` ms
    setTimeout(() => {
      fakeInteraction(onclickInteraction2);
    }, RESET_TRACING_ZONE_DELAY + 1);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      // Test related to the first interaction
      if (onEndSpanSpy.calls.count() === 1) {
        expect(rootSpan.duration).toBeGreaterThanOrEqual(timeInteraction1);
        expect(rootSpan.duration).toBeLessThanOrEqual(
          timeInteraction1 + TIME_BUFFER
        );
      } else {
        expect(rootSpan.duration).toBeGreaterThanOrEqual(
          RESET_TRACING_ZONE_DELAY
        );
        expect(rootSpan.duration).toBeLessThanOrEqual(
          RESET_TRACING_ZONE_DELAY + TIME_BUFFER
        );
        done();
      }
    });
  });

  describe('Route transition', () => {
    afterEach(() => {
      // To allow the several tests to detect the route transition, go back to
      // the home page.
      history.back();
    });

    it('should handle route transition interaction and rename the interaction as Navigation', done => {
      const onclick = () => {
        setTimeout(() => {
          history.pushState({ test: 'testing' }, 'page 2', '/test_navigation');
        }, SET_TIMEOUT_TIME);
      };
      // Create a button without 'data-ocweb-id' attribute.
      const button = createButton('');
      fakeInteraction(onclick, button);

      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('Navigation /test_navigation');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
        expect(rootSpan.duration).toBeLessThanOrEqual(
          SET_TIMEOUT_TIME + TIME_BUFFER
        );
        done();
      });
    });

    it('should not rename span as Navigation if it used data-ocweb-id', done => {
      const onclick = () => {
        setTimeout(() => {
          history.pushState({ test: 'testing' }, 'page 2', '/test_navigation');
        }, SET_TIMEOUT_TIME);
      };
      // Create a button with 'data-ocweb-id' attribute.
      const button = createButton('Test navigation');
      fakeInteraction(onclick, button);

      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('Test navigation');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
        expect(rootSpan.duration).toBeLessThanOrEqual(
          SET_TIMEOUT_TIME + TIME_BUFFER
        );
        done();
      });
    });
  });

  describe('Custom Spans', () => {
    it('Should handle the custom spans and add them to the current root span as child spans', done => {
      const onclick = () => {
        // Start a custom span for the setTimeout.
        const setTimeoutCustomSpan = tracing.tracer.startChildSpan({
          name: 'setTimeout custom span',
        });
        setTimeout(() => {
          setTimeoutCustomSpan.end();
        }, SET_TIMEOUT_TIME);
      };
      fakeInteraction(onclick);

      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('test interaction');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.spans.length).toBe(1);
        const childSpan = rootSpan.spans[0];
        expect(childSpan.name).toBe('setTimeout custom span');
        expect(childSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
        expect(childSpan.duration).toBeLessThanOrEqual(
          SET_TIMEOUT_TIME + TIME_BUFFER
        );
        expect(rootSpan.duration).toBeGreaterThanOrEqual(SET_TIMEOUT_TIME);
        expect(rootSpan.duration).toBeLessThanOrEqual(
          SET_TIMEOUT_TIME + TIME_BUFFER
        );
        done();
      });
    });
  });

  describe('HTTP requests', () => {
    // Value to be full when the XMLHttpRequest.send method is faked,
    // That way the perfornamce resource entries have a accurate timing.
    let perfResourceEntries: PerformanceResourceTiming[];
    beforeEach(() => {
      perfResourceEntries = [];
    });

    it('should handle HTTP requets and do not set Trace Context Header', done => {
      // Set a diferent ocTraceHeaderHostRegex to test that the trace context header is not
      // sent as the url request does not match the regex.
      windowWithOcwGlobals.ocTraceHeaderHostRegex = /"http:\/\/test-host".*/;
      const setRequestHeaderSpy = spyOn(
        XMLHttpRequest.prototype,
        'setRequestHeader'
      ).and.callThrough();
      const requestUrl = 'http://localhost:8000/test';
      const onclick = () => {
        doHttpRequest(requestUrl);
      };
      fakeInteraction(onclick);

      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('test interaction');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
        expect(rootSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);

        expect(rootSpan.spans.length).toBe(1);
        const childSpan = rootSpan.spans[0];
        // Check the `traceparent` header is not set as Trace Header Host does not match.
        expect(setRequestHeaderSpy).not.toHaveBeenCalled();
        expect(childSpan.name).toBe('/test');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_STATUS_CODE]).toBe('200');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_METHOD]).toBe('GET');
        expect(childSpan.ended).toBeTruthy();
        const expectedAnnotations = [
          {
            description: 'fetchStart',
            timestamp: perfResourceEntries[0].fetchStart,
            attributes: {},
          },
          {
            description: 'responseEnd',
            timestamp: perfResourceEntries[0].responseEnd,
            attributes: {},
          },
        ];
        expect(childSpan.annotations).toEqual(expectedAnnotations);
        // Check the CORS span is not created as this XHR does not send CORS
        // pre-flight request.
        expect(childSpan.spans.length).toBe(0);
        expect(childSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
        expect(childSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);
        done();
      });
    });

    it('should handle HTTP requets and set Trace Context Header', done => {
      // Set the ocTraceHeaderHostRegex value so the `traceparent` context header is set.
      windowWithOcwGlobals.ocTraceHeaderHostRegex = /.*/;
      const setRequestHeaderSpy = spyOn(
        XMLHttpRequest.prototype,
        'setRequestHeader'
      ).and.callThrough();
      const requestUrl = 'http://localhost:8000/test';
      const onclick = () => {
        doHttpRequest(requestUrl, true);
      };
      fakeInteraction(onclick);

      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('test interaction');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
        expect(rootSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);

        expect(rootSpan.spans.length).toBe(1);
        const childSpan = rootSpan.spans[0];
        expect(setRequestHeaderSpy).toHaveBeenCalledWith(
          'traceparent',
          spanContextToTraceParent({
            traceId: rootSpan.traceId,
            spanId: childSpan.id,
            options: 1, // Sampled trace
          })
        );
        expect(childSpan.name).toBe('/test');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_STATUS_CODE]).toBe('200');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_METHOD]).toBe('GET');
        expect(childSpan.ended).toBeTruthy();
        const mainRequestPerfTiming = perfResourceEntries[1];
        const expectedChildSpanAnnotations = [
          {
            description: 'fetchStart',
            timestamp: mainRequestPerfTiming.fetchStart,
            attributes: {},
          },
          {
            description: 'responseEnd',
            timestamp: mainRequestPerfTiming.responseEnd,
            attributes: {},
          },
        ];
        expect(childSpan.annotations).toEqual(expectedChildSpanAnnotations);
        // Check the CORS span is created with the correct annotations.
        const corsPerfTiming = perfResourceEntries[0];
        const expectedCorsSpanAnnotations = [
          {
            description: 'fetchStart',
            timestamp: corsPerfTiming.fetchStart,
            attributes: {},
          },
          {
            description: 'responseEnd',
            timestamp: corsPerfTiming.responseEnd,
            attributes: {},
          },
        ];
        expect(childSpan.spans.length).toBe(1);
        const corsSpan = childSpan.spans[0];
        expect(corsSpan.name).toBe('CORS Preflight');
        expect(corsSpan.annotations).toEqual(expectedCorsSpanAnnotations);
        expect(childSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
        expect(childSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);
        done();
      });
    });

    it('should handle cascading tasks', done => {
      const setRequestHeaderSpy = spyOn(
        XMLHttpRequest.prototype,
        'setRequestHeader'
      ).and.callThrough();
      const requestUrl = '/test';
      const onclick = () => {
        const promise = getPromise();
        promise.then(() => {
          setTimeout(() => {
            doHttpRequest(requestUrl, true);
          }, SET_TIMEOUT_TIME);
        });
      };
      fakeInteraction(onclick);

      const interactionTime = SET_TIMEOUT_TIME + XHR_TIME;
      onEndSpanSpy.and.callFake((rootSpan: Span) => {
        expect(rootSpan.name).toBe('test interaction');
        expect(rootSpan.attributes['EventType']).toBe('click');
        expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
        expect(rootSpan.ended).toBeTruthy();
        expect(rootSpan.duration).toBeGreaterThanOrEqual(interactionTime);
        expect(rootSpan.duration).toBeLessThanOrEqual(
          interactionTime + TIME_BUFFER
        );

        expect(rootSpan.spans.length).toBe(1);
        const childSpan = rootSpan.spans[0];
        expect(setRequestHeaderSpy).toHaveBeenCalledWith(
          'traceparent',
          spanContextToTraceParent({
            traceId: rootSpan.traceId,
            spanId: childSpan.id,
            options: 1, // Sampled trace
          })
        );
        expect(childSpan.name).toBe('/test');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_STATUS_CODE]).toBe('200');
        expect(childSpan.attributes[ATTRIBUTE_HTTP_METHOD]).toBe('GET');
        expect(childSpan.ended).toBeTruthy();
        const mainRequestPerfTiming = perfResourceEntries[1];
        const expectedChildSpanAnnotations = [
          {
            description: 'fetchStart',
            timestamp: mainRequestPerfTiming.fetchStart,
            attributes: {},
          },
          {
            description: 'responseEnd',
            timestamp: mainRequestPerfTiming.responseEnd,
            attributes: {},
          },
        ];
        expect(childSpan.annotations).toEqual(expectedChildSpanAnnotations);
        // Check the CORS span is created with the correct annotations.
        const corsPerfTiming = perfResourceEntries[0];
        const expectedCorsSpanAnnotations = [
          {
            description: 'fetchStart',
            timestamp: corsPerfTiming.fetchStart,
            attributes: {},
          },
          {
            description: 'responseEnd',
            timestamp: corsPerfTiming.responseEnd,
            attributes: {},
          },
        ];
        expect(childSpan.spans.length).toBe(1);
        const corsSpan = childSpan.spans[0];
        expect(corsSpan.name).toBe('CORS Preflight');
        expect(corsSpan.annotations).toEqual(expectedCorsSpanAnnotations);
        expect(childSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
        expect(childSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);
        done();
      });
    });

    function doHttpRequest(urlRequest = '/test', xhrHasCorsData = false) {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = noop;
      spyOn(xhr, 'send').and.callFake(() => {
        setXhrAttributeHasCalledSend(xhr);
        setTimeout(() => {
          spyOnProperty(xhr, 'status').and.returnValue(200);
          // Fake the readyState as DONE so the xhr interceptor knows when the
          // XHR finished.
          spyOnProperty(xhr, 'readyState').and.returnValue(XMLHttpRequest.DONE);
          const event = new Event('readystatechange');
          xhr.dispatchEvent(event);
        }, XHR_TIME);
        // Create the performance entries at this point in order to have a
        // similar timing as span.
        createFakePerformanceEntries(urlRequest, xhrHasCorsData);
        spyPerfEntryByType(perfResourceEntries);
        spyOnProperty(xhr, 'responseURL').and.returnValue(urlRequest);
      });

      xhr.open('GET', urlRequest);
      xhr.send();
    }

    function createFakePerformanceEntries(
      urlRequest: string,
      xhrHasCorsData: boolean
    ) {
      const xhrPerfStart = performance.now();
      let actualRequestStartTime = xhrPerfStart;
      if (xhrHasCorsData) {
        const corsEntry = createFakePerfResourceEntry(
          xhrPerfStart,
          xhrPerfStart + 1,
          urlRequest
        );
        // Start the other request a bit after the CORS finished.
        actualRequestStartTime = xhrPerfStart + 1;
        perfResourceEntries.push(corsEntry);
      }
      const actualRequestEntry = createFakePerfResourceEntry(
        actualRequestStartTime + 1,
        actualRequestStartTime + XHR_TIME - 2,
        urlRequest
      );
      perfResourceEntries.push(actualRequestEntry);
    }
  });

  function fakeInteraction(callback: Function, elem?: HTMLElement) {
    let element: HTMLElement;
    if (elem) element = elem;
    else element = createButton('test interaction');
    element.onclick = () => callback();
    element.click();
  }

  function createButton(dataOcwebId: string, disabled?: boolean): HTMLElement {
    const button = document.createElement('button');
    button.setAttribute('data-ocweb-id', dataOcwebId);
    button.setAttribute('id', 'test_element');
    if (disabled) {
      button.setAttribute('disabled', 'disabled');
    }
    return button;
  }

  const noop = () => {};

  function getPromise() {
    return new Promise(resolve => {
      resolve();
    });
  }
});
