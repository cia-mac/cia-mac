#!/bin/bash
# Final pre-install gate. Run on the real Mac from the extracted folder:
#   /bin/bash run-macos-tests.sh
# It does NOT install anything. It runs the four checks and renders the plist
# (substituting the $LABEL/$ENGINE/$HOME placeholders) before plutil -lint,
# exactly as the installer would, so the lint matches the installed plist.
set -u
cd "$(dirname "$0")" || exit 1
fail=0

echo "== 1. bash version (expect 3.2.x on stock macOS) =="
/bin/bash --version | head -1

echo "== 2. engine syntax (bash -n) =="
if /bin/bash -n tidymac.sh; then echo "  OK"; else echo "  FAILED"; fail=1; fi

echo "== 3. safety test suite =="
ENG="$PWD/tidymac.sh" INSTALLER="$PWD/install-tidymac.command" /bin/bash tidymac-tests.sh || fail=1

echo "== 4. rendered plist lint =="
if command -v plutil >/dev/null 2>&1; then
  tmp=$(mktemp "${TMPDIR:-/tmp}/hk_plist.XXXXXX") || { echo "  mktemp failed"; fail=1; }
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
  echo "ALL MAC CHECKS PASSED. Expected line above: 'SUMMARY: 19 passed, 0 failed'."
  echo "You may now run the installer:  open install-tidymac.command"
else
  echo "ONE OR MORE CHECKS FAILED — do not run the installer; review the output."
fi
exit "$fail"
