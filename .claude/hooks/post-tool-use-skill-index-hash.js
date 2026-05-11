#!/usr/bin/env node
// PostToolUse hook: plugin_skill_index.json 편집 감지 → sha256 자동 재생성

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INDEX_REL = 'memory/shared/plugin_skill_index.json';
const HASH_REL  = 'memory/shared/plugin_skill_index.sha256';

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw) || {};
    const filePath = (input.tool_input?.file_path || '').replace(/\\/g, '/');

    if (!filePath.endsWith('plugin_skill_index.json')) {
      process.exit(0);
    }

    const cwd = process.cwd();
    const indexPath = path.join(cwd, INDEX_REL);
    const hashPath  = path.join(cwd, HASH_REL);

    if (!fs.existsSync(indexPath)) {
      process.exit(0);
    }

    const buf = fs.readFileSync(indexPath);
    const hex = crypto.createHash('sha256').update(buf).digest('hex');
    fs.writeFileSync(hashPath, hex + '\n', 'utf8');

    process.stdout.write(`[skill-index-hash] sha256 갱신 완료 (${hex.slice(0, 16)}…)\n`);
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[skill-index-hash] error: ${err && err.message}\n`);
    process.exit(0);
  }
});
