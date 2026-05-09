const j = require("../memory/shared/plugin_skill_index.json");
console.log("total:", j.totalCount);
console.log("bySource:", j.bySource);
const ns = {};
const sp = {};
const layoutA = []; // marketplaces/<mp>/plugins/<plugin>
const layoutB = []; // marketplaces/<mp>/external_plugins/<plugin>
const layoutC = []; // rpm/<plugin>
j.skills.forEach((s) => {
  ns[s.namespace] = (ns[s.namespace] || 0) + 1;
  const p = s.sourcePath.replace(/\\/g, "/");
  let prefix;
  if (p.includes("/marketplaces/")) {
    const m = p.match(/marketplaces\/([^/]+)\/(plugins|external_plugins)\/([^/]+)/);
    if (m) {
      prefix = "mkt:" + m[1] + "/" + m[2] + "/" + m[3];
      if (m[2] === "plugins") layoutA.push(s);
      else layoutB.push(s);
    } else prefix = "mkt:?";
  } else if (p.includes("/rpm/")) {
    const m = p.match(/rpm\/([^/]+)/);
    prefix = "rpm:" + (m ? m[1] : "?");
    layoutC.push(s);
  } else prefix = "other";
  sp[prefix] = (sp[prefix] || 0) + 1;
});
console.log("\nNamespaces (" + Object.keys(ns).length + "):");
Object.entries(ns)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(" ", v, k));
console.log("\nSourcePath prefixes (" + Object.keys(sp).length + "):");
Object.entries(sp)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(" ", v, k));
console.log("\nLayout counts:");
console.log("  Layout A (marketplaces/<mp>/plugins):", layoutA.length);
console.log("  Layout B (marketplaces/<mp>/external_plugins):", layoutB.length);
console.log("  Layout C (rpm):", layoutC.length);
console.log("\nLayout B namespaces:");
const lbNs = {};
layoutB.forEach((s) => (lbNs[s.namespace] = (lbNs[s.namespace] || 0) + 1));
Object.entries(lbNs)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(" ", v, k));
console.log("\nLayout A namespaces:");
const laNs = {};
layoutA.forEach((s) => (laNs[s.namespace] = (laNs[s.namespace] || 0) + 1));
Object.entries(laNs)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(" ", v, k));
