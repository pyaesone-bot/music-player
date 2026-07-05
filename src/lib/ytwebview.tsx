import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { BGUTILS_SOURCE } from './bgutilsSource';

/**
 * A single hidden WebView that gives the on-device YouTube client a real
 * browser JavaScript engine. It is used for two things that can't be done in
 * Hermes:
 *
 *  1. **Proof-of-Origin Token (PoToken)** — YouTube's BotGuard challenge
 *     (run via the open-source `bgutils-js`) needs a DOM + real crypto, and its
 *     network calls must originate from a `youtube.com` origin (set via
 *     `baseUrl`) to satisfy CORS.
 *  2. **Signature deciphering** — youtubei.js v17 requires the caller to supply
 *     a JavaScript evaluator. Running YouTube's player script in the WebView's
 *     native engine is far more robust than a partial JS interpreter.
 *
 * Requests are correlated with the WebView by an incrementing id and resolved
 * when the page posts a matching message back.
 */

const YT_ORIGIN = 'https://www.youtube.com';
// Standard request key used by YouTube's web client for BotGuard.
const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, Pending>();
let injectJS: ((js: string) => void) | null = null;
let counter = 0;

let markReady: () => void = () => {};
let readyPromise: Promise<void> = new Promise<void>((resolve) => {
  markReady = resolve;
});

function nextId(): string {
  counter += 1;
  return String(counter);
}

function call(kind: 'potoken' | 'eval', arg: string, timeoutMs: number): Promise<unknown> {
  return readyPromise.then(
    () =>
      new Promise<unknown>((resolve, reject) => {
        if (!injectJS) {
          reject(new Error('YouTube helper WebView is not available'));
          return;
        }
        const id = nextId();
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`WebView ${kind} request timed out`));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        injectJS(`window.__yt_${kind}(${JSON.stringify(id)}, ${JSON.stringify(arg)}); true;`);
      }),
  );
}

/**
 * Mints a WebPO (Proof-of-Origin) token bound to `identifier`. Pass the session
 * `visitorData` for the session-bound token and a video id for the per-request
 * content-bound token. The underlying BotGuard minter is created once in the
 * WebView and reused across calls.
 */
export async function generatePoToken(identifier: string): Promise<string> {
  const token = await call('potoken', identifier, 30000);
  if (typeof token !== 'string' || !token) throw new Error('Empty PoToken');
  return token;
}

/**
 * Evaluates a youtubei.js player script (an IIFE-style body ending in a
 * `return`) and resolves with its result object (e.g. `{ sig, n }`).
 */
export function evalPlayerScript(output: string): Promise<unknown> {
  return call('eval', output, 20000);
}

const BOOT_SCRIPT = `
${BGUTILS_SOURCE}
window.BGUtils = BGUtils;
(function(){
  function post(id, ok, payload){
    window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, ok: ok, payload: payload }));
  }
  window.__yt_eval = function(id, output){
    try {
      var fn = new Function(output);
      var result = fn();
      post(id, true, result);
    } catch (e){
      post(id, false, String((e && e.message) || e));
    }
  };
  var minterPromise = null;
  async function buildMinter(){
    var U = window.BGUtils;
    var BG = U.BG;
    var bgConfig = {
      fetch: function(input, init){ return fetch(input, init); },
      globalObj: window,
      identifier: '',
      requestKey: ${JSON.stringify(REQUEST_KEY)}
    };
    var challenge = await BG.Challenge.create(bgConfig);
    if (!challenge) throw new Error('Could not create BotGuard challenge');
    var js = challenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (js) { new Function(js)(); } else { throw new Error('Could not load BotGuard VM'); }
    var botguard = await BG.BotGuardClient.create({
      program: challenge.program,
      globalName: challenge.globalName,
      globalObj: window
    });
    var webPoSignalOutput = [];
    var botguardResponse = await botguard.snapshot({ webPoSignalOutput: webPoSignalOutput });
    var itResponse = await fetch(U.buildURL('GenerateIT', false), {
      method: 'POST',
      headers: U.getHeaders(),
      body: JSON.stringify([bgConfig.requestKey, botguardResponse])
    });
    var itJson = await itResponse.json();
    var integrityTokenData = {
      integrityToken: itJson[0],
      estimatedTtlSecs: itJson[1],
      mintRefreshThreshold: itJson[2],
      websafeFallbackToken: itJson[3]
    };
    return await BG.WebPoMinter.create(integrityTokenData, webPoSignalOutput);
  }
  window.__yt_potoken = function(id, identifier){
    (async function(){
      try {
        if (!minterPromise) minterPromise = buildMinter();
        var minter;
        try {
          minter = await minterPromise;
        } catch (e){
          minterPromise = null; // allow rebuild on next call
          throw e;
        }
        var token = await minter.mintAsWebsafeString(identifier);
        post(id, true, token);
      } catch (e){
        post(id, false, String((e && e.message) || e));
      }
    })();
  };
})();
true;
`;

const READY_SCRIPT = `window.ReactNativeWebView.postMessage(JSON.stringify({ ready: true })); true;`;

const HTML = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>';

/**
 * Invisible helper WebView. Mount exactly once, near the app root, so that
 * PoToken generation and signature deciphering are available on-device.
 */
export function YtHelperWebView() {
  const ref = useRef<WebView>(null);

  useEffect(() => {
    injectJS = (js: string) => ref.current?.injectJavaScript(js);
    return () => {
      injectJS = null;
    };
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { id?: string; ok?: boolean; payload?: unknown; ready?: boolean };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.ready) {
      markReady();
      return;
    }
    if (!msg.id) return;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    clearTimeout(entry.timer);
    if (msg.ok) entry.resolve(msg.payload);
    else entry.reject(new Error(typeof msg.payload === 'string' ? msg.payload : 'WebView error'));
  };

  return (
    <View style={{ width: 0, height: 0, position: 'absolute', overflow: 'hidden' }} pointerEvents="none">
      <WebView
        ref={ref}
        source={{ html: HTML, baseUrl: YT_ORIGIN }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        mixedContentMode="always"
        injectedJavaScriptBeforeContentLoaded={BOOT_SCRIPT}
        injectedJavaScript={READY_SCRIPT}
        onMessage={onMessage}
      />
    </View>
  );
}
