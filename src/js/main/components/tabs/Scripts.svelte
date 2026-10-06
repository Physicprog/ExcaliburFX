<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { evalTS } from "../../../lib/utils/bolt";
  import { TRANSITION_MS, scriptFavoriteExpressions } from "../../stores.js";
  import { t } from "../../../i18n.js";
  import { sendNotif } from "../../logic.js";
  import { getPreference, setPreference } from "../../../lib/utils/main.js";
  import Add from "../../../assets/ui/Add.png";

  const expressionLibrary: any = {
    textanimator: [
      {
        name: "Bounce Vertical",
        description: "Characters bounce up/down with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var stagger = 0.03; var offset = stagger * textIndex; var elapsed = (time - inPoint) - offset; if (elapsed < 0) { 100; } else { var f = 2; var d = 6.0; var envelope = Math.exp(-d * elapsed); var oscillation = Math.cos(elapsed * f * 2 * Math.PI); 100 * envelope * oscillation; }",
        buildCode: function (params: any) {
          return (
            "var stagger = " +
            params.delay +
            "; var offset = stagger * textIndex; var elapsed = (time - inPoint) - offset; if (elapsed < 0) { 100; } else { var f = " +
            params.freq +
            "; var d = " +
            params.decay +
            "; var envelope = Math.exp(-d * elapsed); var oscillation = Math.cos(elapsed * f * 2 * Math.PI); 100 * envelope * oscillation; }"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Horizontal",
        description: "Characters bounce left/right with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "posX",
            label: "Position X",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var gap = 0.03; var wait = gap * textIndex; var t = (time - inPoint) - wait; if (t < 0) { 100; } else { var omega = 2 * 2 * Math.PI; var damping = 6.0; 100 * Math.cos(omega * t) * Math.exp(-damping * t); }",
        buildCode: function (params: any) {
          return (
            "var gap = " +
            params.delay +
            "; var wait = gap * textIndex; var t = (time - inPoint) - wait; if (t < 0) { 100; } else { var omega = " +
            params.freq +
            " * 2 * Math.PI; var damping = " +
            params.decay +
            "; 100 * Math.cos(omega * t) * Math.exp(-damping * t); }"
          );
        },
        animatorProps: [
          { type: "position", axis: "x", param: "posX", value: [-150, 0] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Rotation",
        description: "Characters rotate in with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "rotation",
            label: "Rotation",
            min: -90,
            max: 90,
            default: 70,
            step: 10,
          },
        ],
        code: "var step = 0.03; var charDelay = step * textIndex; var phase = (time - inPoint) - charDelay; if (phase < 0) { 100; } else { var w = 2; var k = 6.0; var decay = Math.pow(Math.E, -k * phase); var wave = Math.cos(phase * w * 2 * Math.PI); wave * decay * 100; }",
        buildCode: function (params: any) {
          return (
            "var step = " +
            params.delay +
            "; var charDelay = step * textIndex; var phase = (time - inPoint) - charDelay; if (phase < 0) { 100; } else { var w = " +
            params.freq +
            "; var k = " +
            params.decay +
            "; var decay = Math.pow(Math.E, -k * phase); var wave = Math.cos(phase * w * 2 * Math.PI); wave * decay * 100; }"
          );
        },
        animatorProps: [
          { type: "rotation", param: "rotation", value: 70 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Scale",
        description: "Characters scale in with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "scale",
            label: "Scale",
            min: -100,
            max: 100,
            default: -100,
            step: 10,
          },
        ],
        code: "var d = 0.03; var t = (time - inPoint) - d * textIndex; t >= 0 ? Math.cos(2 * t * 2 * Math.PI) / Math.exp(6.0 * t) * 100 : 100",
        buildCode: function (params: any) {
          return (
            "var d = " +
            params.delay +
            "; var t = (time - inPoint) - d * textIndex; t >= 0 ? Math.cos(" +
            params.freq +
            " * t * 2 * Math.PI) / Math.exp(" +
            params.decay +
            " * t) * 100 : 100"
          );
        },
        animatorProps: [
          { type: "scale", param: "scale", value: [-100, -100] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Tracking",
        description: "Letter spacing bounces in",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "tracking",
            label: "Tracking",
            min: -100,
            max: 100,
            default: 50,
            step: 10,
          },
        ],
        code: "var interval = 0.03; var onset = interval * textIndex; var age = (time - inPoint) - onset; if (age < 0) { 100; } else { var cyclesPerSec = 2; var falloff = 6.0; var angle = cyclesPerSec * age * 2 * Math.PI; 100 * Math.cos(angle) * Math.exp(-falloff * age); }",
        buildCode: function (params: any) {
          return (
            "var interval = " +
            params.delay +
            "; var onset = interval * textIndex; var age = (time - inPoint) - onset; if (age < 0) { 100; } else { var cyclesPerSec = " +
            params.freq +
            "; var falloff = " +
            params.decay +
            "; var angle = cyclesPerSec * age * 2 * Math.PI; 100 * Math.cos(angle) * Math.exp(-falloff * age); }"
          );
        },
        animatorProps: [
          { type: "tracking", param: "tracking", value: 50 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Skew",
        description: "Characters skew in with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "skew",
            label: "Skew",
            min: -45,
            max: 45,
            default: 30,
            step: 5,
          },
        ],
        code: "var spacing = 0.03; var tOffset = spacing * textIndex; var signal = (time - inPoint) - tOffset; if (signal < 0) { 100; } else { var hz = 2; var attenuation = 6.0; var result = Math.cos(hz * signal * 2 * Math.PI) * Math.exp(-attenuation * signal); result * 100; }",
        buildCode: function (params: any) {
          return (
            "var spacing = " +
            params.delay +
            "; var tOffset = spacing * textIndex; var signal = (time - inPoint) - tOffset; if (signal < 0) { 100; } else { var hz = " +
            params.freq +
            "; var attenuation = " +
            params.decay +
            "; var result = Math.cos(hz * signal * 2 * Math.PI) * Math.exp(-attenuation * signal); result * 100; }"
          );
        },
        animatorProps: [
          { type: "skew", param: "skew", value: 30 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Diagonal",
        description: "Characters bounce in diagonally",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "pos",
            label: "Position",
            min: -150,
            max: 150,
            default: -100,
            step: 10,
          },
        ],
        code: "var lag = 0.03; var charOffset = lag * textIndex; var dt = (time - inPoint) - charOffset; if (dt < 0) { 100; } else { var rate = 2; var damp = 6.0; var rad = dt * rate * 2 * Math.PI; var amp = 100 * Math.exp(-damp * dt); amp * Math.cos(rad); }",
        buildCode: function (params: any) {
          return (
            "var lag = " +
            params.delay +
            "; var charOffset = lag * textIndex; var dt = (time - inPoint) - charOffset; if (dt < 0) { 100; } else { var rate = " +
            params.freq +
            "; var damp = " +
            params.decay +
            "; var rad = dt * rate * 2 * Math.PI; var amp = 100 * Math.exp(-damp * dt); amp * Math.cos(rad); }"
          );
        },
        animatorProps: [
          { type: "position", param: "pos", value: [-100, -100] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Spin",
        description: "Characters drop and rotate in",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
        ],
        code: "var springDelay = 0.03; var trigger = springDelay * textIndex; var motion = (time - inPoint) - trigger; if (motion < 0) { 100; } else { var tension = 2 * 2 * Math.PI; var friction = 6.0; var displacement = Math.cos(tension * motion) / Math.exp(friction * motion); displacement * 100; }",
        buildCode: function (params: any) {
          return (
            "var springDelay = " +
            params.delay +
            "; var trigger = springDelay * textIndex; var motion = (time - inPoint) - trigger; if (motion < 0) { 100; } else { var tension = " +
            params.freq +
            " * 2 * Math.PI; var friction = " +
            params.decay +
            "; var displacement = Math.cos(tension * motion) / Math.exp(friction * motion); displacement * 100; }"
          );
        },
        animatorProps: [
          { type: "position", value: [0, -100] },
          { type: "rotation", value: 45 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Full",
        description: "Full bounce combo effect",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
        ],
        code: "var cascade = 0.03; var startAt = cascade * textIndex; var progress = (time - inPoint) - startAt; var out = 100; if (progress >= 0) { var f = 2; var k = 6.0; var osc = Math.cos(progress * f * 2 * Math.PI); var fade = Math.exp(-k * progress); out = osc * fade * 100; } out;",
        buildCode: function (params: any) {
          return (
            "var cascade = " +
            params.delay +
            "; var startAt = cascade * textIndex; var progress = (time - inPoint) - startAt; var out = 100; if (progress >= 0) { var f = " +
            params.freq +
            "; var k = " +
            params.decay +
            "; var osc = Math.cos(progress * f * 2 * Math.PI); var fade = Math.exp(-k * progress); out = osc * fade * 100; } out;"
          );
        },
        animatorProps: [
          { type: "position", value: [0, 80] },
          { type: "rotation", value: 30 },
          { type: "scale", value: [-100, -100] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Reverse",
        description: "Characters bounce from last to first",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var step = 0.03; var reverseIdx = textTotal - 1 - textIndex; var wait = step * reverseIdx; var t = (time - inPoint) - wait; if (t < 0) { 100; } else { var envelope = Math.exp(-6.0 * t); 100 * Math.cos(t * 2 * 2 * Math.PI) * envelope; }",
        buildCode: function (params: any) {
          return (
            "var step = " +
            params.delay +
            "; var reverseIdx = textTotal - 1 - textIndex; var wait = step * reverseIdx; var t = (time - inPoint) - wait; if (t < 0) { 100; } else { var envelope = Math.exp(-" +
            params.decay +
            " * t); 100 * Math.cos(t * " +
            params.freq +
            " * 2 * Math.PI) * envelope; }"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Random",
        description: "Characters bounce in random order",
        targets: ["animator"],
        params: [
          {
            name: "maxDelay",
            label: "Max Delay",
            min: 0.1,
            max: 1,
            default: 0.5,
            step: 0.1,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "seedRandom(textIndex, true); var rndDelay = random(0, 0.5); var elapsed = (time - inPoint) - rndDelay; if (elapsed < 0) { 100; } else { var w = 2 * 2 * Math.PI; var k = 6.0; 100 * Math.cos(w * elapsed) * Math.exp(-k * elapsed); }",
        buildCode: function (params: any) {
          return (
            "seedRandom(textIndex, true); var rndDelay = random(0, " +
            params.maxDelay +
            "); var elapsed = (time - inPoint) - rndDelay; if (elapsed < 0) { 100; } else { var w = " +
            params.freq +
            " * 2 * Math.PI; var k = " +
            params.decay +
            "; 100 * Math.cos(w * elapsed) * Math.exp(-k * elapsed); }"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Bounce Center Out",
        description: "Characters bounce from center outward",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var perChar = 0.03; var mid = (textTotal - 1) / 2; var dist = Math.abs(textIndex - mid); var onset = perChar * dist; var t = (time - inPoint) - onset; t < 0 ? 100 : Math.cos(t * 2 * 2 * Math.PI) / Math.exp(6.0 * t) * 100",
        buildCode: function (params: any) {
          return (
            "var perChar = " +
            params.delay +
            "; var mid = (textTotal - 1) / 2; var dist = Math.abs(textIndex - mid); var onset = perChar * dist; var t = (time - inPoint) - onset; t < 0 ? 100 : Math.cos(t * " +
            params.freq +
            " * 2 * Math.PI) / Math.exp(" +
            params.decay +
            " * t) * 100"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Elastic",
        description: "Extra elastic/rubbery bounce",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 3,
            max: 8,
            default: 5,
            step: 0.5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 2,
            max: 6,
            default: 3,
            step: 0.5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var cascade = 0.03; var charWait = cascade * textIndex; var spring = (time - inPoint) - charWait; if (spring < 0) { 100; } else { var resonance = 5 * 2 * Math.PI; var damping = 3.0; var deflection = Math.cos(resonance * spring) * Math.pow(Math.E, -damping * spring); deflection * 100; }",
        buildCode: function (params: any) {
          return (
            "var cascade = " +
            params.delay +
            "; var charWait = cascade * textIndex; var spring = (time - inPoint) - charWait; if (spring < 0) { 100; } else { var resonance = " +
            params.freq +
            " * 2 * Math.PI; var damping = " +
            params.decay +
            "; var deflection = Math.cos(resonance * spring) * Math.pow(Math.E, -damping * spring); deflection * 100; }"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Overshoot",
        description: "Simple overshoot without oscillation",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "overshoot",
            label: "Overshoot %",
            min: 10,
            max: 50,
            default: 20,
            step: 5,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -150,
            step: 10,
          },
        ],
        code: "var delay = 0.03; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; var dur = 0.3; var ovr = 0.2; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; 100 * (1 - (1 + ovr) * p); } else { var elapsed = t - dur; -100 * ovr * Math.cos(3 * elapsed * 2 * Math.PI) / Math.exp(8 * elapsed); }",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; var dur = 0.3; var ovr = " +
            params.overshoot / 100 +
            "; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; 100 * (1 - (1 + ovr) * p); } else { var elapsed = t - dur; -100 * ovr * Math.cos(3 * elapsed * 2 * Math.PI) / Math.exp(8 * elapsed); }"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -150] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Smooth Fade",
        description: "Smooth ease in without bounce",
        targets: ["animator"],
        params: [
          {
            name: "delay",
            label: "Char Delay",
            min: 0.01,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.1,
            max: 1,
            default: 0.3,
            step: 0.05,
          },
          {
            name: "posY",
            label: "Position Y",
            min: -150,
            max: 150,
            default: -50,
            step: 10,
          },
        ],
        code: "var delay = 0.03; var dur = 0.3; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; ease(t, 0, dur, 100, 0)",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var dur = " +
            params.duration +
            "; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; ease(t, 0, dur, 100, 0)"
          );
        },
        animatorProps: [
          { type: "position", axis: "y", param: "posY", value: [0, -50] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Wave Characters",
        description: "Characters move in wave pattern",
        targets: ["animator"],
        params: [
          {
            name: "waveHeight",
            label: "Wave Height",
            min: 10,
            max: 100,
            default: 40,
            step: 5,
          },
          {
            name: "waveSpeed",
            label: "Wave Speed",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.05,
            max: 0.3,
            default: 0.1,
            step: 0.025,
          },
        ],
        code: "var delay = 0.1; var h = 40; var s = 2; var offset = textIndex * delay; var wave = Math.sin((time - offset) * s * Math.PI * 2) * h; wave",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var h = " +
            params.waveHeight +
            "; var s = " +
            params.waveSpeed +
            "; var offset = textIndex * delay; var wave = Math.sin((time - offset) * s * Math.PI * 2) * h; wave"
          );
        },
        animatorProps: [{ type: "position", value: [0, 100] }],
      },
      {
        name: "Spiral Reveal",
        description: "Characters spiral in from outside",
        targets: ["animator"],
        params: [
          {
            name: "radius",
            label: "Radius",
            min: 50,
            max: 300,
            default: 150,
            step: 25,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.04,
            step: 0.01,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.3,
            max: 1.5,
            default: 0.6,
            step: 0.1,
          },
        ],
        code: "var delay = 0.04; var dur = 0.6; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; var eased = p * p * (3 - 2 * p); (1 - eased) * 100; } else { 0; }",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var dur = " +
            params.duration +
            "; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; var eased = p * p * (3 - 2 * p); (1 - eased) * 100; } else { 0; }"
          );
        },
        animatorProps: [
          { type: "position", axis: "x", param: "radius", value: [150, -80] },
          { type: "rotation", value: 720 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Gravity Drop",
        description: "Characters fall with gravity effect",
        targets: ["animator"],
        params: [
          {
            name: "dropHeight",
            label: "Drop Height",
            min: 50,
            max: 300,
            default: 150,
            step: 25,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.05,
            step: 0.01,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.2,
            max: 0.8,
            default: 0.4,
            step: 0.05,
          },
        ],
        code: "var delay = 0.05; var dur = 0.4; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; (1 - p * p) * 100; } else { var st = t - dur; 15 * Math.cos(4 * st * 2 * Math.PI) / Math.exp(8 * st); }",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var dur = " +
            params.duration +
            "; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; (1 - p * p) * 100; } else { var st = t - dur; 15 * Math.cos(4 * st * 2 * Math.PI) / Math.exp(8 * st); }"
          );
        },
        animatorProps: [
          {
            type: "position",
            axis: "y",
            param: "dropHeight",
            paramSign: -1,
            value: [0, -150],
          },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Magnetic Attract",
        description: "Characters pulled together magnetically",
        targets: ["animator"],
        params: [
          {
            name: "spread",
            label: "Initial Spread",
            min: 100,
            max: 500,
            default: 250,
            step: 25,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.03,
            step: 0.01,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.3,
            max: 1,
            default: 0.5,
            step: 0.1,
          },
        ],
        code: "var delay = 0.03; var dur = 0.5; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; var eased = 1 - Math.pow(1 - p, 3); (1 - eased) * 100; } else { 0; }",
        buildCode: function (params: any) {
          return (
            "var delay = " +
            params.delay +
            "; var dur = " +
            params.duration +
            "; var myDelay = delay * textIndex; var t = (time - inPoint) - myDelay; if (t < 0) { 100; } else if (t < dur) { var p = t / dur; var eased = 1 - Math.pow(1 - p, 3); (1 - eased) * 100; } else { 0; }"
          );
        },
        animatorProps: [
          { type: "position", axis: "x", param: "spread", value: [250, 0] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Elastic Stretch",
        description: "Characters stretch in with elastic effect",
        targets: ["animator"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.04,
            step: 0.01,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 6,
            step: 0.5,
          },
        ],
        code: "var spacing = 0.04; var tOff = spacing * textIndex; var stretch = (time - inPoint) - tOff; if (stretch < 0) { 100; } else { var bounce = Math.cos(2 * stretch * 2 * Math.PI); var decay = Math.exp(-6 * stretch); bounce * decay * 100; }",
        buildCode: function (params: any) {
          return (
            "var spacing = " +
            params.delay +
            "; var tOff = spacing * textIndex; var stretch = (time - inPoint) - tOff; if (stretch < 0) { 100; } else { var bounce = Math.cos(" +
            params.freq +
            " * stretch * 2 * Math.PI); var decay = Math.exp(-" +
            params.decay +
            " * stretch); bounce * decay * 100; }"
          );
        },
        animatorProps: [
          { type: "scale", value: [-100, -100] },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Shatter Out",
        description: "Characters shatter outward like explosion",
        targets: ["animator"],
        params: [
          {
            name: "force",
            label: "Force",
            min: 100,
            max: 500,
            default: 250,
            step: 25,
          },
          {
            name: "startTime",
            label: "Start Time",
            min: 0.5,
            max: 3,
            default: 1.5,
            step: 0.25,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.3,
            max: 1,
            default: 0.5,
            step: 0.1,
          },
        ],
        code: "var delay = 0.04; var myDelay = delay * textIndex; var t = (time - inPoint) - 1.5 - myDelay; var r = 0; if (t >= 0 && t < 0.5) { r = (t / 0.5) * 100; } else if (t >= 0.5) { r = 100; } r;",
        buildCode: function (params: any) {
          return (
            "var delay = 0.04; var myDelay = delay * textIndex; var t = (time - inPoint) - " +
            params.startTime +
            " - myDelay; var r = 0; if (t >= 0 && t < " +
            params.duration +
            ") { r = (t / " +
            params.duration +
            ") * 100; } else if (t >= " +
            params.duration +
            ") { r = 100; } r;"
          );
        },
        animatorProps: [
          { type: "position", axis: "x", param: "force", value: [250, -150] },
          { type: "rotation", value: 45 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Swing In",
        description: "Characters swing in like pendulum",
        targets: ["animator"],
        params: [
          {
            name: "angle",
            label: "Start Angle",
            min: 30,
            max: 120,
            default: 70,
            step: 10,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.05,
            step: 0.01,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 10,
            default: 5,
            step: 0.5,
          },
        ],
        code: "var lag = 0.05; var pendulumStart = lag * textIndex; var arc = (time - inPoint) - pendulumStart; if (arc < 0) { 100; } else { var swingFreq = 3 * Math.PI; var friction = 5; var pendulum = Math.cos(swingFreq * arc) * Math.exp(-friction * arc); pendulum * 100; }",
        buildCode: function (params: any) {
          return (
            "var lag = " +
            params.delay +
            "; var pendulumStart = lag * textIndex; var arc = (time - inPoint) - pendulumStart; if (arc < 0) { 100; } else { var swingFreq = 3 * Math.PI; var friction = " +
            params.decay +
            "; var pendulum = Math.cos(swingFreq * arc) * Math.exp(-friction * arc); pendulum * 100; }"
          );
        },
        animatorProps: [
          { type: "rotation", param: "angle", value: 70 },
          { type: "opacity", value: 0 },
        ],
      },
      {
        name: "Roll In",
        description: "Characters roll in from side",
        targets: ["animator"],
        params: [
          {
            name: "distance",
            label: "Distance",
            min: 100,
            max: 500,
            default: 300,
            step: 25,
          },
          {
            name: "delay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.04,
            step: 0.01,
          },
          {
            name: "duration",
            label: "Duration",
            min: 0.3,
            max: 1,
            default: 0.5,
            step: 0.1,
          },
        ],
        code: "var spacing = 0.04; var rollDur = 0.5; var charWait = spacing * textIndex; var t = (time - inPoint) - charWait; if (t < 0) { 100; } else if (t < rollDur) { var prog = t / rollDur; var curve = 1 - Math.pow(1 - prog, 3); (1 - curve) * 100; } else { 0; }",
        buildCode: function (params: any) {
          return (
            "var spacing = " +
            params.delay +
            "; var rollDur = " +
            params.duration +
            "; var charWait = spacing * textIndex; var t = (time - inPoint) - charWait; if (t < 0) { 100; } else if (t < rollDur) { var prog = t / rollDur; var curve = 1 - Math.pow(1 - prog, 3); (1 - curve) * 100; } else { 0; }"
          );
        },
        animatorProps: [
          {
            type: "position",
            axis: "x",
            param: "distance",
            paramSign: -1,
            value: [-300, 0],
          },
          { type: "rotation", value: 720 },
          { type: "opacity", value: 0 },
        ],
      },
    ],

    text: [
      {
        name: "Typewriter",
        description: "Characters appear one by one",
        targets: ["sourceText"],
        params: [
          {
            name: "charsPerSec",
            label: "Chars/sec",
            min: 5,
            max: 20,
            default: 10,
            step: 1,
          },
        ],
        code: "var txt = value; var numChars = Math.floor((time - inPoint) * 10); txt.substr(0, numChars)",
        buildCode: function (params: any) {
          return (
            "var txt = value; var numChars = Math.floor((time - inPoint) * " +
            params.charsPerSec +
            "); txt.substr(0, numChars)"
          );
        },
      },
      {
        name: "Number Counter",
        description: "Count from start to end value",
        targets: ["sourceText"],
        params: [
          {
            name: "startVal",
            label: "Start",
            min: 0,
            max: 1000,
            default: 0,
            step: 1,
          },
          {
            name: "endVal",
            label: "End",
            min: 0,
            max: 10000,
            default: 1000,
            step: 100,
          },
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 10,
            default: 3,
            step: 0.5,
          },
        ],
        code: "var t = time - inPoint; var val = linear(t, 0, 3, 0, 1000); Math.floor(val).toString()",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var val = linear(t, 0, " +
            params.dur +
            ", " +
            params.startVal +
            ", " +
            params.endVal +
            "); Math.floor(val).toString()"
          );
        },
      },
      {
        name: "Percentage Counter",
        description: "Count from 0% to 100%",
        targets: ["sourceText"],
        params: [
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
        ],
        code: 'var t = time - inPoint; var val = linear(t, 0, 2, 0, 100); Math.floor(val) + "%"',
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var val = linear(t, 0, " +
            params.dur +
            ', 0, 100); Math.floor(val) + "%"'
          );
        },
      },
      {
        name: "Countdown Timer",
        description: "Countdown in MM:SS format",
        targets: ["sourceText"],
        params: [
          {
            name: "totalSec",
            label: "Total Seconds",
            min: 10,
            max: 300,
            default: 60,
            step: 10,
          },
        ],
        code: 'var elapsed = time - inPoint; var remaining = Math.max(0, 60 - elapsed); var min = Math.floor(remaining / 60); var sec = Math.floor(remaining % 60); (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec',
        buildCode: function (params: any) {
          return (
            "var elapsed = time - inPoint; var remaining = Math.max(0, " +
            params.totalSec +
            ' - elapsed); var min = Math.floor(remaining / 60); var sec = Math.floor(remaining % 60); (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec'
          );
        },
      },
      {
        name: "Time Display",
        description: "Show current timecode",
        targets: ["sourceText"],
        params: [
          {
            name: "speed",
            label: "Speed",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.5,
          },
        ],
        code: "var spd = 1; timeToTimecode(time * spd, 1 / thisComp.frameDuration, false)",
        buildCode: function (params: any) {
          return (
            "var spd = " +
            params.speed +
            "; timeToTimecode(time * spd, 1 / thisComp.frameDuration, false)"
          );
        },
      },
      {
        name: "Random Reveal",
        description: "Hacker-style text reveal",
        targets: ["sourceText"],
        params: [
          {
            name: "revealSpeed",
            label: "Reveal Speed",
            min: 0.1,
            max: 0.5,
            default: 0.3,
            step: 0.05,
          },
          {
            name: "charDelay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.05,
            step: 0.01,
          },
        ],
        code: 'var txt = value; var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%"; var revealTime = 0.3; var charDelay = 0.05; var result = ""; var t = time - inPoint; for (var i = 0; i < txt.length; i++) { var charStart = i * charDelay; if (t > charStart + revealTime) { result += txt[i]; } else if (t > charStart) { seedRandom(i + Math.floor(t * 30), true); result += chars[Math.floor(random() * chars.length)]; } else { result += " "; } } result',
        buildCode: function (params: any) {
          return (
            'var txt = value; var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%"; var revealTime = ' +
            params.revealSpeed +
            "; var charDelay = " +
            params.charDelay +
            '; var result = ""; var t = time - inPoint; for (var i = 0; i < txt.length; i++) { var charStart = i * charDelay; if (t > charStart + revealTime) { result += txt[i]; } else if (t > charStart) { seedRandom(i + Math.floor(t * 30), true); result += chars[Math.floor(random() * chars.length)]; } else { result += " "; } } result'
          );
        },
      },
      {
        name: "Typewriter + Cursor",
        description: "Typewriter with blinking cursor",
        targets: ["sourceText"],
        params: [
          {
            name: "charsPerSec",
            label: "Chars/sec",
            min: 5,
            max: 20,
            default: 10,
            step: 1,
          },
          {
            name: "blinkSpeed",
            label: "Blink Speed",
            min: 2,
            max: 8,
            default: 4,
            step: 1,
          },
        ],
        code: 'var txt = value; var n = Math.floor((time - inPoint) * 10); var cursor = (Math.sin(time * 4 * Math.PI) > 0) ? "|" : " "; txt.substr(0, n) + cursor',
        buildCode: function (params: any) {
          return (
            "var txt = value; var n = Math.floor((time - inPoint) * " +
            params.charsPerSec +
            "); var cursor = (Math.sin(time * " +
            params.blinkSpeed +
            ' * Math.PI) > 0) ? "|" : " "; txt.substr(0, n) + cursor'
          );
        },
      },
      {
        name: "Word by Word",
        description: "Reveal text word by word",
        targets: ["sourceText"],
        params: [
          {
            name: "wordsPerSec",
            label: "Words/sec",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
        ],
        code: 'var txt = value; var words = txt.split(" "); var n = Math.floor((time - inPoint) * 2); words.slice(0, n).join(" ")',
        buildCode: function (params: any) {
          return (
            'var txt = value; var words = txt.split(" "); var n = Math.floor((time - inPoint) * ' +
            params.wordsPerSec +
            '); words.slice(0, n).join(" ")'
          );
        },
      },
      {
        name: "Text Cycle",
        description:
          "Cycle through multiple words (use commas: word1,word2,word3)",
        targets: ["sourceText"],
        params: [
          {
            name: "duration",
            label: "Duration each",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.5,
          },
        ],
        code: "var txt = '' + value; var words = txt.split(','); if (words.length < 2) words = txt.split(' '); var idx = Math.floor(time / 1) % words.length; var w = words[idx]; w.replace(/^\\s+|\\s+$/g, '')",
        buildCode: function (params: any) {
          return (
            "var txt = '' + value; var words = txt.split(','); if (words.length < 2) words = txt.split(' '); var idx = Math.floor(time / " +
            params.duration +
            ") % words.length; var w = words[idx]; w.replace(/^\\s+|\\s+$/g, '')"
          );
        },
      },
      {
        name: "Currency Counter",
        description: "Count with currency format ($1,234)",
        targets: ["sourceText"],
        params: [
          {
            name: "endVal",
            label: "End Value",
            min: 1000,
            max: 100000,
            default: 10000,
            step: 1000,
          },
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "prefix",
            label: "Symbol (1=$,2=€,3=£)",
            min: 1,
            max: 3,
            default: 1,
            step: 1,
          },
        ],
        code: 'var t = time - inPoint; var val = Math.floor(linear(t, 0, 2, 0, 10000)); var str = val.toString(); var result = ""; for(var i = str.length - 1, c = 0; i >= 0; i--, c++) { if(c > 0 && c % 3 == 0) result = "," + result; result = str[i] + result; } "$" + result',
        buildCode: function (params: any) {
          var symbol =
            params.prefix == 1 ? "$" : params.prefix == 2 ? "€" : "£";
          return (
            "var t = time - inPoint; var val = Math.floor(linear(t, 0, " +
            params.dur +
            ", 0, " +
            params.endVal +
            ')); var str = val.toString(); var result = ""; for(var i = str.length - 1, c = 0; i >= 0; i--, c++) { if(c > 0 && c % 3 == 0) result = "," + result; result = str[i] + result; } "' +
            symbol +
            '" + result'
          );
        },
      },
      {
        name: "Bounce Counter",
        description: "Counter with overshoot bounce",
        targets: ["sourceText"],
        params: [
          {
            name: "endVal",
            label: "End Value",
            min: 10,
            max: 10000,
            default: 100,
            step: 10,
          },
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
        ],
        code: "var t = time - inPoint; var dur = 2; var freq = 3; var decay = 5; var target = 100; var val; if(t < dur) { val = target * t / dur; } else { var elapsed = t - dur; var bounce = Math.cos(freq * elapsed * Math.PI * 2) * target * 0.2 / Math.exp(decay * elapsed); val = target + bounce; } Math.floor(Math.max(0, val)).toString()",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var dur = " +
            params.dur +
            "; var freq = 3; var decay = 5; var target = " +
            params.endVal +
            "; var val; if(t < dur) { val = target * t / dur; } else { var elapsed = t - dur; var bounce = Math.cos(freq * elapsed * Math.PI * 2) * target * 0.2 / Math.exp(decay * elapsed); val = target + bounce; } Math.floor(Math.max(0, val)).toString()"
          );
        },
      },
      {
        name: "Date Display",
        description: "Show formatted date",
        targets: ["sourceText"],
        params: [
          {
            name: "format",
            label: "Format (1=Full,2=Short)",
            min: 1,
            max: 2,
            default: 1,
            step: 1,
          },
          {
            name: "year",
            label: "Year",
            min: 2000,
            max: 2100,
            default: 2026,
            step: 1,
            type: "input",
          },
          {
            name: "month",
            label: "Month",
            min: 1,
            max: 12,
            default: 1,
            step: 1,
          },
          { name: "day", label: "Day", min: 1, max: 31, default: 1, step: 1 },
        ],
        code: 'var months = ["January","February","March","April","May","June","July","August","September","October","November","December"]; months[0] + " 1, 2026"',
        buildCode: function (params: any) {
          var y = params.year || 2026;
          var m = params.month || 1;
          var dy = params.day || 1;
          if (params.format == 1) {
            return (
              'var months = ["January","February","March","April","May","June","July","August","September","October","November","December"]; months[' +
              (m - 1) +
              '] + " " + ' +
              dy +
              ' + ", " + ' +
              y
            );
          } else {
            return (
              "var day = " +
              dy +
              "; var mon = " +
              m +
              '; (day < 10 ? "0" : "") + day + "/" + (mon < 10 ? "0" : "") + mon + "/" + ' +
              y
            );
          }
        },
      },
      {
        name: "Stopwatch",
        description: "Stopwatch with deceleration stop",
        targets: ["sourceText"],
        params: [
          {
            name: "stopAt",
            label: "Stop At (sec)",
            min: 5,
            max: 120,
            default: 10,
            step: 5,
          },
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 10,
            default: 3,
            step: 0.5,
          },
        ],
        code: 'var t = time - inPoint; var stopAt = 10; var dur = 3; var progress = Math.min(t / dur, 1); var eased = 1 - Math.pow(1 - progress, 3); var d = stopAt * eased; var min = Math.floor(d / 60); var sec = Math.floor(d % 60); var ms = Math.floor((d % 1) * 100); (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec + "." + (ms < 10 ? "0" : "") + ms',
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var stopAt = " +
            params.stopAt +
            "; var dur = " +
            params.dur +
            '; var progress = Math.min(t / dur, 1); var eased = 1 - Math.pow(1 - progress, 3); var d = stopAt * eased; var min = Math.floor(d / 60); var sec = Math.floor(d % 60); var ms = Math.floor((d % 1) * 100); (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec + "." + (ms < 10 ? "0" : "") + ms'
          );
        },
      },
      {
        name: "Blinking Text",
        description: "Text blinks on and off",
        targets: ["sourceText"],
        params: [
          {
            name: "speed",
            label: "Blink Speed",
            min: 1,
            max: 10,
            default: 4,
            step: 1,
          },
        ],
        code: 'Math.sin(time * 4 * Math.PI) > 0 ? value : ""',
        buildCode: function (params: any) {
          return (
            "Math.sin(time * " + params.speed + ' * Math.PI) > 0 ? value : ""'
          );
        },
      },
      {
        name: "Digital Noise",
        description: "Random digital noise corruption",
        targets: ["sourceText"],
        params: [
          {
            name: "intensity",
            label: "Intensity",
            min: 1,
            max: 5,
            default: 2,
            step: 1,
          },
          {
            name: "speed",
            label: "Speed",
            min: 5,
            max: 20,
            default: 10,
            step: 1,
          },
        ],
        code: 'var txt = value; var chars = "@#$%&*!?<>|/\\\\"; seedRandom(Math.floor(time * 10), true); var result = ""; for(var i = 0; i < txt.length; i++) { if(random() < 0.1 * 2) { result += chars[Math.floor(random() * chars.length)]; } else { result += txt[i]; } } result',
        buildCode: function (params: any) {
          return (
            'var txt = value; var chars = "@#$%&*!?<>|/\\\\"; seedRandom(Math.floor(time * ' +
            params.speed +
            '), true); var result = ""; for(var i = 0; i < txt.length; i++) { if(random() < 0.1 * ' +
            params.intensity +
            ") { result += chars[Math.floor(random() * chars.length)]; } else { result += txt[i]; } } result"
          );
        },
      },
      {
        name: "Ellipsis Loader",
        description: "Animated loading dots (...)",
        targets: ["sourceText"],
        params: [
          {
            name: "speed",
            label: "Speed",
            min: 1,
            max: 4,
            default: 2,
            step: 0.5,
          },
        ],
        code: 'var dots = Math.floor(time * 2) % 4; value + Array(dots + 1).join(".")',
        buildCode: function (params: any) {
          return (
            "var dots = Math.floor(time * " +
            params.speed +
            ') % 4; value + Array(dots + 1).join(".")'
          );
        },
      },
      {
        name: "Decimal Counter",
        description: "Count with decimal places",
        targets: ["sourceText"],
        params: [
          {
            name: "endVal",
            label: "End Value",
            min: 10,
            max: 1000,
            default: 100,
            step: 10,
          },
          {
            name: "decimals",
            label: "Decimal Places",
            min: 1,
            max: 3,
            default: 2,
            step: 1,
          },
          {
            name: "dur",
            label: "Duration",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
        ],
        code: "var t = time - inPoint; var val = linear(t, 0, 2, 0, 100); val.toFixed(2)",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var val = linear(t, 0, " +
            params.dur +
            ", 0, " +
            params.endVal +
            "); val.toFixed(" +
            params.decimals +
            ")"
          );
        },
      },
      {
        name: "Simple Countdown",
        description: "Simple number countdown (10,9,8...)",
        targets: ["sourceText"],
        params: [
          {
            name: "startNum",
            label: "Start Number",
            min: 3,
            max: 30,
            default: 10,
            step: 1,
          },
        ],
        code: "var t = time - inPoint; var num = Math.max(0, 10 - Math.floor(t)); num.toString()",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint; var num = Math.max(0, " +
            params.startNum +
            " - Math.floor(t)); num.toString()"
          );
        },
      },
      {
        name: "Slot Machine",
        description: "Characters spin like a slot reel and lock in place",
        targets: ["sourceText"],
        params: [
          {
            name: "charDelay",
            label: "Char Delay",
            min: 0.03,
            max: 0.2,
            default: 0.1,
            step: 0.01,
          },
          {
            name: "spinDur",
            label: "Spin Duration",
            min: 0.3,
            max: 1.5,
            default: 0.6,
            step: 0.1,
          },
        ],
        code: 'var src = value; var delay = 0.1; var spinDur = 0.6; var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { var charStart = delay * i; var charEnd = charStart + spinDur; if (src[i] == " ") { result += " "; } else if (t >= charEnd) { result += src[i]; } else if (t >= charStart) { var progress = (t - charStart) / spinDur; var speed = Math.floor((1 - progress * progress) * 15) + 1; var charIdx = Math.floor(t * speed * 10) % chars.length; result += chars[charIdx]; } else { result += " "; } } result',
        buildCode: function (params: any) {
          return (
            "var src = value; var delay = " +
            params.charDelay +
            "; var spinDur = " +
            params.spinDur +
            '; var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { var charStart = delay * i; var charEnd = charStart + spinDur; if (src[i] == " ") { result += " "; } else if (t >= charEnd) { result += src[i]; } else if (t >= charStart) { var progress = (t - charStart) / spinDur; var speed = Math.floor((1 - progress * progress) * 15) + 1; var charIdx = Math.floor(t * speed * 10) % chars.length; result += chars[charIdx]; } else { result += " "; } } result'
          );
        },
      },
      {
        name: "Decode",
        description: "Cipher symbols decode into real text",
        targets: ["sourceText"],
        params: [
          {
            name: "charDelay",
            label: "Char Delay",
            min: 0.02,
            max: 0.1,
            default: 0.04,
            step: 0.01,
          },
          {
            name: "decodeDur",
            label: "Decode Duration",
            min: 0.1,
            max: 0.8,
            default: 0.3,
            step: 0.05,
          },
        ],
        code: 'var src = value; var delay = 0.04; var decodeDur = 0.3; var startDelay = 0.3; var cipherChars = "-=+*#@!?:;"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { var charStart = startDelay + delay * i; var charEnd = charStart + decodeDur; if (src[i] == " ") { result += " "; } else if (t >= charEnd) { result += src[i]; } else if (t >= charStart) { seedRandom(i + Math.floor(t * 25), true); result += cipherChars[Math.floor(random(0, cipherChars.length))]; } else { result += cipherChars[i % cipherChars.length]; } } result',
        buildCode: function (params: any) {
          return (
            "var src = value; var delay = " +
            params.charDelay +
            "; var decodeDur = " +
            params.decodeDur +
            '; var startDelay = 0.3; var cipherChars = "-=+*#@!?:;"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { var charStart = startDelay + delay * i; var charEnd = charStart + decodeDur; if (src[i] == " ") { result += " "; } else if (t >= charEnd) { result += src[i]; } else if (t >= charStart) { seedRandom(i + Math.floor(t * 25), true); result += cipherChars[Math.floor(random(0, cipherChars.length))]; } else { result += cipherChars[i % cipherChars.length]; } } result'
          );
        },
      },
      {
        name: "Redacted Reveal",
        description: "Classified block text reveals character by character",
        targets: ["sourceText"],
        params: [
          {
            name: "charDelay",
            label: "Char Delay",
            min: 0.03,
            max: 0.15,
            default: 0.06,
            step: 0.01,
          },
          {
            name: "startDelay",
            label: "Start Delay",
            min: 0,
            max: 2,
            default: 0.5,
            step: 0.1,
          },
          {
            name: "symbol",
            label: "Symbol (1=#,2=*,3=/,4=&)",
            min: 1,
            max: 4,
            default: 1,
            step: 1,
          },
        ],
        code: 'var src = value; var charDelay = 0.06; var startDelay = 0.5; var mask = "#"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { if (src[i] == " ") { result += " "; } else if (t >= startDelay + charDelay * i) { result += src[i]; } else { result += mask; } } result',
        buildCode: function (params: any) {
          var symbols: any = { 1: "#", 2: "*", 3: "/", 4: "&" };
          var mask = symbols[params.symbol] || "#";
          return (
            "var src = value; var charDelay = " +
            params.charDelay +
            "; var startDelay = " +
            params.startDelay +
            '; var mask = "' +
            mask +
            '"; var t = time - inPoint; var result = ""; for (var i = 0; i < src.length; i++) { if (src[i] == " ") { result += " "; } else if (t >= startDelay + charDelay * i) { result += src[i]; } else { result += mask; } } result'
          );
        },
      },
    ],

    motion: [
      {
        name: "Wiggle",
        description: "Random shaky movement",
        targets: ["position", "rotation", "scale", "opacity"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 20,
            default: 5,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 200,
            default: 20,
            step: 1,
          },
        ],
        code: "wiggle(5, 20)",
        buildCode: function (params: any) {
          return "wiggle(" + params.freq + ", " + params.amp + ")";
        },
      },
      {
        name: "Smooth Wiggle",
        description: "Organic, flowing movement - very smooth",
        targets: ["position", "rotation", "scale"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 5,
            default: 1,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 25,
            step: 1,
          },
          {
            name: "octaves",
            label: "Octaves",
            min: 1,
            max: 6,
            default: 4,
            step: 1,
          },
        ],
        code: "wiggle(1, 25, 4, 0.3)",
        buildCode: function (params: any) {
          return (
            "wiggle(" +
            params.freq +
            ", " +
            params.amp +
            ", " +
            params.octaves +
            ", 0.3)"
          );
        },
      },
      {
        name: "Decay Wiggle",
        description: "Stepped wiggle that fades out - choppy intro shake",
        targets: ["position", "rotation", "scale"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 20,
            default: 8,
            step: 1,
          },
          {
            name: "startAmp",
            label: "Start Amplitude",
            min: 1,
            max: 200,
            default: 80,
            step: 1,
          },
          {
            name: "decay",
            label: "Decay Speed",
            min: 1,
            max: 10,
            default: 3,
            step: 0.5,
          },
          {
            name: "fps",
            label: "Step FPS",
            min: 6,
            max: 24,
            default: 12,
            step: 2,
          },
        ],
        code: "posterizeTime(12);\nvar t = time - inPoint;\nvar env = Math.exp(-3 * t);\nwiggle(8, 80 * env)",
        buildCode: function (params: any) {
          return (
            "posterizeTime(" +
            params.fps +
            ");\nvar t = time - inPoint;\nvar env = Math.exp(-" +
            params.decay +
            " * t);\nwiggle(" +
            params.freq +
            ", " +
            params.startAmp +
            " * env)"
          );
        },
      },
      {
        name: "X-Axis Wiggle",
        description: "Horizontal only wiggle - Y stays locked",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 20,
            default: 5,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 15,
            step: 1,
          },
        ],
        code: "var w = wiggle(5, 15); [w[0], value[1]]",
        buildCode: function (params: any) {
          return (
            "var w = wiggle(" +
            params.freq +
            ", " +
            params.amp +
            "); [w[0], value[1]]"
          );
        },
      },
      {
        name: "Y-Axis Wiggle",
        description: "Vertical only wiggle - X stays locked",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 20,
            default: 5,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 15,
            step: 1,
          },
        ],
        code: "var w = wiggle(5, 15); [value[0], w[1]]",
        buildCode: function (params: any) {
          return (
            "var w = wiggle(" +
            params.freq +
            ", " +
            params.amp +
            "); [value[0], w[1]]"
          );
        },
      },
      {
        name: "Loopable Wiggle",
        description: "Seamless looping wiggle - great for backgrounds",
        targets: ["position", "rotation", "scale"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 10,
            default: 2,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 25,
            step: 1,
          },
          {
            name: "loopDur",
            label: "Loop Duration (sec)",
            min: 1,
            max: 10,
            default: 5,
            step: 1,
          },
        ],
        code: "var dur = 5; var a = 25; var pi2 = Math.PI * 2; var t = (time % dur) / dur * pi2 * 2; var nx = Math.sin(t + 1.2) * 0.5 + Math.sin(t * 2 + 0.7) * 0.3 + Math.sin(t * 3 + 2.4) * 0.2; var ny = Math.sin(t + 3.8) * 0.5 + Math.sin(t * 2 + 1.5) * 0.3 + Math.sin(t * 4 + 0.3) * 0.2; var prop = thisProperty.name.toLowerCase(); if (prop.indexOf('scale') >= 0) { value + [nx * a, ny * a] } else if (prop.indexOf('rotation') >= 0 || prop.indexOf('opacity') >= 0) { value + nx * a } else { value + [nx * a, ny * a] }",
        buildCode: function (params: any) {
          return (
            "var dur = " +
            params.loopDur +
            "; var a = " +
            params.amp +
            "; var pi2 = Math.PI * 2; var t = (time % dur) / dur * pi2 * " +
            params.freq +
            "; var nx = Math.sin(t + 1.2) * 0.5 + Math.sin(t * 2 + 0.7) * 0.3 + Math.sin(t * 3 + 2.4) * 0.2; var ny = Math.sin(t + 3.8) * 0.5 + Math.sin(t * 2 + 1.5) * 0.3 + Math.sin(t * 4 + 0.3) * 0.2; var prop = thisProperty.name.toLowerCase(); if (prop.indexOf('scale') >= 0) { value + [nx * a, ny * a] } else if (prop.indexOf('rotation') >= 0 || prop.indexOf('opacity') >= 0) { value + nx * a } else { value + [nx * a, ny * a] }"
          );
        },
      },
      {
        name: "Snapping Wiggle",
        description: "Grid-snapped wiggle - pixel-perfect movement",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 10,
            default: 3,
            step: 1,
          },
          {
            name: "gridSize",
            label: "Grid Size",
            min: 10,
            max: 100,
            default: 50,
            step: 10,
          },
        ],
        code: "var w = wiggle(3, 100); [Math.round(w[0] / 50) * 50, Math.round(w[1] / 50) * 50]",
        buildCode: function (params: any) {
          return (
            "var w = wiggle(" +
            params.freq +
            ", " +
            params.gridSize * 2 +
            "); [Math.round(w[0] / " +
            params.gridSize +
            ") * " +
            params.gridSize +
            ", Math.round(w[1] / " +
            params.gridSize +
            ") * " +
            params.gridSize +
            "]"
          );
        },
      },
      {
        name: "Separate XY Wiggle",
        description: "Different frequency and amplitude for X and Y",
        targets: ["position"],
        params: [
          {
            name: "freqX",
            label: "Freq X",
            min: 1,
            max: 20,
            default: 3,
            step: 1,
          },
          {
            name: "ampX",
            label: "Amp X",
            min: 1,
            max: 100,
            default: 30,
            step: 1,
          },
          {
            name: "freqY",
            label: "Freq Y",
            min: 1,
            max: 20,
            default: 5,
            step: 1,
          },
          {
            name: "ampY",
            label: "Amp Y",
            min: 1,
            max: 100,
            default: 10,
            step: 1,
          },
        ],
        code: "seedRandom(1, true); var x = wiggle(3, 30)[0]; seedRandom(2, true); var y = wiggle(5, 10)[1]; [x, y]",
        buildCode: function (params: any) {
          return (
            "seedRandom(1, true); var x = wiggle(" +
            params.freqX +
            ", " +
            params.ampX +
            ")[0]; seedRandom(2, true); var y = wiggle(" +
            params.freqY +
            ", " +
            params.ampY +
            ")[1]; [x, y]"
          );
        },
      },
      {
        name: "Jumpy Wiggle",
        description: "Stop-motion style wiggle - posterized frames",
        targets: ["position", "rotation", "scale"],
        params: [
          { name: "fps", label: "FPS", min: 1, max: 30, default: 8, step: 1 },
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 20,
            default: 5,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 30,
            step: 1,
          },
        ],
        code: "posterizeTime(8); wiggle(5, 30)",
        buildCode: function (params: any) {
          return (
            "posterizeTime(" +
            params.fps +
            "); wiggle(" +
            params.freq +
            ", " +
            params.amp +
            ")"
          );
        },
      },
      {
        name: "Noise Wiggle",
        description: "Perlin noise based organic movement",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 5,
            default: 1,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 100,
            default: 50,
            step: 1,
          },
        ],
        code: "var x = noise(time * 1) * 50; var y = noise(time * 1 + 100) * 50; value + [x, y]",
        buildCode: function (params: any) {
          return (
            "var x = noise(time * " +
            params.freq +
            ") * " +
            params.amp +
            "; var y = noise(time * " +
            params.freq +
            " + 100) * " +
            params.amp +
            "; value + [x, y]"
          );
        },
      },
      {
        name: "Shake",
        description: "Camera shake effect - intense and fast",
        targets: ["position", "rotation"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 10,
            max: 30,
            default: 20,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 5,
            max: 50,
            default: 15,
            step: 1,
          },
          {
            name: "decay",
            label: "Decay",
            min: 1,
            max: 10,
            default: 3,
            step: 0.5,
          },
        ],
        code: "var t = time - inPoint;\nvar env = Math.exp(-3 * t);\nwiggle(20, 15 * env)",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint;\nvar env = Math.exp(-" +
            params.decay +
            " * t);\nwiggle(" +
            params.freq +
            ", " +
            params.amp +
            " * env)"
          );
        },
      },
      {
        name: "Jitter",
        description: "Choppy micro trembling - posterized jumps",
        targets: ["position", "rotation", "scale"],
        params: [
          {
            name: "amp",
            label: "Amplitude",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "fps",
            label: "Step FPS",
            min: 8,
            max: 24,
            default: 15,
            step: 1,
          },
        ],
        code: "posterizeTime(15);\nwiggle(30, 2)",
        buildCode: function (params: any) {
          return (
            "posterizeTime(" + params.fps + ");\nwiggle(30, " + params.amp + ")"
          );
        },
      },
      {
        name: "Drift",
        description: "Slow, gentle floating movement",
        targets: ["position", "rotation"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.1,
            max: 1,
            default: 0.3,
            step: 0.1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 5,
            max: 50,
            default: 20,
            step: 1,
          },
        ],
        code: "wiggle(0.3, 20)",
        buildCode: function (params: any) {
          return "wiggle(" + params.freq + ", " + params.amp + ")";
        },
      },
      {
        name: "Random Jump",
        description: "Random position jumps at intervals",
        targets: ["position"],
        params: [
          {
            name: "holdTime",
            label: "Hold Time (sec)",
            min: 0.1,
            max: 2,
            default: 0.5,
            step: 0.1,
          },
          {
            name: "rangeX",
            label: "Range X",
            min: 10,
            max: 200,
            default: 100,
            step: 10,
          },
          {
            name: "rangeY",
            label: "Range Y",
            min: 10,
            max: 200,
            default: 100,
            step: 10,
          },
        ],
        code: "var seed = Math.floor(time / 0.5); seedRandom(seed, true); var x = random(-100, 100); var y = random(-100, 100); value + [x, y]",
        buildCode: function (params: any) {
          return (
            "var seed = Math.floor(time / " +
            params.holdTime +
            "); seedRandom(seed, true); var x = random(-" +
            params.rangeX +
            ", " +
            params.rangeX +
            "); var y = random(-" +
            params.rangeY +
            ", " +
            params.rangeY +
            "); value + [x, y]"
          );
        },
      },
      {
        name: "Wave Drift",
        description: "Soft wave motion with a gentle drift offset over time",
        targets: ["position"],
        params: [
          {
            name: "amp",
            label: "Amplitude",
            min: 5,
            max: 200,
            default: 40,
            step: 5,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 8,
            default: 2.5,
            step: 0.25,
          },
          {
            name: "speed",
            label: "Speed",
            min: 0.1,
            max: 6,
            default: 1.5,
            step: 0.1,
          },
        ],
        code: "var amp = 40;\nvar f = 2.5;\nvar s = 1.5;\nvalue + [Math.sin(time * s * 2 * Math.PI * f) * amp, Math.cos(time * s * 2 * Math.PI * f) * amp * 0.5];",
        buildCode: function (params: any) {
          return (
            "var amp = " +
            params.amp +
            ";\nvar f = " +
            params.freq +
            ";\nvar s = " +
            params.speed +
            ";\nvalue + [Math.sin(time * s * 2 * Math.PI * f) * amp, Math.cos(time * s * 2 * Math.PI * f) * amp * 0.5];"
          );
        },
      },
      {
        name: "Slide In",
        description: "Smooth entry from offset into place",
        targets: ["position"],
        params: [
          {
            name: "offset",
            label: "Offset",
            min: 20,
            max: 300,
            default: 120,
            step: 10,
          },
          {
            name: "ease",
            label: "Ease",
            min: 0.5,
            max: 6,
            default: 2,
            step: 0.25,
          },
        ],
        code: "var o = 120;\nvar e = 2;\nvar t = time;\nvar x = (1 - Math.exp(-e * t)) * o;\nvalue + [x, 0];",
        buildCode: function (params: any) {
          return (
            "var o = " +
            params.offset +
            ";\nvar e = " +
            params.ease +
            ";\nvar t = time;\nvar x = (1 - Math.exp(-e * t)) * o;\nvalue + [x, 0];"
          );
        },
      },
      {
        name: "Pulse Scale",
        description: "Gentle rhythmic scaling with punch at each beat",
        targets: ["scale"],
        params: [
          {
            name: "strength",
            label: "Strength",
            min: 5,
            max: 60,
            default: 18,
            step: 2,
          },
          {
            name: "speed",
            label: "Speed",
            min: 0.5,
            max: 10,
            default: 2.5,
            step: 0.25,
          },
        ],
        code: "var s = 18;\nvar f = 2.5;\nvar pulse = 1 + Math.sin(time * f * 2 * Math.PI) * (s / 100);\nvalue * pulse;",
        buildCode: function (params: any) {
          return (
            "var s = " +
            params.strength +
            ";\nvar f = " +
            params.speed +
            ";\nvar pulse = 1 + Math.sin(time * f * 2 * Math.PI) * (s / 100);\nvalue * pulse;"
          );
        },
      },
    ],

    physics: [
      {
        name: "Friction Slide",
        description: "Slide with realistic friction deceleration",
        targets: ["position"],
        params: [
          {
            name: "initialVelocity",
            label: "Initial Velocity",
            min: 100,
            max: 1000,
            default: 500,
            step: 50,
          },
          {
            name: "friction",
            label: "Friction",
            min: 1,
            max: 10,
            default: 3,
            step: 0.5,
          },
        ],
        code: "var v0 = 500;\nvar f = 3;\nvar t = time - inPoint;\nvar slideDur = 1.5;\nvar dist;\nif (t < slideDur) {\n  dist = v0 * (1 - Math.exp(-f * t)) / f;\n} else {\n  var maxDist = v0 * (1 - Math.exp(-f * slideDur)) / f;\n  var rt = Math.min((t - slideDur) / 1.5, 1);\n  dist = maxDist * (1 - rt * rt);\n}\nvalue + [dist, 0]",
        buildCode: function (params: any) {
          return (
            "var v0 = " +
            params.initialVelocity +
            ";\nvar f = " +
            params.friction +
            ";\nvar t = time - inPoint;\nvar slideDur = 1.5;\nvar dist;\nif (t < slideDur) {\n  dist = v0 * (1 - Math.exp(-f * t)) / f;\n} else {\n  var maxDist = v0 * (1 - Math.exp(-f * slideDur)) / f;\n  var rt = Math.min((t - slideDur) / 1.5, 1);\n  dist = maxDist * (1 - rt * rt);\n}\nvalue + [dist, 0]"
          );
        },
      },
      {
        name: "Air Drag",
        description: "Movement with air resistance",
        targets: ["position"],
        params: [
          {
            name: "velocity",
            label: "Velocity",
            min: 100,
            max: 800,
            default: 400,
            step: 50,
          },
          {
            name: "drag",
            label: "Drag",
            min: 0.5,
            max: 5,
            default: 2,
            step: 0.25,
          },
        ],
        code: "var v = 400;\nvar d = 2;\nvar t = time - inPoint;\nvar x = v * t * Math.exp(-d * t);\nvalue + [x, 0]",
        buildCode: function (params: any) {
          return (
            "var v = " +
            params.velocity +
            ";\nvar d = " +
            params.drag +
            ";\nvar t = time - inPoint;\nvar x = v * t * Math.exp(-d * t);\nvalue + [x, 0]"
          );
        },
      },
      {
        name: "Wind Sway",
        description: "Organic wind-blown swaying motion",
        targets: ["rotation", "position"],
        params: [
          {
            name: "intensity",
            label: "Intensity",
            min: 5,
            max: 40,
            default: 15,
            step: 5,
          },
          {
            name: "speed",
            label: "Speed",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.25,
          },
        ],
        code: "var i = 15;\nvar s = 1;\nvar wind = Math.sin(time * s * 2.1) * i * 0.5 + Math.sin(time * s * 3.7) * i * 0.3 + Math.sin(time * s * 1.3) * i * 0.2;\nvar prop = thisProperty.name.toLowerCase();\nif (prop.indexOf('position') !== -1) {\n    value + [wind, Math.sin(time * s * 0.7) * i * 0.15];\n} else {\n    value + wind;\n}",
        buildCode: function (params: any) {
          return (
            "var i = " +
            params.intensity +
            ";\nvar s = " +
            params.speed +
            ";\nvar wind = Math.sin(time * s * 2.1) * i * 0.5 + Math.sin(time * s * 3.7) * i * 0.3 + Math.sin(time * s * 1.3) * i * 0.2;\nvar prop = thisProperty.name.toLowerCase();\nif (prop.indexOf('position') !== -1) {\n    value + [wind, Math.sin(time * s * 0.7) * i * 0.15];\n} else {\n    value + wind;\n}"
          );
        },
      },
      {
        name: "Auto Bounce",
        description: "Automatic bouncing from layer start",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 2,
            max: 5,
            default: 3,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 20,
            max: 100,
            default: 50,
            step: 5,
          },
          {
            name: "decay",
            label: "Decay",
            min: 2,
            max: 8,
            default: 5,
            step: 0.5,
          },
        ],
        code: "var elapsed = time - inPoint; var impact = Math.abs(Math.sin(elapsed * 3 * Math.PI)); var damping = Math.exp(-5 * elapsed); var rebound = impact * damping * 50; value + [0, -rebound]",
        buildCode: function (params: any) {
          return (
            "var elapsed = time - inPoint; var impact = Math.abs(Math.sin(elapsed * " +
            params.freq +
            " * Math.PI)); var damping = Math.exp(-" +
            params.decay +
            " * elapsed); var rebound = impact * damping * " +
            params.amp +
            "; value + [0, -rebound]"
          );
        },
      },
      {
        name: "Elastic Pop",
        description:
          "Elastic scale pop-in with overshoot (Works at 100% scale)",
        targets: ["scale"],
        params: [
          {
            name: "overshoot",
            label: "Overshoot",
            min: 1.1,
            max: 1.5,
            default: 1.2,
            step: 0.05,
          },
          {
            name: "freq",
            label: "Frequency",
            min: 3,
            max: 8,
            default: 4,
            step: 1,
          },
          {
            name: "decay",
            label: "Decay",
            min: 3,
            max: 8,
            default: 5,
            step: 0.5,
          },
        ],
        code: "var elapsed = time - inPoint; var rampDur = 0.3; var s; if (elapsed < rampDur) { s = linear(elapsed, 0, rampDur, 0, 120); } else { var spring = elapsed - rampDur; var ripple = Math.cos(spring * 8 * Math.PI) * Math.exp(-5 * spring); s = 100 + 20 * ripple; } [s, s]",
        buildCode: function (params: any) {
          var overshootVal = params.overshoot * 100;
          var diff = overshootVal - 100;
          var omega = params.freq * 2;
          return (
            "var elapsed = time - inPoint; var rampDur = 0.3; var s; if (elapsed < rampDur) { s = linear(elapsed, 0, rampDur, 0, " +
            overshootVal +
            "); } else { var spring = elapsed - rampDur; var ripple = Math.cos(spring * " +
            omega +
            " * Math.PI) * Math.exp(-" +
            params.decay +
            " * spring); s = 100 + " +
            diff +
            " * ripple; } [s, s]"
          );
        },
      },
      {
        name: "Springy",
        description: "Spring-like oscillation that settles",
        targets: ["rotation"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 3,
            max: 10,
            default: 5,
            step: 1,
          },
          {
            name: "decay",
            label: "Decay",
            min: 2,
            max: 6,
            default: 4,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 10,
            max: 50,
            default: 30,
            step: 5,
          },
        ],
        code: "var elapsed = time - inPoint; var omega = 10 * Math.PI; var envelope = Math.exp(-4 * elapsed); value + Math.sin(omega * elapsed) * 30 * envelope",
        buildCode: function (params: any) {
          var omega = params.freq * 2;
          return (
            "var elapsed = time - inPoint; var omega = " +
            omega +
            " * Math.PI; var envelope = Math.exp(-" +
            params.decay +
            " * elapsed); value + Math.sin(omega * elapsed) * " +
            params.amp +
            " * envelope"
          );
        },
      },
    ],

    transform: [
      {
        name: "Scale Pulse",
        description:
          "Sharp rhythmic scale pulse - snappy beat (Works at 100% scale)",
        targets: ["scale"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 1,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 5,
            max: 20,
            default: 10,
            step: 1,
          },
        ],
        code: "var raw = Math.sin(time * 2 * Math.PI * 2);\nvar sharp = Math.pow(Math.abs(raw), 0.3) * (raw < 0 ? -1 : 1);\nvar s = 100 + sharp * 10;\n[s, s]",
        buildCode: function (params: any) {
          return (
            "var raw = Math.sin(time * " +
            params.freq +
            " * Math.PI * 2);\nvar sharp = Math.pow(Math.abs(raw), 0.3) * (raw < 0 ? -1 : 1);\nvar s = 100 + sharp * " +
            params.amp +
            ";\n[s, s]"
          );
        },
      },
      {
        name: "Heartbeat",
        description: "Double-beat heart rhythm (Works at 100% scale)",
        targets: ["scale"],
        params: [
          {
            name: "bpm",
            label: "BPM",
            min: 60,
            max: 120,
            default: 72,
            step: 1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 10,
            max: 25,
            default: 15,
            step: 1,
          },
        ],
        code: "var t = time * 72 / 60;\nvar b1 = Math.pow(Math.max(0, Math.sin(t * Math.PI)), 12);\nvar b2 = Math.pow(Math.max(0, Math.sin((t + 0.3) * Math.PI)), 12) * 0.6;\nvar beat = Math.max(b1, b2);\nvar s = 100 + beat * 15;\n[s, s]",
        buildCode: function (params: any) {
          return (
            "var t = time * " +
            params.bpm +
            " / 60;\nvar b1 = Math.pow(Math.max(0, Math.sin(t * Math.PI)), 12);\nvar b2 = Math.pow(Math.max(0, Math.sin((t + 0.3) * Math.PI)), 12) * 0.6;\nvar beat = Math.max(b1, b2);\nvar s = 100 + beat * " +
            params.amp +
            ";\n[s, s]"
          );
        },
      },
      {
        name: "Pop In",
        description: "Quick pop-in with slight overshoot (Works at 100% scale)",
        targets: ["scale"],
        params: [
          {
            name: "dur",
            label: "Duration",
            min: 0.2,
            max: 0.5,
            default: 0.3,
            step: 0.05,
          },
          {
            name: "overshoot",
            label: "Overshoot",
            min: 1.05,
            max: 1.2,
            default: 1.1,
            step: 0.05,
          },
        ],
        code: "var dur = 0.3; var overshoot = 1.1; var settle = 0.2; var t = time - inPoint; var s; if (t < dur) { s = ease(t, 0, dur, 0, 100 * overshoot); } else if (t < dur + settle) { s = ease(t, dur, dur + settle, 100 * overshoot, 100); } else { s = 100; } [s, s]",
        buildCode: function (params: any) {
          var overshootScale = params.overshoot * 100;
          return (
            "var dur = " +
            params.dur +
            "; var overshoot = " +
            params.overshoot +
            "; var settle = 0.2; var t = time - inPoint; var s; if (t < dur) { s = ease(t, 0, dur, 0, " +
            overshootScale +
            "); } else if (t < dur + settle) { s = ease(t, dur, dur + settle, " +
            overshootScale +
            ", 100); } else { s = 100; } [s, s]"
          );
        },
      },
      {
        name: "Jelly",
        description:
          "Continuous jelly wobble - never stops (Works at 100% scale)",
        targets: ["scale"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 3,
            max: 8,
            default: 5,
            step: 1,
          },
          {
            name: "ampX",
            label: "Amp X",
            min: 3,
            max: 10,
            default: 5,
            step: 1,
          },
          {
            name: "ampY",
            label: "Amp Y",
            min: 3,
            max: 10,
            default: 7,
            step: 1,
          },
        ],
        code: "var t = time - inPoint;\nvar sx = 100 + Math.sin(t * 5 * Math.PI * 2) * 5;\nvar sy = 100 - Math.sin(t * 5 * Math.PI * 2) * 7;\n[sx, sy]",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint;\nvar sx = 100 + Math.sin(t * " +
            params.freq +
            " * Math.PI * 2) * " +
            params.ampX +
            ";\nvar sy = 100 - Math.sin(t * " +
            params.freq +
            " * Math.PI * 2) * " +
            params.ampY +
            ";\n[sx, sy]"
          );
        },
      },
      {
        name: "Spin",
        description: "Continuous rotation",
        targets: ["rotation"],
        params: [
          {
            name: "speed",
            label: "Degrees/sec",
            min: 30,
            max: 360,
            default: 90,
            step: 30,
          },
        ],
        code: "time * 90",
        buildCode: function (params: any) {
          return "time * " + params.speed;
        },
      },
      {
        name: "Look At",
        description: "Layer rotates smoothly as if tracking a moving target.",
        targets: ["rotation"],
        params: [
          {
            name: "speed",
            label: "Speed",
            min: 0.1,
            max: 3,
            default: 1,
            step: 0.1,
          },
          {
            name: "range",
            label: "Range",
            min: 5,
            max: 90,
            default: 30,
            step: 5,
          },
          {
            name: "random",
            label: "Random",
            min: 0,
            max: 100,
            default: 0,
            step: 5,
          },
        ],
        code: "var spd = 1;\nvar rng = 30;\nvar rnd = 0;\nvar t = time * spd;\nvar pi2 = Math.PI * 2;\nvar tx = Math.cos(t * pi2) * 80;\nvar ty = Math.sin(t * pi2 * 2) * 40;\nvar smooth = Math.atan2(ty, tx) * (180 / Math.PI) * (rng / 90);\nvar blend = rnd / 100;\nif (blend > 0) {\n    var w = wiggle(spd * 2, rng, 3, 0.5) - value;\n    value + smooth * (1 - blend) + w * blend;\n} else {\n    value + smooth;\n}",
        buildCode: function (params: any) {
          return (
            "var spd = " +
            params.speed +
            ";\nvar rng = " +
            params.range +
            ";\nvar rnd = " +
            params.random +
            ";\nvar t = time * spd;\nvar pi2 = Math.PI * 2;\nvar tx = Math.cos(t * pi2) * 80;\nvar ty = Math.sin(t * pi2 * 2) * 40;\nvar smooth = Math.atan2(ty, tx) * (180 / Math.PI) * (rng / 90);\nvar blend = rnd / 100;\nif (blend > 0) {\n    var w = wiggle(spd * 2, rng, 3, 0.5) - value;\n    value + smooth * (1 - blend) + w * blend;\n} else {\n    value + smooth;\n}"
          );
        },
      },
      {
        name: "Throw",
        description: "Constant velocity movement",
        targets: ["position"],
        params: [
          {
            name: "velocityX",
            label: "Velocity X",
            min: -500,
            max: 500,
            default: 100,
            step: 50,
          },
          {
            name: "velocityY",
            label: "Velocity Y",
            min: -500,
            max: 500,
            default: -50,
            step: 50,
          },
        ],
        code: "value + [100, -50] * (time - inPoint)",
        buildCode: function (params: any) {
          return (
            "value + [" +
            params.velocityX +
            ", " +
            params.velocityY +
            "] * (time - inPoint)"
          );
        },
      },
      {
        name: "Orbit",
        description: "Circular orbit around center",
        targets: ["position"],
        params: [
          {
            name: "radius",
            label: "Radius",
            min: 50,
            max: 300,
            default: 200,
            step: 25,
          },
          {
            name: "speed",
            label: "Speed",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.5,
          },
        ],
        code: "var cx = thisComp.width / 2;\nvar cy = thisComp.height / 2;\nvar angle = time * 1 * Math.PI * 2;\n[cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200]",
        buildCode: function (params: any) {
          return (
            "var cx = thisComp.width / 2;\nvar cy = thisComp.height / 2;\nvar angle = time * " +
            params.speed +
            " * Math.PI * 2;\n[cx + Math.cos(angle) * " +
            params.radius +
            ", cy + Math.sin(angle) * " +
            params.radius +
            "]"
          );
        },
      },
    ],

    effects: [
      {
        name: "Sine Wave",
        description: "Classic smooth oscillation",
        targets: ["rotation", "opacity"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 10,
            max: 100,
            default: 30,
            step: 1,
          },
        ],
        code: "value + Math.sin(time * 2 * Math.PI * 2) * 30",
        buildCode: function (params: any) {
          return (
            "value + Math.sin(time * " +
            params.freq +
            " * Math.PI * 2) * " +
            params.amp
          );
        },
      },
      {
        name: "Square Wave",
        description: "Flat-top alternating pulse with adjustable duty cycle",
        targets: ["rotation", "opacity"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 5,
            default: 2,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 10,
            max: 100,
            default: 30,
            step: 1,
          },
          {
            name: "duty",
            label: "Duty Cycle",
            min: 0.1,
            max: 0.9,
            default: 0.5,
            step: 0.1,
          },
        ],
        code: "var t = time - inPoint;\nvar phase = (t * 2) % 1;\nvalue + (phase < 0.5 ? 1 : -1) * 30",
        buildCode: function (params: any) {
          return (
            "var t = time - inPoint;\nvar phase = (t * " +
            params.freq +
            ") % 1;\nvalue + (phase < " +
            params.duty +
            " ? 1 : -1) * " +
            params.amp
          );
        },
      },
      {
        name: "Float / Hover",
        description: "Gentle floating up and down",
        targets: ["position"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.3,
            max: 1,
            default: 0.5,
            step: 0.1,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 5,
            max: 50,
            default: 15,
            step: 1,
          },
        ],
        code: "var y = Math.sin(time * 0.5 * Math.PI * 2) * 15; value + [0, y]",
        buildCode: function (params: any) {
          return (
            "var y = Math.sin(time * " +
            params.freq +
            " * Math.PI * 2) * " +
            params.amp +
            "; value + [0, y]"
          );
        },
      },
      {
        name: "Pendulum",
        description: "Swinging motion with optional decay",
        targets: ["rotation"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.5,
          },
          {
            name: "amp",
            label: "Amplitude",
            min: 10,
            max: 45,
            default: 30,
            step: 1,
          },
          {
            name: "decay",
            label: "Decay",
            min: 0,
            max: 3,
            default: 0.5,
            step: 0.1,
          },
        ],
        code: "var arc = time - inPoint;\nvar swing = Math.sin(arc * 2 * Math.PI);\nvar damping = Math.pow(Math.E, -0.5 * arc);\n30 * swing * damping",
        buildCode: function (params: any) {
          return (
            "var arc = time - inPoint;\nvar swing = Math.sin(arc * " +
            params.freq +
            " * 2 * Math.PI);\nvar damping = Math.pow(Math.E, -" +
            params.decay +
            " * arc);\n" +
            params.amp +
            " * swing * damping"
          );
        },
      },
      {
        name: "Pulse Opacity",
        description: "Smooth glowing pulse",
        targets: ["opacity"],
        params: [
          {
            name: "freq",
            label: "Frequency",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.5,
          },
          {
            name: "minOp",
            label: "Min Opacity",
            min: 40,
            max: 70,
            default: 60,
            step: 5,
          },
          {
            name: "maxOp",
            label: "Max Opacity",
            min: 80,
            max: 100,
            default: 100,
            step: 5,
          },
        ],
        code: "var mid = (100 + 60) / 2; var amp = (100 - 60) / 2; mid + Math.sin(time * 1 * Math.PI * 2) * amp",
        buildCode: function (params: any) {
          return (
            "var mid = (" +
            params.maxOp +
            " + " +
            params.minOp +
            ") / 2; var amp = (" +
            params.maxOp +
            " - " +
            params.minOp +
            ") / 2; mid + Math.sin(time * " +
            params.freq +
            " * Math.PI * 2) * amp"
          );
        },
      },
    ],

    glitch: [
      {
        name: "Glitch Position",
        description:
          "3-tier digital glitch: small vibration, medium jump, or large teleport",
        targets: ["position"],
        params: [
          {
            name: "intensity",
            label: "Intensity",
            min: 10,
            max: 100,
            default: 30,
            step: 5,
          },
          {
            name: "frequency",
            label: "Frequency",
            min: 2,
            max: 20,
            default: 8,
            step: 1,
          },
        ],
        code: "var i = 30;\nvar f = 8;\nvar seg = Math.floor(time * f);\nseedRandom(seg, true);\nvar r = random();\nif (r > 0.85) {\n    value + [random(-i * 2, i * 2), random(-i, i)];\n} else if (r > 0.55) {\n    value + [random(-i * 0.3, i * 0.3), random(-i * 0.15, i * 0.15)];\n} else {\n    value;\n}",
        buildCode: function (params: any) {
          return (
            "var i = " +
            params.intensity +
            ";\nvar f = " +
            params.frequency +
            ";\nvar seg = Math.floor(time * f);\nseedRandom(seg, true);\nvar r = random();\nif (r > 0.85) {\n    value + [random(-i * 2, i * 2), random(-i, i)];\n} else if (r > 0.55) {\n    value + [random(-i * 0.3, i * 0.3), random(-i * 0.15, i * 0.15)];\n} else {\n    value;\n}"
          );
        },
      },
      {
        name: "Signal Noise",
        description:
          "Digital interference — high-freq noise on position + opacity dropout with scanline jumps",
        targets: ["position", "opacity"],
        params: [
          {
            name: "noiseAmount",
            label: "Noise Amount",
            min: 5,
            max: 50,
            default: 20,
            step: 5,
          },
          {
            name: "speed",
            label: "Speed",
            min: 5,
            max: 30,
            default: 15,
            step: 1,
          },
        ],
        code: "var n = 20;\nvar s = 15;\nvar m = thisComp.width / 640;\nvar seg = Math.floor(time * s);\nseedRandom(seg, true);\nvar prop = thisProperty.name.toLowerCase();\nif (prop.indexOf('position') >= 0) {\n    var nx = random(-n, n) * m;\n    var ny = random(-n * 0.3, n * 0.3) * m;\n    if (random() > 0.9) ny = random(-n * 2, n * 2) * m;\n    value + [nx, ny];\n} else {\n    var noise = random(100 - n, 100);\n    if (random() > 0.95) noise = random(20, 60);\n    noise;\n}",
        buildCode: function (params: any) {
          return (
            "var n = " +
            params.noiseAmount +
            ";\nvar s = " +
            params.speed +
            ";\nvar m = thisComp.width / 640;\nvar seg = Math.floor(time * s);\nseedRandom(seg, true);\nvar prop = thisProperty.name.toLowerCase();\nif (prop.indexOf('position') >= 0) {\n    var nx = random(-n, n) * m;\n    var ny = random(-n * 0.3, n * 0.3) * m;\n    if (random() > 0.9) ny = random(-n * 2, n * 2) * m;\n    value + [nx, ny];\n} else {\n    var noise = random(100 - n, 100);\n    if (random() > 0.95) noise = random(20, 60);\n    noise;\n}"
          );
        },
      },
      {
        name: "Data Corrupt",
        description:
          "Full system corruption — position, scale, rotation and opacity all glitch randomly with blackout chance",
        targets: ["position", "scale", "rotation", "opacity"],
        params: [
          {
            name: "corruptLevel",
            label: "Corrupt Level",
            min: 10,
            max: 80,
            default: 30,
            step: 5,
          },
          {
            name: "blockSize",
            label: "Block Size",
            min: 2,
            max: 12,
            default: 6,
            step: 1,
          },
        ],
        code: "var c = 30;\nvar b = 6;\nvar seg = Math.floor(time * b);\nseedRandom(seg + index, true);\nvar r = random();\nvar prop = thisProperty.name.toLowerCase();\nif (r > 0.75) {\n    var glitch = random(-c, c);\n    if (prop.indexOf('scale') >= 0) {\n        value + [glitch, -glitch * 0.5];\n    } else if (prop.indexOf('rotation') >= 0 || prop.indexOf('rot') >= 0) {\n        value + glitch * 0.5;\n    } else if (prop.indexOf('opacity') >= 0 || prop.indexOf('opac') >= 0) {\n        if (r > 0.95) 0;\n        else random(50, 100);\n    } else {\n        value + [glitch, glitch * 0.3];\n    }\n} else {\n    value;\n}\n",
        buildCode: function (params: any) {
          return (
            "var c = " +
            params.corruptLevel +
            ";\nvar b = " +
            params.blockSize +
            ";\nvar seg = Math.floor(time * b);\nseedRandom(seg + index, true);\nvar r = random();\nvar prop = thisProperty.name.toLowerCase();\nif (r > 0.75) {\n    var glitch = random(-c, c);\n    if (prop.indexOf('scale') >= 0) {\n        value + [glitch, -glitch * 0.5];\n    } else if (prop.indexOf('rotation') >= 0 || prop.indexOf('rot') >= 0) {\n        value + glitch * 0.5;\n    } else if (prop.indexOf('opacity') >= 0 || prop.indexOf('opac') >= 0) {\n        if (r > 0.95) 0;\n        else random(50, 100);\n    } else {\n        value + [glitch, glitch * 0.3];\n    }\n} else {\n    value;\n}"
          );
        },
      },
    ],
  };

  interface Param {
    name: string;
    label: string;
    min: number;
    max: number;
    default: number;
    step: number;
    currentValue?: number;
  }

  interface ExpressionDef {
    id: string;
    name: string;
    description: string;
    category: string;
    targets: string[];
    params: Param[];
    code: string;
    buildCode?: (params: any) => string;
    isCustom?: boolean;
  }

  function normalizeExpression(exp: any): ExpressionDef {
    const params = Array.isArray(exp?.params)
      ? exp.params.map((p: any) => ({
          name: String(p?.name ?? "value"),
          label: String(p?.label ?? "Slider"),
          min: Number(p?.min ?? 0),
          max: Number(p?.max ?? 100),
          default: Number(p?.default ?? 0),
          step: Number(p?.step ?? 1),
          currentValue: p?.currentValue ?? p?.default ?? p?.value ?? 0,
        }))
      : [];

    const safeName = String(exp?.name ?? "Untitled");
    const safeDescription = String(exp?.description ?? "");

    return {
      id: String(
        exp?.id ??
          `${safeName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`,
      ),
      name: safeName,
      description: safeDescription,
      category: String(exp?.category ?? "custom"),
      targets: Array.isArray(exp?.targets) ? exp.targets.map(String) : ["any"],
      params,
      code: String(exp?.code ?? ""),
      buildCode:
        typeof exp?.buildCode === "function" ? exp.buildCode : undefined,
      isCustom: !!exp?.isCustom,
    };
  }

  const categories = [
    { id: "all", name: "All Scripts" },
    { id: "textanimator", name: "Text Animator" },
    { id: "text", name: "Text" },
    { id: "motion", name: "Motion" },
    { id: "physics", name: "Physics" },
    { id: "transform", name: "Transform" },
    { id: "effects", name: "Effects" },
    { id: "glitch", name: "Glitch" },
    { id: "custom", name: "Custom" },
  ];

  let allExpressions: ExpressionDef[] = [];
  let currentCategory = "all";
  let searchQuery = "";
  let showFavoritesOnly = false;
  let viewMode: "library" | "editor" = "library";
  let scriptParameterValues: Record<
    string,
    Record<string, number>
  > = getPreference("scriptsParameterValues") ?? {};

  let saveParameterTimeout: ReturnType<typeof setTimeout>;

  let expandedExpId: string | null = null;
  let newExp: ExpressionDef = getEmptyCustomExp();

  onMount(() => {
    let baseLib: ExpressionDef[] = [];

    if (typeof expressionLibrary !== "undefined") {
      for (const [catName, expArray] of Object.entries(expressionLibrary)) {
        if (Array.isArray(expArray)) {
          expArray.forEach((exp: any) => {
            baseLib.push(
              normalizeExpression({
                ...exp,
                id: `${String(exp?.name ?? "untitled")
                  .replace(/\s+/g, "_")
                  .toLowerCase()}_${catName}`,
                category: catName,
                isCustom: false,
              }),
            );
          });
        }
      }
    }

    let customExps = getPreference("scriptsCustomExpressions") ?? [];
    const legacySaved = localStorage.getItem("ek_custom_expressions");
    if (
      (!Array.isArray(customExps) || customExps.length === 0) &&
      legacySaved
    ) {
      try {
        customExps = JSON.parse(legacySaved);
        setPreference("scriptsCustomExpressions", customExps);
        localStorage.removeItem("ek_custom_expressions");
      } catch (error) {
        customExps = [];
      }
    }
    allExpressions = [
      ...baseLib,
      ...((Array.isArray(customExps) ? customExps : []) as any[]).map(
        normalizeExpression,
      ),
    ].map((exp) => {
      const savedValues = scriptParameterValues[exp.id] ?? {};
      exp.params = exp.params.map((param) => ({
        ...param,
        currentValue:
          savedValues[param.name] ?? param.currentValue ?? param.default,
      }));
      return exp;
    });
  });

  $: filteredExpressions = allExpressions.filter((exp) => {
    const safeExp = normalizeExpression(exp);
    const matchCat =
      currentCategory === "all" ||
      safeExp.category === currentCategory ||
      (currentCategory === "custom" && safeExp.isCustom);
    const safeQuery = searchQuery.trim().toLowerCase();
    const matchSearch =
      !safeQuery ||
      safeExp.name.toLowerCase().includes(safeQuery) ||
      safeExp.description.toLowerCase().includes(safeQuery);

    const favs = $scriptFavoriteExpressions || {};
    const matchFavorite = showFavoritesOnly ? favs[safeExp.id] : true;

    return matchCat && matchSearch && matchFavorite;
  });

  function toggleExpand(id: string) {
    expandedExpId = expandedExpId === id ? null : id;
  }

  function toggleShowFavorites() {
    showFavoritesOnly = !showFavoritesOnly;
  }

  function toggleFavorite(id: string, event?: MouseEvent) {
    if (event && event.button !== 0) return;
    event?.stopPropagation();

    try {
      scriptFavoriteExpressions.update((currentFavs) => {
        const updated = { ...(currentFavs || {}) };
        if (updated[id]) {
          delete updated[id];
        } else {
          updated[id] = true;
        }
        return updated;
      });
    } catch (err) {
      console.error("Store update failed", err);
    }
  }

  function getGeneratedCode(exp: ExpressionDef): string {
    const safeExp = normalizeExpression(exp);
    const paramValues: any = {};
    (safeExp.params || []).forEach((p) => {
      paramValues[p.name] =
        p.currentValue !== undefined ? p.currentValue : p.default;
    });

    if (safeExp.isCustom) {
      let generated = safeExp.code;
      (safeExp.params || []).forEach((p) => {
        const regex = new RegExp(`{{${p.name}}}`, "g");
        generated = generated.replace(
          regex,
          String(paramValues[p.name] ?? p.default ?? 0),
        );
      });
      return generated;
    } else if (safeExp.buildCode) {
      return safeExp.buildCode(paramValues);
    }
    return safeExp.code;
  }

  function persistParameterValue(exp: ExpressionDef, param: Param) {
    scriptParameterValues = {
      ...scriptParameterValues,
      [exp.id]: {
        ...(scriptParameterValues[exp.id] ?? {}),
        [param.name]: Number(param.currentValue ?? param.default),
      },
    };
    clearTimeout(saveParameterTimeout);
    saveParameterTimeout = setTimeout(() => {
      setPreference("scriptsParameterValues", scriptParameterValues);
    }, 250);
  }

  async function applyToAE(exp: ExpressionDef) {
    const finalCode = getGeneratedCode(exp);
    try {
      const resultStr = await evalTS("applyExpressionToSelected", finalCode);
      const result = JSON.parse(resultStr as string);

      if (result.success && result.count > 0) {
        sendNotif(`Applied to ${result.count} property(ies)`, true);
      } else if (result.success && result.count === 0) {
        sendNotif("Select a property in AE first!", false);
      } else {
        sendNotif(result.error, false);
      }
    } catch (err) {
      sendNotif("Connection error with AE", false);
    }
  }

  function getEmptyCustomExp(): ExpressionDef {
    return {
      id: "custom_" + Date.now(),
      name: "",
      category: "custom",
      description: "",
      targets: ["any"],
      params: [],
      code: "",
      isCustom: true,
    };
  }

  function addParam() {
    newExp.params = [
      ...newExp.params,
      {
        name: "value",
        label: "Slider",
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        currentValue: 50,
      },
    ];
  }

  function removeParam(idx: number) {
    newExp.params = newExp.params.filter((_, i) => i !== idx);
  }

  function saveCustomExp() {
    if (!newExp.name || !newExp.code) {
      sendNotif("Name and Code are required", false);
      return;
    }
    allExpressions = [newExp, ...allExpressions];
    const customOnly = allExpressions.filter((e) => e.isCustom);
    setPreference("scriptsCustomExpressions", customOnly);

    sendNotif("Custom Script saved!", true);
    viewMode = "library";
    newExp = getEmptyCustomExp();
    currentCategory = "custom";
    expandedExpId = null;
  }

  function openCustomCreator() {
    newExp = getEmptyCustomExp();
    viewMode = "editor";
  }

  function closeCustomCreator() {
    viewMode = "library";
    newExp = getEmptyCustomExp();
  }

  function deleteExp(id: string) {
    if (confirm("Delete this custom script?")) {
      allExpressions = allExpressions.filter((e) => e.id !== id);

      try {
        scriptFavoriteExpressions.update((currentFavs) => {
          const updated = { ...(currentFavs || {}) };
          delete updated[id];
          return updated;
        });
      } catch (e) {}

      const customOnly = allExpressions.filter((e) => e.isCustom);
      setPreference("scriptsCustomExpressions", customOnly);
      sendNotif("Script deleted", true);
    }
  }
</script>

<div class="wrapper">
  <div class="view-slide" in:fly={{ x: -60, duration: $TRANSITION_MS || 300 }}>
    {#if viewMode === "library"}
      <div class="panel-view">
        <div class="panel-header">
          <div class="header-title">
            <h1>{$t("Scripts Library")}</h1>
            <div class="header-actions">
              <button
                type="button"
                class="icon-btn fav-btn"
                class:active={showFavoritesOnly}
                on:click={toggleShowFavorites}
                title={$t(showFavoritesOnly ? "Showing Favorites" : "Show All")}
              >
                <!-- Lecture du store sécurisée -->
                <svg
                  viewBox="0 0 24 24"
                  fill={showFavoritesOnly ? "#ffd34e" : "none"}
                  stroke={showFavoritesOnly ? "#ffd34e" : "#888"}
                  stroke-width="2"
                  style="width:18px; height:18px;"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="add-new-btn"
                style="width: auto; padding: 0 10px;"
                on:click={openCustomCreator}
              >
                {$t("New Script")}
              </button>
            </div>
          </div>
        </div>
        <div class="normal_underline"></div>

        <!-- FILTRES : Catégorie + Recherche -->
        <div class="row-select" style="margin-bottom: 5px; gap: 8px;">
          <select
            class="native-select"
            bind:value={currentCategory}
            style="flex: 0 0 125px;"
          >
            {#each categories as cat}
              <option value={cat.id}>{$t(cat.name)}</option>
            {/each}
          </select>
          <input
            type="text"
            class="search-input"
            bind:value={searchQuery}
            placeholder={$t("Search scripts...")}
            style="margin: 0;"
          />
        </div>
        <div class="scroll-area">
          {#if filteredExpressions.length === 0}
            <div class="empty-state">
              {$t("No scripts match your criteria.")}
            </div>
          {:else}
            <!-- Liste plate et réactive -->
            <div class="fx-list" style="margin-bottom: 15px;">
              {#each filteredExpressions as exp (exp.id)}
                <div class="fx-card" class:expanded={expandedExpId === exp.id}>
                  <div class="fx-card-head">
                    <!-- 1) Bouton principal : APPLIQUER LE SCRIPT -->
                    <button
                      type="button"
                      class="fx-apply-btn"
                      on:click={() => applyToAE(exp)}
                      title={$t("Apply Script")}
                    >
                      <span class="fx-copy">
                        <span class="fx-name">{$t(exp.name)}</span>
                        <span class="fx-sub">
                          {exp.description
                            ? $t(exp.description)
                            : $t("Custom script")}
                        </span>
                      </span>
                    </button>

                    <!-- 2) Bouton settings : DÉROULER LES PARAMÈTRES -->
                    <button
                      type="button"
                      class="settings-btn"
                      on:click={() => toggleExpand(exp.id)}
                      title={$t("Modify Settings")}
                    >
                      <span
                        class="fx-chevron"
                        class:expanded={expandedExpId === exp.id}
                      ></span>
                    </button>

                    <!-- 3) Bouton favoris : METTRE EN FAVORIS -->
                    <button
                      type="button"
                      class="remove-btn"
                      on:click|stopPropagation={(e) =>
                        toggleFavorite(exp.id, e)}
                      title={$t("Favorite")}
                    >
                      <!-- Lecture du store sécurisée -->
                      <svg
                        viewBox="0 0 24 24"
                        fill={($scriptFavoriteExpressions || {})[exp.id]
                          ? "#ffd34e"
                          : "none"}
                        stroke={($scriptFavoriteExpressions || {})[exp.id]
                          ? "#ffd34e"
                          : "#888"}
                        stroke-width="2"
                        style="width:16px; height:16px;"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- CONTENU DES PARAMÈTRES -->
                  {#if expandedExpId === exp.id}
                    <div class="fx-settings block-params">
                      {#if exp.params && exp.params.length > 0}
                        {#each exp.params as p}
                          <div class="fx-field">
                            <label for={`slider-${exp.id}-${p.name}`}>
                              {$t(p.label)}
                              <span class="fx-value">
                                {p.currentValue !== undefined
                                  ? p.currentValue
                                  : p.default}
                              </span>
                            </label>
                            <input
                              id={`slider-${exp.id}-${p.name}`}
                              class="fx-slider"
                              type="range"
                              min={p.min}
                              max={p.max}
                              step={p.step}
                              bind:value={p.currentValue}
                              on:input={() => persistParameterValue(exp, p)}
                            />
                          </div>
                        {/each}
                      {/if}

                      <div class="fx-code-preview" style="grid-column: 1 / -1;">
                        {getGeneratedCode(exp)}
                      </div>

                      <div
                        class="row-select"
                        style="grid-column: 1 / -1; width: 100%; gap: 8px; margin-top: 5px;"
                      >
                        <button
                          type="button"
                          class="render-btn"
                          on:click={() => applyToAE(exp)}
                        >
                          {$t("Apply Script")}
                        </button>
                        {#if exp.isCustom}
                          <button
                            type="button"
                            class="render-btn danger-btn"
                            on:click={() => deleteExp(exp.id)}
                          >
                            {$t("Delete")}
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <!-- VUE ÉDITEUR CUSTOM -->
    {:else if viewMode === "editor"}
      <div class="panel-view">
        <div class="panel-header">
          <div class="header-title">
            <h1>{$t("Create Custom Script")}</h1>
            <button
              type="button"
              class="back-btn"
              on:click={closeCustomCreator}
            >
              {$t("Cancel")}
            </button>
          </div>
          <div class="normal_underline"></div>
        </div>

        <div class="scroll-area" style="padding-top: 10px;">
          <div class="editor-form">
            <div class="param-grid" style="grid-template-columns: 1fr 140px;">
              <label class="num-field">
                <span>{$t("Name")}</span>
                <input
                  class="num-input"
                  type="text"
                  bind:value={newExp.name}
                  placeholder={$t("My Script Name")}
                />
              </label>

              <label class="num-field">
                <span>{$t("Category")}</span>
                <select class="native-select" bind:value={newExp.category}>
                  {#each categories.filter((c) => c.id !== "all" && c.id !== "custom") as cat}
                    <option value={cat.id}>{$t(cat.name)}</option>
                  {/each}
                </select>
              </label>

              <label class="num-field" style="grid-column: 1 / -1;">
                <span>{$t("Description")}</span>
                <input
                  class="num-input"
                  type="text"
                  bind:value={newExp.description}
                  placeholder={$t(
                    "Short description of what the script does...",
                  )}
                />
              </label>
            </div>

            <div
              class="cat-header"
              style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; border-bottom: 1px solid #333; padding-bottom: 5px;"
            >
              <h4 style="font-size: 14px; color: #fff;">{$t("Variables")}</h4>
              <button
                type="button"
                class="add-new-var"
                aria-label={$t("Add parameter")}
                on:click={addParam}
              >
                +
                <img
                  src={Add}
                  alt="Add"
                  style="width: 50px; height: 50px; object-fit: contain;"
                />
              </button>
            </div>

            <div
              class="params-container"
              style="display:flex; flex-direction:column; gap:8px;"
            >
              {#if newExp.params.length === 0}
                <div
                  class="empty-state"
                  style="font-size:12px; margin-top:10px;"
                >
                  {$t("No variables added yet.")}
                </div>
              {/if}
              {#each newExp.params as p, i}
                <div
                  class="param-edit-row"
                  style="background: rgba(0,0,0,0.2); padding: 8px; border: 1px solid #333; border-radius: 4px; display: flex; flex-direction: column; gap: 8px;"
                >
                  <div style="display:flex; gap: 8px;">
                    <input
                      type="text"
                      class="search-input"
                      placeholder={$t("ID (ex: freq)")}
                      bind:value={p.name}
                    />
                    <input
                      type="text"
                      class="search-input"
                      placeholder={$t("Label UI")}
                      bind:value={p.label}
                    />
                    <button
                      type="button"
                      class="remove-btn"
                      aria-label={$t("Remove parameter")}
                      style="height: 28px; width: 28px; background: rgba(224, 85, 85, 0.1);"
                      on:click={() => removeParam(i)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        stroke="#e05555"
                        stroke-width="2"
                        fill="none"
                        style="width:14px; height:14px;"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div style="display:flex; gap: 8px;">
                    <input
                      type="number"
                      class="num-input"
                      placeholder={$t("Min")}
                      bind:value={p.min}
                      title={$t("Minimum")}
                    />
                    <input
                      type="number"
                      class="num-input"
                      placeholder={$t("Max")}
                      bind:value={p.max}
                      title={$t("Maximum")}
                    />
                    <input
                      type="number"
                      class="num-input"
                      placeholder={$t("Def")}
                      bind:value={p.default}
                      on:input={() => (p.currentValue = p.default)}
                      title={$t("Default Value")}
                    />
                  </div>
                </div>
              {/each}
            </div>

            <div
              class="cat-header"
              style="margin-top: 20px; margin-bottom: 5px;"
            >
              <h4 style="font-size: 14px; color: #fff;">{$t("Script Code")}</h4>
            </div>
            <p
              style="font-size:10px; color:#888; margin-top:0; margin-bottom: 8px;"
            >
              {$t("Use")} <b>{"{{variableID}}"}</b>
              {$t("to bind your sliders to the code.")}
            </p>
            <textarea
              class="search-input massive-search"
              style="height: 120px; padding: 10px; font-family: monospace; resize: vertical; margin: 0; width: 100%;"
              bind:value={newExp.code}
              placeholder={"wiggle({{freq}}, {{amp}});"}
            ></textarea>

            <div class="row-select" style="margin-top: 15px; width: 100%;">
              <button type="button" class="render-btn" on:click={saveCustomExp}>
                {$t("Save Custom Script")}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: "Museo Sans", sans-serif;
    overflow: hidden;
  }

  .view-slide {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .panel-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    box-sizing: border-box;
    position: absolute;
    inset: 0;
    min-height: 0;
    overflow: hidden;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .panel-header {
    flex-shrink: 0;
    margin-bottom: 6px;

    .header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-left: 5%;
      margin-right: 5%;
      min-height: 40px;
      min-width: 0;
      gap: 1vh;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    h1 {
      font-size: 18px;
      margin: 0;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .normal_underline {
      height: 0.6vh;
      width: 90%;
      background-color: var(--activeColour, #5bb8d4);
      border-radius: 0.5vh;
      margin: 0 auto 1.35vh auto;
      box-shadow: 0 0 10px var(--activeColour, #5bb8d4);
    }
  }

  .scroll-area {
    flex: 1;
    min-height: 0;
    width: 90%;
    margin-left: 5%;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 16px;
    padding-right: 5px;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgb(37, 37, 37);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--activeColour, #5bb8d4);
      border-radius: 3px;
    }
  }

  .row-select {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 90%;
    margin: 0 auto;
    box-sizing: border-box;
    min-width: 0;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
    color: white;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    outline: none;
    border-radius: 4px;
    box-sizing: border-box;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition:
      background-color 65ms,
      border-color 0.2s;

    &:focus {
      border-color: var(--activeColour, #5bb8d4);
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
    }
  }
  .add-new-var {
    width: 35px;
    height: 35px;
    min-width: 0;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-weight: bold;
    border: transparent;
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.15s ease;
    &:hover {
      transform: scale(1.05);
    }
    &:active {
      transform: scale(0.95);
    }
  }

  .add-new-btn {
    width: 100%;
    flex: 0.8;
    min-width: 0;
    height: 25px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 11px;
    font-weight: bold;
    color: white;
    background-color: #191919;
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.15s ease;

    &:hover {
      background-color: var(--activeColour, #5bb8d4);
      border-style: solid;
      border-color: var(--activeColour, #5bb8d4);
    }
  }

  .render-btn {
    width: 100%;
    flex: 1;
    min-width: 0;
    height: 25px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 11px;
    font-weight: bold;
    color: white;
    background-color: var(--activeColour, #5bb8d4);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    text-shadow: 3px 2px 5px rgba(0, 0, 0, 1);
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      background-color: #191919;
      border-style: solid;
    }
    &.danger-btn {
      background-color: #381b1b;
      border-color: #e05555;
      color: #e05555;
      max-width: 80px;
      &:hover {
        background-color: #e05555;
        color: white;
      }
    }
  }

  .back-btn {
    background: #333;
    border: 1px solid #555;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: clamp(0.8rem, 1.5vh, 1.3rem);
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    flex-shrink: 0;

    &:hover {
      background: var(--activeColour, #5bb8d4);
      border-color: var(--activeColour, #5bb8d4);
    }
  }

  .icon-btn {
    background: transparent;
    border: none;
    outline: none;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    padding: 0;

    &:hover {
      transform: scale(1.1);
    }
    &.active svg {
      filter: drop-shadow(0 0 4px rgba(255, 211, 78, 0.5));
    }
  }

  .settings-btn {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .cat-header {
    margin-top: 0.5vh;
    margin-bottom: 1.5vh;
    min-width: 0;
    h4 {
      margin: 0;
      font-size: 3vh;
      color: #c1c1c1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .fx-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .fx-card {
    background: #191919;
    border: 2px solid #383838;
    border-radius: 5px;
    overflow: hidden;
    min-width: 0;
    flex-shrink: 0;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      border-color: #666;
    }
    &.expanded {
      border-color: var(--activeColour, #5bb8d4);
      background-color: #1d1d1d;
    }
  }

  .fx-card-head {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 42px;
    padding: 2px 5px 2px 8px;
    gap: 4px;
  }

  .fx-apply-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    overflow: hidden;

    &:focus-visible {
      outline: 1px solid var(--activeColour, #5bb8d4);
      outline-offset: 2px;
    }
  }

  .fx-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .fx-chevron {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    margin: 0;
    border-right: 2px solid #b0b0b0;
    border-bottom: 2px solid #b0b0b0;
    transform: rotate(45deg);
    transition: transform 0.15s ease;

    &.expanded {
      transform: rotate(225deg);
    }
  }

  .fx-name {
    display: block;
    width: 100%;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fx-sub {
    display: block;
    width: 100%;
    font-size: 9px;
    color: #b0b0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-btn {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
    &:active {
      transform: scale(0.95);
    }
  }

  .block-params {
    padding: 12px;
    border-top: 2px solid #383838;
  }

  .fx-settings {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 12px;
    min-width: 0;
  }

  .fx-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    min-width: 0;

    label {
      font-size: 10px;
      font-weight: 700;
      color: #ccc;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1vh;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fx-value {
      font-size: 12px;
      color: var(--activeColour, #5bb8d4);
      font-weight: 800;
      flex-shrink: 0;
    }
  }

  .fx-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 7px;
    border-radius: 2.5px;
    outline: none;
    cursor: pointer;
    border: 1px solid #000;
    display: block;
    background: var(--activeColour, #5bb8d4);

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 9px;
      border-radius: 2px;
      background: #fff;
      border: 1px solid #000;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
      cursor: pointer;
      margin-top: -2px;
    }
  }

  .fx-code-preview {
    background: #0a0a0a;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    padding: 6px 8px;
    font-family: "Consolas", monospace;
    font-size: 9px;
    color: #888;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 80px;
    overflow-y: auto;
  }

  .editor-form {
    background: rgba(25, 25, 25, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 15px;
    display: flex;
    flex-direction: column;
  }

  .param-grid {
    display: grid;
    grid-column: 1 / -1;
    gap: 10px;
  }

  .num-field {
    display: flex;
    flex-direction: column;
    gap: 0.5vh;
    min-width: 0;

    span {
      font-size: 11px;
      color: #999;
      font-weight: 700;
    }
  }

  .num-input {
    width: 100%;
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
    background-color: #131313;
    border: 1px solid rgb(65, 65, 65);
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
    outline: none;

    &:focus {
      border-color: var(--activeColour, #5bb8d4);
    }
  }

  .native-select {
    width: 100%;
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
    background-color: #131313;
    border: 1px solid rgb(58, 58, 58);
    border-radius: 4px;
    color: #ecf0f1;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    box-sizing: border-box;
    outline: none;
    appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, #999 50%),
      linear-gradient(135deg, #999 50%, transparent 50%);
    background-position:
      calc(100% - 12px) 55%,
      calc(100% - 7px) 55%;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    transition: border-color 150ms ease;

    &:hover {
      border-color: #777;
    }
    &:focus {
      border-color: var(--activeColour, #5bb8d4);
    }

    option {
      background-color: #191919;
      color: #ecf0f1;
    }
  }

  .empty-state {
    text-align: center;
    color: #777;
    margin-top: 5vh;
    font-size: 3.2vh;
    font-style: italic;
  }
</style>
