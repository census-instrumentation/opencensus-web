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

/** Enables setting arbitrary properties on an object. */
interface IndexableObject {
  [key: string]: unknown;
}

/**
 * This mocks an object value that can either be a getter property, or just a
 * regular object value. The reason this is needed it because certain browser
 * APIs (such as `performance.timeOrigin`) may be modeled as a getter in some
 * browsers but not in others.
 *
 * If the property is a getter, this will use Jasmine's `spyOnProperty`, and for
 * normal values it just sets the object property directly to the mock value.
 *
 * @param object The object whose property to set with a mock value
 * @param property Name of the property to set
 * @mockValue Value to set. Should keep the real value first to restory it with
 *    `restoreGetterOrValue` below.
 */
export function mockGetterOrValue<T>(
  object: T,
  property: keyof T,
  mockValue: unknown
) {
  if (isGetter(object, property)) {
    spyOnProperty(object, property).and.returnValue(mockValue);
  } else {
    // Allow forcing mock values that violate the type signature. This allows
    // mocking `undefined` for browser APIs that are not available in all
    // browsers.
    (object as IndexableObject)[property as string] = mockValue;
  }
}

/**
 * Restores an object's previously mocked property (getter or normal value)
 * to a real value that was saved before the mocking was done.
 * This is a no-op for getter properties since Jasmine's `spyOnProperty` is
 * restored automatically. For normal values, this just sets the value.
 */
export function restoreGetterOrValue<T, K extends keyof T>(
  object: T,
  property: K,
  value: T[K]
) {
  if (isGetter(object, property)) return;
  object[property] = value;
}

function isGetter<T>(object: T, property: keyof T) {
  const prototype = Object.getPrototypeOf(object);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
  return descriptor && descriptor.hasOwnProperty('get');
}
