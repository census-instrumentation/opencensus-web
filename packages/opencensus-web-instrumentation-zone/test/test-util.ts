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

import { resolveInteractionName } from '../src/util';

describe('Test util', () => {
  describe('resolveInteractionName', () => {
    it('Should return undefined if element is null', () => {
      expect(resolveInteractionName(null, '')).toBeUndefined();
    });

    it('Should return undefined if element is disabled', () => {
      const button = createButton();
      button.setAttribute('disabled', 'disabled');
      expect(resolveInteractionName(button, '')).toBeUndefined();
    });

    it('Should return name given in data-ocweb-id and marked as not replaceable', () => {
      const button = createButton();
      button.setAttribute('data-ocweb-id', 'Test button');
      expect(resolveInteractionName(button, '')).toEqual({
        name: 'Test button',
        isReplaceable: false,
      });
    });

    it('Should return name as a CSS selector without event name and marked as replaceable', () => {
      const button = createButton();
      button.setAttribute('id', 'test');
      expect(resolveInteractionName(button, '')).toEqual({
        name: 'button#test',
        isReplaceable: true,
      });
    });

    it('Should return name as a CSS selector with event name and marked as replaceable', () => {
      const button = createButton();
      button.setAttribute('id', 'test');
      expect(resolveInteractionName(button, 'click')).toEqual({
        name: 'button#test click',
        isReplaceable: true,
      });
    });

    function createButton() {
      return document.createElement('button');
    }
  });
});
