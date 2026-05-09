const j = require("../memory/shared/plugin_skill_index.json");
const a = j.skills.filter((s) => s.namespace === "anthropic-skills");
console.log("anthropic-skills count:", a.length);
a.slice(0, 3).forEach((s) => {
  console.log("name:", s.name, "| source:", s.source);
  console.log("  path:", s.sourcePath);
});
console.log("\nAll source values for anthropic-skills:");
const srcs = {};
a.forEach((s) => (srcs[s.source] = (srcs[s.source] || 0) + 1));
console.log(srcs);
