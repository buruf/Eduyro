#!/bin/bash
# Lesson-page STEP-QUALITY audit (hardened after the "Do the inverse operation"
# miss): flags (a) known filler phrases, (b) worked-example steps with no
# numbers in them (recipe-talk that shows no actual working), and (c) equation
# lesson pages that never say "both sides". Usage: bash scripts/audit-lesson-steps.sh <dir-of-pdfs>
DIR="${1:-scripts/_audit}"
for pdf in "$DIR"/*.pdf; do
  name=$(basename "$pdf" .pdf)
  txt=$(pdftotext -layout "$pdf" - 2>/dev/null)
  filler=$(printf '%s' "$txt" | grep -ciE "the correct answer is|decide the direction|apply the matching|work through step|do the inverse operation|keep going until")
  # Lesson pages: count numbered step lines with NO digits (≥4 per page = recipe-talk)
  recipe=$(printf '%s' "$txt" | awk '
    BEGIN{RS="\f"; bad=0}
    /WORKED EXAMPLES/{
      n=0; split($0, L, "\n");
      for (i in L) if (match(L[i], /^ *[0-9]\. +[A-Za-z]/)) { s=L[i]; sub(/^ *[0-9]\. +/, "", s); if (s !~ /[0-9]/) n++; }
      if (n >= 4) bad++;
    } END{print bad}')
  # Equation lessons must teach the both-sides principle
  eqmiss=$(printf '%s' "$txt" | awk '
    BEGIN{RS="\f"; IGNORECASE=1; bad=0}
    /WORKED EXAMPLES/ && /Solve for x/ { if ($0 !~ /both sides/i) bad++; } END{print bad}')
  echo "$name fillerPhrases=$filler recipePages=$recipe equationPagesWithoutBothSides=$eqmiss"
done
