// Abstracted built-in Node.js Modules safely pulling from window.cep_node
const getReq = (name: string) => {
  if (typeof window !== "undefined" && window.cep_node && typeof window.cep_node.require === "function") {
    try {
      return window.cep_node.require(name);
    } catch (error) {
      console.warn(`CEP Node module unavailable: ${name}`, error);
    }
  }
  if (typeof require === "function") {
    try {
      return require(name);
    } catch (error) {
      console.warn(`require(${name}) failed:`, error);
    }
  }
  return {};
};

const getSafeOs = () => {
  const runtimeOs = getReq("os") as Partial<typeof import("os")> | undefined;
  if (runtimeOs && typeof runtimeOs.homedir === "function") {
    return runtimeOs as typeof import("os");
  }

  const envHome =
    typeof process !== "undefined" && process.env
      ? process.env.HOME || process.env.USERPROFILE || ""
      : "";

  return {
    homedir: () => envHome || "",
    tmpdir: () =>
      typeof process !== "undefined" && process.env && process.env.TEMP
        ? process.env.TEMP
        : "",
    platform: () =>
      typeof process !== "undefined" && process.platform
        ? process.platform
        : "win32",
  } as typeof import("os");
};

const getSafePath = () => {
  const runtimePath = getReq("path") as Partial<typeof import("path")> | undefined;
  if (runtimePath && typeof runtimePath.join === "function") {
    return runtimePath as typeof import("path");
  }

  const safeJoin = (...parts: Array<string | undefined | null>) =>
    parts.filter(Boolean).join("/").replace(/\\+/g, "/");

  return {
    join: safeJoin,
    dirname: (value: string) => value.replace(/[\\/][^\\/]*$/, "") || ".",
    basename: (value: string, ext?: string) => {
      const base = value.split(/[\\/]/).pop() || "";
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    },
    extname: (value: string) => {
      const match = value.match(/\.[^./\\]+$/);
      return match ? match[0] : "";
    },
    resolve: (...parts: Array<string | undefined | null>) =>
      parts.filter(Boolean).join("/").replace(/\\+/g, "/"),
    sep: "/",
  } as typeof import("path");
};

export const crypto = getReq("crypto") as typeof import("crypto");
export const assert = getReq("assert") as typeof import("assert");
export const buffer = getReq("buffer") as typeof import("buffer");
export const child_process = getReq("child_process") as typeof import("child_process");
export const cluster = getReq("cluster") as typeof import("cluster");
export const dgram = getReq("dgram") as typeof import("dgram");
export const dns = getReq("dns") as typeof import("dns");
export const domain = getReq("domain") as typeof import("domain");
export const events = getReq("events") as typeof import("events");
export const fs = getReq("fs") as typeof import("fs");
export const http = getReq("http") as typeof import("http");
export const https = getReq("https") as typeof import("https");
export const net = getReq("net") as typeof import("net");
export const os = getSafeOs();
export const path = getSafePath();
export const punycode = getReq("punycode") as typeof import("punycode");
export const querystring = getReq("querystring") as typeof import("querystring");
export const readline = getReq("readline") as typeof import("readline");
export const stream = getReq("stream") as typeof import("stream");
export const string_decoder = getReq("string_decoder") as typeof import("string_decoder");
export const timers = getReq("timers") as typeof import("timers");
export const tls = getReq("tls") as typeof import("tls");
export const tty = getReq("tty") as typeof import("tty");
export const url = getReq("url") as typeof import("url");
export const util = getReq("util") as typeof import("util");
export const v8 = getReq("v8") as typeof import("v8");
export const vm = getReq("vm") as typeof import("vm");
export const zlib = getReq("zlib") as typeof import("zlib");