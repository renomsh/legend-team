/**
 * Data Loader — fetches JSON/MD files from deployed data directory
 * Legend Team — read-only viewer
 */

const DATA_BASE = './data';

const DataLoader = {
  _cache: {},

  async fetchJSON(path) {
    const key = `json:${path}`;
    if (this._cache[key]) return this._cache[key];
    try {
      const res = await fetch(`${DATA_BASE}/${path}`);
      if (!res.ok) return null;
      const data = await res.json();
      this._cache[key] = data;
      return data;
    } catch (e) {
      console.warn(`[DataLoader] Failed to fetch ${path}:`, e);
      return null;
    }
  },

  async fetchMD(path) {
    const key = `md:${path}`;
    if (this._cache[key]) return this._cache[key];
    try {
      const res = await fetch(`${DATA_BASE}/${path}`);
      if (!res.ok) return null;
      const text = await res.text();
      this._cache[key] = text;
      return text;
    } catch (e) {
      console.warn(`[DataLoader] Failed to fetch ${path}:`, e);
      return null;
    }
  },

  // Core data accessors
  async getManifest() {
    return this.fetchJSON('manifest.json');
  },

  async getTopicIndex() {
    return this.fetchJSON('memory/shared/topic_index.json');
  },

  async getDecisionLedger() {
    return this.fetchJSON('memory/shared/decision_ledger.json');
  },

  async getCurrentSession() {
    return this.fetchJSON('memory/sessions/current_session.json');
  },

  async getProjectCharter() {
    return this.fetchJSON('memory/shared/project_charter.json');
  },

  async getMasterFeedback() {
    return this.fetchJSON('memory/master/master_feedback_log.json');
  },

  async getRoleMemory(role) {
    return this.fetchJSON(`memory/roles/${role}_memory.json`);
  },

  async getReport(reportPath) {
    return this.fetchMD(`reports/${reportPath}`);
  },

  async getGlossary() {
    return this.fetchJSON('memory/shared/glossary.json');
  },

  async getEvidenceIndex() {
    return this.fetchJSON('memory/shared/evidence_index.json');
  },

  // Clear cache (for refresh)
  clearCache() {
    this._cache = {};
  }
};
