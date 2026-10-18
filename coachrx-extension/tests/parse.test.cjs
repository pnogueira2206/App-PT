// Run with: node coachrx-extension/tests/parse.test.cjs
const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.window = {};
eval(fs.readFileSync(path.join(__dirname, "../src/movements.js"), "utf8"));
const P = require("../src/parse.js");

const match = P.buildMatcher(window.CRX.defaultMovements());
const unit = (b) => window.CRX.BUCKETS.find((x) => x.id === b).unit;

function volumes(item) {
  const r = P.blockVolume(item, match, unit);
  const out = { status: r.status };
  for (const [m, v] of r.volumes || []) out[m.name] = Math.round(v * 100) / 100;
  return out;
}

const cases = [
  [{ name: "Ring Muscle-up", description: "5x3", result: "3/3/3/2/3" }, { status: "ok", "Ring Muscle-up": 14 }],
  [{ name: "Toes-to-Bar", description: "3x10", result: "Feito" }, { status: "ok", "Toes-to-Bar": 30 }],
  [{ name: "Toes-to-Bar", description: "3x10", result: "" }, { status: "noResult" }],
  [{ name: "Incline Strict T2B", description: "3x6-7; descanso 1'", result: "7" }, { status: "ok", "Toes-to-Bar": 21 }],
  [{ name: "Strict Pull-Up", description: "4x5-6; rest 1:30", result: "10/10/12/12  x 6" }, { status: "ok", "Pull-up": 24 }],
  [{ name: "Ring Dips", description: "4x5-6; rest 1'", result: "Bw x 6\nMelhor" }, { status: "ok", "Ring Dip": 24 }],
  [{ name: "Strict LRC", description: "EMOM 4’: 1 Strict LRC", result: "Feito" }, { status: "ok", "Legless Rope Climb": 4 }],
  [{ name: "Chinese Row", description: "4x6-8; rest 2'", result: "65 x 8" }, { status: "ignored" }],
  [{ name: "Back Squat", description: "3x5\n*Depois de cada série: 3 Box Jumps", result: "3/3/2/2" }, { status: "ignored" }],
  [{ name: "WOD BM", is_circuit: true, description: "", result: "" }, { status: "ignored" }],
  [{ name: "WOD", is_circuit: true, description: "21-15-9\nThrusters @ 43kg\nPull-ups", result: "8:45" }, { status: "ok", Thruster: 45, "Pull-up": 45 }],
  [{ name: "Metcon", is_circuit: true, description: "AMRAP 12\n10 Burpees\n15 Wall Balls\n200m Run", result: "5+12" }, { status: "ok", Burpee: 60, "Wall Ball": 77, Run: 1 }],
  [{ name: "Engine", is_circuit: true, description: "4x\n500m Row\n20 Cal Bike", result: "done" }, { status: "partial", Row: 2 }],
  [{ name: "Run", description: "5km easy", result: "5,2km" }, { status: "ok", Run: 5.2 }],
  [{ name: "Run", description: "5km easy", result: "30 min" }, { status: "unread" }],
];

let failed = 0;
for (const [item, expected] of cases) {
  try {
    assert.deepStrictEqual(volumes(item), expected);
  } catch (e) {
    failed++;
    console.error(`FAIL ${item.name} / ${JSON.stringify(item.result)}\n  got      ${JSON.stringify(volumes(item))}\n  expected ${JSON.stringify(expected)}`);
  }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
