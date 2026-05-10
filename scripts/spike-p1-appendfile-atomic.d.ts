/**
 * spike-p1-appendfile-atomic.ts
 *
 * topic_176 / Arki rev2 §5.2 P1 — appendFile atomic spike.
 *
 * Verifies (a) line size <= PIPE_BUF assumption (b) byte-level atomicity of
 * fs.appendFileSync under multi-child concurrent append on Windows NTFS
 * (POSIX optional via WSL).
 *
 * Matrix: 3 line sizes (0.5KB, 1KB, 5KB) × 2 child counts (5, 10) × 5 rounds.
 * Each child appends 200 lines/round.
 *
 * GATE α': corruptRate < 0.01% AND avgByteSize < 1KB → PASS.
 *
 * Outputs:
 *   reports/2026-05-07_topic_176_arki/spike_p1_appendfile_atomic.json
 *
 * D2 정합: fs.appendFileSync description not trusted; verified by measurement.
 */
export {};
//# sourceMappingURL=spike-p1-appendfile-atomic.d.ts.map