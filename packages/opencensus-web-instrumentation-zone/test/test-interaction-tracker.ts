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
  const interactionTracker = InteractionTracker.instance;
  let incrementTaskCountSpy: jasmine.Spy;
  let decrementTaskCountSpy: jasmine.Spy;
  let onEndSpanSpy: jasmine.Spy;

  beforeEach(() => {
    interactionTracker.resetCurrentTracingZone();
    incrementTaskCountSpy = spyOn(
      interactionTracker,
      'incrementTaskCount'
    ).and.callThrough();
    decrementTaskCountSpy = spyOn(
      interactionTracker,
      'decrementTaskCount'
    ).and.callThrough();
    onEndSpanSpy = spyOn(tracing.exporter, 'onEndSpan');
  });

  it('should handle interactions with no async work', done => {
    fakeInteraction(noop);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      // Counts related to the click event.
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(1);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      // As there is another setTimeOut that completes the interaction, the
      // span duraction is not precise, then only test if the interaction duration
      // finishes within a range.
      expect(rootSpan.duration).toBeLessThan(5);
      done();
    });
  });

  it('should handle interactions with macroTask', done => {
    const onclick = () => {
      // Counts the click is detected.
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      // As the task related to the click event hasn't finished
      // the task count is not decremented yet.
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      setTimeout(() => {
        // The setTimeout (MacroTask) should be counted.
        expect(incrementTaskCountSpy.calls.count()).toBe(2);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
      }, 60);
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      // There should be 2 counted tasks in total.
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(2);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(60);
      expect(rootSpan.duration).toBeLessThanOrEqual(80);
      done();
    });
  });

  it('should handle interactions with microTask', done => {
    const onclick = () => {
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      const promise = getPromise();
      promise.then(() => {
        expect(incrementTaskCountSpy.calls.count()).toBe(2);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
      });
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(2);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(5);
      done();
    });
  });

  it('should handle interactions with canceled tasks', done => {
    const canceledTask = () => {
      const timeoutId = setTimeout(noop, 10);
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      setTimeout(() => {
        expect(incrementTaskCountSpy.calls.count()).toBe(3);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
        // Cancel task before it finishes
        clearTimeout(timeoutId);
        expect(decrementTaskCountSpy.calls.count()).toBe(2);
      }, 6);
    };
    fakeInteraction(canceledTask);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(3);
      expect(decrementTaskCountSpy.calls.count()).toBe(3);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(12);
      done();
    });
  });

  it('should ignore interactions on elements with disable', done => {
    const onclick = () => {
      // No change in task count as the click is not tracked.
      expect(incrementTaskCountSpy.calls.count()).toBe(0);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);

      setTimeout(() => {
        // No change in task count as the click is not tracked.
        expect(incrementTaskCountSpy.calls.count()).toBe(0);
        expect(decrementTaskCountSpy.calls.count()).toBe(0);
      });
    };
    const button = createButton('test interaction', true);
    fakeInteraction(onclick, button);

    const onclick2 = () => {
      // Click is detected as this button does is not 'disabled'.
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      setTimeout(() => {
        expect(incrementTaskCountSpy.calls.count()).toBe(2);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
      });
    };

    button.removeAttribute('disabled');
    fakeInteraction(onclick2, button);
    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      // There should be only 2 counted tasks related to the second interaction.
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(2);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(8);
      done();
    });
  });

  it('should handle interactions on elements without data-ocweb-id attribute', done => {
    const onclick = () => {
      setTimeout(noop, 1);
    };
    const button = createButton('');
    fakeInteraction(onclick, button);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(rootSpan.name).toBe("<BUTTON> id:'test_element' click");
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(5);
      done();
    });
  });

  it('should ignore periodic tasks', done => {
    const onclick = () => {
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      const interaval = setInterval(() => {
        // The counted tasks does not change as this is ignored.
        expect(incrementTaskCountSpy.calls.count()).toBe(1);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
        clearInterval(interaval);
      }, 1);
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(1);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(10);
      done();
    });
  });

  it('should not create a new interaction when second click occurs before 50 ms.', done => {
    let curretEventTracingZoneSpy = interactionTracker.currentEventTracingZone;
    const onclickInteraction1 = () => {
      curretEventTracingZoneSpy = interactionTracker.currentEventTracingZone;
      expect(curretEventTracingZoneSpy).not.toBeUndefined();
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      setTimeout(noop, RESET_TRACING_ZONE_DELAY + 10);
    };
    fakeInteraction(onclickInteraction1);

    const onclickInteraction2 = () => {
      // Expect the currentEventTracingZone has not changed after the second click.
      expect(curretEventTracingZoneSpy).toBe(
        interactionTracker.currentEventTracingZone
      );
      expect(incrementTaskCountSpy.calls.count()).toBe(3);
      expect(decrementTaskCountSpy.calls.count()).toBe(1);
      setTimeout(noop);
    };
    // Schedule a second interactionto be run  before `RESET_TRACING_ZONE_DELAY`
    setTimeout(() => {
      fakeInteraction(onclickInteraction2);
    }, RESET_TRACING_ZONE_DELAY - 10);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(4);
      expect(decrementTaskCountSpy.calls.count()).toBe(4);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(curretEventTracingZoneSpy).not.toBeUndefined();
      if (curretEventTracingZoneSpy) {
        expect(curretEventTracingZoneSpy.name).toBe(rootSpan.traceId);
      }
      expect(rootSpan.duration).toBeGreaterThanOrEqual(60);
      expect(rootSpan.duration).toBeLessThanOrEqual(80);
      done();
    });
  });

  it('should create a new interaction and track overlaping interactions.', done => {
    let curretEventTracingZoneSpy = interactionTracker.currentEventTracingZone;
    const onclickInteraction1 = () => {
      curretEventTracingZoneSpy = interactionTracker.currentEventTracingZone;
      expect(curretEventTracingZoneSpy).not.toBeUndefined();
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      setTimeout(noop, RESET_TRACING_ZONE_DELAY + 10);
    };
    fakeInteraction(onclickInteraction1);

    const onclickInteraction2 = () => {
      // Expect the currentEventTracingZone has changed after the second click.
      expect(curretEventTracingZoneSpy).not.toBe(
        interactionTracker.currentEventTracingZone
      );
      setTimeout(noop, RESET_TRACING_ZONE_DELAY);
    };
    // Schedule a second interaction starting after `RESET_TRACING_ZONE_DELAY` ms
    setTimeout(() => {
      fakeInteraction(onclickInteraction2);
    }, RESET_TRACING_ZONE_DELAY + 1);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(4);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      // Test related to the first interaction
      if (onEndSpanSpy.calls.count() === 1) {
        expect(decrementTaskCountSpy.calls.count()).toBe(3);
        if (curretEventTracingZoneSpy) {
          expect(curretEventTracingZoneSpy.name).toBe(rootSpan.traceId);
        }
        expect(rootSpan.duration).toBeGreaterThanOrEqual(
          RESET_TRACING_ZONE_DELAY + 10
        );
        expect(rootSpan.duration).toBeLessThanOrEqual(
          RESET_TRACING_ZONE_DELAY + 30
        );
      } else {
        // Test related to the second interaction
        expect(decrementTaskCountSpy.calls.count()).toBe(4);
        if (curretEventTracingZoneSpy) {
          expect(curretEventTracingZoneSpy.name).not.toBe(rootSpan.traceId);
        }
        expect(rootSpan.duration).toBeGreaterThanOrEqual(
          RESET_TRACING_ZONE_DELAY
        );
        expect(rootSpan.duration).toBeLessThanOrEqual(
          RESET_TRACING_ZONE_DELAY + 20
        );
        done();
      }
    });
  });

  it('should handle route transition interaction and rename the interaction as Navigation', done => {
    const onclick = () => {
      setTimeout(() => {
        history.pushState({ test: 'testing' }, 'page 2', '/test_navigation');
      }, 1);
    };
    // Create a button without 'data-ocweb-id' attribute.
    const button = createButton('');
    fakeInteraction(onclick, button);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(2);
      expect(rootSpan.name).toBe('Navigation /test_navigation');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeLessThanOrEqual(10);
      done();
    });
  });

  it('should handle HTTP requets', done => {
    const onclick = () => {
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      doHTTPRequest();
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(2);
      expect(decrementTaskCountSpy.calls.count()).toBe(2);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      expect(rootSpan.duration).toBeGreaterThanOrEqual(60);
      expect(rootSpan.duration).toBeLessThanOrEqual(80);
      done();
    });
  });

  it('should handle cascading tasks', done => {
    const onclick = () => {
      expect(incrementTaskCountSpy.calls.count()).toBe(1);
      expect(decrementTaskCountSpy.calls.count()).toBe(0);
      const promise = getPromise();
      promise.then(() => {
        expect(incrementTaskCountSpy.calls.count()).toBe(2);
        expect(decrementTaskCountSpy.calls.count()).toBe(1);
        setTimeout(() => {
          expect(incrementTaskCountSpy.calls.count()).toBe(3);
          expect(decrementTaskCountSpy.calls.count()).toBe(2);
          doHTTPRequest();
        }, 1);
      });
    };
    fakeInteraction(onclick);

    onEndSpanSpy.and.callFake((rootSpan: Span) => {
      expect(incrementTaskCountSpy.calls.count()).toBe(4);
      expect(decrementTaskCountSpy.calls.count()).toBe(4);
      expect(rootSpan.name).toBe('test interaction');
      expect(rootSpan.ended).toBeTruthy();
      // The HTTP request takes 60 ms to send it
      expect(rootSpan.duration).toBeGreaterThanOrEqual(60);
      expect(rootSpan.duration).toBeLessThanOrEqual(80);
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
      setTimeout(noop, 60);
    });
    xhr.open('GET', '/sleep');
    xhr.send();
  }
});
