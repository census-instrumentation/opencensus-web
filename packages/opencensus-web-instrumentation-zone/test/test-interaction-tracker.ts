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
import { tracing, Span } from '@opencensus/web-core';
import {
  InteractionTracker,
  RESET_TRACING_ZONE_DELAY,
} from '../src/interaction-tracker';

describe('InteractionTracker', () => {
  InteractionTracker.startTracking();
  let onEndSpanSpy: jasmine.Spy;

  // Use Buffer time as we expect that these interactions take
  // a little extra time to complete due to the setTimeout that
  // is needed for the final completion and runs in a different
  // tick.
  const TIME_BUFFER = 10;
  const XHR_TIME = 60;
  const SET_TIMEOUT_TIME = 60;
  const BUTTON_TAG_NAME = 'BUTTON';

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
      expect(rootSpan.name).toBe("<BUTTON> id:'test_element' click");
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

  it('should handle HTTP requets', done => {
    const onclick = () => {
      doHTTPRequest();
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.attributes['EventType']).toBe('click');
      expect(rootSpan.attributes['TargetElement']).toBe(BUTTON_TAG_NAME);
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(XHR_TIME);
      expect(rootSpan.duration).toBeLessThanOrEqual(XHR_TIME + TIME_BUFFER);
      done();
    });
  });

  it('should handle cascading tasks', done => {
    const onclick = () => {
      const promise = getPromise();
      promise.then(() => {
        setTimeout(() => {
          doHTTPRequest();
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
      done();
    });
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

  function doHTTPRequest() {
    const xhr = new XMLHttpRequest();
    spyOn(xhr, 'send').and.callFake(() => {
      setTimeout(noop, XHR_TIME);
    });
    xhr.open('GET', '/sleep');
    xhr.send();
  }
});
