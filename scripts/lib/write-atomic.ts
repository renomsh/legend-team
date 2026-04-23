// PD-023 P0b — Atomic file write (write-temp + rename)
import * as fs from "fs";
import * as path from "path";

export function writeAtomic(targetPath: string, content: string | Buffer): void {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, targetPath);
}

export function appendAtomicLine(targetPath: string, line: string): void {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const data = line.endsWith("\n") ? line : line + "\n";
  fs.appendFileSync(targetPath, data);
}
