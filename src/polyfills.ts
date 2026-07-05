// Polyfills required by youtubei.js when running under React Native / Hermes.
// This module must be imported before youtubei.js is first loaded.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'event-target-polyfill';
import 'text-encoding-polyfill';
import { ReadableStream } from 'web-streams-polyfill';
import { decode, encode } from 'base-64';

const g = globalThis as unknown as {
  btoa?: (input: string) => string;
  atob?: (input: string) => string;
  ReadableStream?: unknown;
};

if (typeof g.btoa === 'undefined') g.btoa = encode;
if (typeof g.atob === 'undefined') g.atob = decode;
if (typeof g.ReadableStream === 'undefined') g.ReadableStream = ReadableStream;
