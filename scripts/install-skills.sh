#!/usr/bin/env bash
# Installs the third-party Claude skills this site is built with into .claude/skills/.
# Re-runnable. Third-party packs are gitignored; only our own `portfolio-site` skill is committed.
#   bash scripts/install-skills.sh            # install / refresh
#   bash scripts/install-skills.sh --lock     # also rewrite scripts/skills.lock with the SHAs used
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.claude/skills"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$DEST"
LOCK="$ROOT/scripts/skills.lock"
: > "$TMP/lock"

clone() { # clone <url> <dir>
  git clone -q --depth 1 "$1" "$TMP/$2"
  echo "$1 $(git -C "$TMP/$2" rev-parse HEAD)" >> "$TMP/lock"
}
copyskill() { # copyskill <src-dir> <name>
  rm -rf "$DEST/$2"; cp -R "$1" "$DEST/$2"; echo "  + $2"
}

echo "[1/4] freshtechbro/claudedesignskills (3D, GSAP, scroll, animation)"
clone https://github.com/freshtechbro/claudedesignskills.git cds
for s in threejs-webgl gsap-scrolltrigger modern-web-design web3d-integration-patterns \
         lightweight-3d-effects animejs scroll-reveal-libraries lottie-animations \
         locomotive-scroll barba-js pixijs-2d spline-interactive rive-interactive \
         blender-web-pipeline motion-framer react-three-fiber react-spring-physics \
         animated-component-libraries babylonjs-engine playcanvas-engine aframe-webxr \
         substance-3d-texturing; do
  copyskill "$TMP/cds/.claude/skills/$s" "$s"
done

echo "[2/4] nextlevelbuilder/ui-ux-pro-max-skill (design intelligence)"
clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git uupm
for s in ui-ux-pro-max ui-styling design-system design brand banner-design; do
  copyskill "$TMP/uupm/.claude/skills/$s" "$s"
done

echo "[3/4] viettranx/3dviz-pro-max (3D scenes, capture-and-inspect)"
clone https://github.com/viettranx/3dviz-pro-max.git viz
copyskill "$TMP/viz/skills/3dviz-pro-max" "3dviz-pro-max"

echo "[4/4] awesomeclaude.ai motion-graphics (code-rendered video)"
mkdir -p "$DEST/motion-graphics"
curl -fsSL https://awesomeclaude.ai/claude-motion-graphics-skill.md -o "$DEST/motion-graphics/SKILL.md"
curl -fsSL https://awesomeclaude.ai/claude-video-render.mjs -o "$DEST/motion-graphics/claude-video-render.mjs"
echo "https://awesomeclaude.ai/claude-motion-graphics-skill.md $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$TMP/lock"
echo "  + motion-graphics"

# strip bundled zips / junk
find "$DEST" -name '*.zip' -delete -o -name '.DS_Store' -delete 2>/dev/null || true

# make the same skills visible to other agents (Codex / Kiro read .agents/skills)
mkdir -p "$ROOT/.agents" && ln -sfn ../.claude/skills "$ROOT/.agents/skills"

if [[ "${1:-}" == "--lock" ]]; then cp "$TMP/lock" "$LOCK"; echo "wrote $LOCK"; fi
echo "done: $(ls "$DEST" | wc -l | tr -d ' ') skills in $DEST"
