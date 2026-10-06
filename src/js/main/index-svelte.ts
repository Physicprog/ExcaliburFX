import App from "./main.svelte";
import { initBolt } from "../lib/utils/bolt";
import { mount } from "svelte";
import "./main.scss";

function ensureCepNodeGlobal() {
  if (typeof window === "undefined") return;

  const cepNode = (window as any).cep_node;
  if (!cepNode || typeof cepNode !== "object") return;

  const existingGlobal = cepNode.global;
  const globalTarget = existingGlobal && typeof existingGlobal === "object" ? existingGlobal : {};

  if (!cepNode.global || typeof cepNode.global !== "object") {
    Object.defineProperty(cepNode, "global", {
      value: globalTarget,
      configurable: true,
      writable: true,
    });
  }

  if (!cepNode.global.__dirname) {
    cepNode.global.__dirname = "";
  }

  if (!cepNode.global.__filename) {
    cepNode.global.__filename = "";
  }

  try {
    if (typeof window.cep !== "undefined" && typeof window.cep.getSystemPath === "function") {
      const extensionRoot = window.cep.getSystemPath("extension");
      if (typeof extensionRoot === "string" && extensionRoot.length > 0) {
        globalTarget.__dirname ??= extensionRoot;
        globalTarget.__filename ??= `${extensionRoot}/main/index.js`;
      }
    }
  } catch (error) {
  }

  if (typeof globalThis !== "undefined") {
    globalThis.__dirname ??= globalTarget.__dirname ?? "";
    globalThis.__filename ??= globalTarget.__filename ?? "";
  }
}

ensureCepNodeGlobal();
initBolt();

mount(App, {
  target: document.getElementById("app")!,
});