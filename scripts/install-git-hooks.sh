#!/bin/sh
# D-187 Phase 3: git hooks·merge driver 설치
# 본 스크립트는 1회 실행 (각 클론·워크트리당). 멱등 — 재실행 안전.
#
# 효과:
#   1. core.hooksPath = .githooks  → repo 공유 hook 활성
#   2. merge.ours.driver = true    → .gitattributes merge=ours 동작
#
# 원복: scripts/uninstall-git-hooks.sh (자동 생성)
#       또는 수동:
#         git config --unset core.hooksPath
#         git config --unset merge.ours.driver

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
GIT_DIR=$(git rev-parse --git-dir)
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$REPO_ROOT/backups/git-config-$TS"

echo "[install-git-hooks] backup → $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp "$GIT_DIR/config" "$BACKUP_DIR/config" 2>/dev/null || echo "  (config 없음, skip)"
if [ -d "$GIT_DIR/hooks" ]; then
  cp -r "$GIT_DIR/hooks" "$BACKUP_DIR/hooks"
fi

# 원복 스크립트 생성
cat > "$BACKUP_DIR/restore.sh" <<'RESTORE'
#!/bin/sh
# 자동 생성된 원복 스크립트
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
GIT_DIR=$(git rev-parse --git-dir)
echo "[restore] core.hooksPath unset"
git config --unset core.hooksPath 2>/dev/null || true
echo "[restore] merge.ours.driver unset"
git config --unset merge.ours.driver 2>/dev/null || true
if [ -d "$HERE/hooks" ]; then
  echo "[restore] hooks/ 복원"
  rm -rf "$GIT_DIR/hooks"
  cp -r "$HERE/hooks" "$GIT_DIR/hooks"
fi
if [ -f "$HERE/config" ]; then
  echo "[restore] config 복원"
  cp "$HERE/config" "$GIT_DIR/config"
fi
echo "[restore] 완료"
RESTORE
chmod +x "$BACKUP_DIR/restore.sh"

echo "[install-git-hooks] core.hooksPath=.githooks"
git config core.hooksPath .githooks

echo "[install-git-hooks] merge.ours.driver=true"
git config merge.ours.driver true

echo ""
echo "[install-git-hooks] 완료"
echo "  hook       : .githooks/pre-commit (main 직커밋 차단)"
echo "  merge=ours : .gitattributes 9종"
echo "  backup     : $BACKUP_DIR"
echo "  원복       : $BACKUP_DIR/restore.sh"
