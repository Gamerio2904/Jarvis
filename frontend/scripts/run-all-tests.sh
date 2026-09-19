#!/usr/bin/env bash
# Alle Testläufe nacheinander. Bricht nicht ab, sondern zählt — sonst verdeckt
# der erste Fehler alles danach (der blinde Fleck aus Sprint 249).
cd "$(dirname "$0")/.."
FAIL=0
for t in eval eval:migrate test:014 test:alltag test:sprint test:pc test:prompts \
         test:agents test:brain-orchestrator test:650 test:matrix test:memory-10 \
         test:memory-10-intens test:knowledge-11 test:presence-12 test:body-13 \
         test:film-taste test:idea test:idea-plan test:watchlist \
         test:rest-final test:qa-16 test:turn-detect test:gemini-fallback test:agents-robust test:turn-e2e \
         test:settings-migrate test:verb-front test:tool-propose test:history test:globe-18 test:agent-map \
         test:chess-engine test:keyboard-inset test:lage-body-globe test:sprints-272 test:java-audit test:dead-code tsc:scripts; do
  if out=$(npm run --silent "$t" 2>&1); then
    printf 'ok   %s\n' "$t"
  else
    printf 'FAIL %s\n' "$t"
    printf '%s\n' "$out" | tail -25 | sed 's/^/     /'
    FAIL=$((FAIL + 1))
  fi
done
printf '\n%s fehlgeschlagen\n' "$FAIL"
exit $((FAIL > 0))
