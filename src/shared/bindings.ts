import { browser, Tabs } from "webextension-polyfill-ts";

export interface MethodDescriptor<TImpl> {
  methodName: keyof TImpl;
  args?: any[];
}

export function emit<T>(implementation: T): void {
  // Listen to messages sent from other parts of the extension.
  browser.runtime.onMessage.addListener(
    (request: MethodDescriptor<T>, sender) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      const method = implementation[request.methodName];
      const result = (method as any).apply(implementation, request.args);
      if (result instanceof Promise) {
        return result as Promise<any>;
      } else {
        return Promise.resolve(result);
      }
    }
  );
}

export function bindToTabSendMessage<T>(tab: Tabs.Tab): T {
  async function callBackground<TImpl>(method: MethodDescriptor<TImpl>) {
    return browser.tabs.sendMessage(tab.id, method);
  }

  function getImpl(methodName: string) {
    return function proxyImpl() {
      return callBackground({ methodName, args: Array.from(arguments) });
    };
  }

  const obj: T = new Proxy({} as any, {
    get(target: T, p: PropertyKey) {
      if (!(p in target) && typeof p === "string") {
        console.info(`generating proxy for ${p}`);
        target[p] = p === "then" ? Promise.resolve(target) : getImpl(p);
      }

      return target[p];
    },
  });
  return obj;
}
