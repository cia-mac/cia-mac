#!/bin/bash
# TidyMac — manual-only Mac check. Run from this folder:  /bin/bash run-macos-tests.sh
# It installs NOTHING and loads NO LaunchAgent. It checks the engine you will
# actually run from ~/.tidymac/tidymac.sh: bash version, syntax, the engine
# safety suite, and (hygiene) that the plist template renders + lints cleanly.
# The 3 installer assertions are intentionally skipped — manual-only never uses
# the installer or launchctl.
set -u
cd "$(dirname "$0")" || exit 1
fail=0

echo "== 1. bash version (expect 3.2.x on stock macOS) =="
/bin/bash --version | head -1

echo "== 2. engine syntax (bash -n tidymac.sh) =="
if /bin/bash -n tidymac.sh; then echo "  OK"; else echo "  FAILED"; fail=1; fi

echo "== 3. engine safety suite (installer tests skipped: manual-only) =="
ENG="$PWD/tidymac.sh" /bin/bash tidymac-tests.sh || fail=1

echo "== 4. plist template renders + lints (hygiene; not loaded in manual mode) =="
if command -v plutil >/dev/null 2>&1; then
  tmp=$(mktemp "${TMPDIR:-/tmp}/tidymac_plist.XXXXXX") || { echo "  mktemp failed"; fail=1; }
  if [ -n "${tmp:-}" ]; then
    awk -v label="com.ciamac.tidymac" \
        -v engine="$HOME/.tidymac/tidymac.sh" \
        -v home="$HOME" '
      { gsub(/\$LABEL/, label); gsub(/\$ENGINE/, engine); gsub(/\$HOME/, home); print }
    ' com.ciamac.tidymac.plist.template > "$tmp"
    if plutil -lint "$tmp"; then echo "  rendered plist OK"; else echo "  plist FAILED"; fail=1; fi
    rm -f "$tmp"
  fi
else
  echo "  (plutil not found — are you on macOS?)"; fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "ALL MAC CHECKS PASSED. Expect: 'SUMMARY: 16 passed, 0 failed' (3 installer tests SKIP)."
  echo "Safe to use TidyMac manually. Next: place the engine + make the Shortcut (see README)."
else
  echo "ONE OR MORE CHECKS FAILED — review the output above before using TidyMac."
fi
exit "$fail"
