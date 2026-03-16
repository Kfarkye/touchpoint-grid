#!/usr/bin/env bash
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
TEST_CANDIDATE_ID="${TEST_CANDIDATE_ID:-}"

if [[ -z "${SUPABASE_URL}" || -z "${SUPABASE_ANON_KEY}" || -z "${TEST_CANDIDATE_ID}" ]]; then
  cat <<EOF
Missing required variables.

Set:
  SUPABASE_URL
  SUPABASE_ANON_KEY
  TEST_CANDIDATE_ID

Example:
  SUPABASE_URL="https://hixjxztrblfjbwavyyph.supabase.co" \\
  SUPABASE_ANON_KEY="..." \\
  TEST_CANDIDATE_ID="00000000-0000-0000-0000-000000000000" \\
  ./scripts/validate-followup-rpcs.sh
EOF
  exit 1
fi

compute_due_date() {
  local days="$1"
  if date -u -d "+${days} days" +%Y-%m-%d >/dev/null 2>&1; then
    date -u -d "+${days} days" +%Y-%m-%d
    return
  fi

  if date -u -v+"${days}"d +%Y-%m-%d >/dev/null 2>&1; then
    date -u -v+"${days}"d +%Y-%m-%d
    return
  fi

  echo "Unable to compute due date on this system." >&2
  exit 1
}

call_rpc() {
  local rpc_name="$1"
  local payload="$2"
  local response_file
  response_file="$(mktemp)"

  local status
  status="$(
    curl -sS \
      -o "${response_file}" \
      -w "%{http_code}" \
      -X POST \
      "${SUPABASE_URL}/rest/v1/rpc/${rpc_name}" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
      -H "Content-Type: application/json" \
      -d "${payload}"
  )"

  if [[ ! "${status}" =~ ^2 ]]; then
    echo "RPC ${rpc_name} failed with status ${status}" >&2
    cat "${response_file}" >&2
    rm -f "${response_file}"
    exit 1
  fi

  cat "${response_file}"
  rm -f "${response_file}"
}

assert_grid_state() {
  local grid_payload="$1"
  local expected_due="$2"
  local expected_snoozed="$3"

  if ! command -v jq >/dev/null 2>&1; then
    echo "jq not installed; skipping candidate-level assertions."
    return
  fi

  local row_json
  row_json="$(
    printf "%s" "${grid_payload}" \
      | jq -c --arg cid "${TEST_CANDIDATE_ID}" '.[] | select(.candidate_id == $cid)' \
      | head -n1
  )"

  if [[ -z "${row_json}" ]]; then
    echo "Candidate ${TEST_CANDIDATE_ID} was not found in get_touchpoint_grid output." >&2
    exit 1
  fi

  local is_snoozed
  is_snoozed="$(printf "%s" "${row_json}" | jq -r '.is_snoozed // false')"

  if [[ "${is_snoozed}" != "${expected_snoozed}" ]]; then
    echo "Expected is_snoozed=${expected_snoozed}, got ${is_snoozed}." >&2
    exit 1
  fi

  local next_due
  next_due="$(printf "%s" "${row_json}" | jq -r '.next_touch_due // empty')"

  if [[ "${expected_snoozed}" == "true" ]]; then
    if [[ "${next_due}" != "${expected_due}" ]]; then
      echo "Expected next_touch_due=${expected_due}, got ${next_due:-<empty>}." >&2
      exit 1
    fi
  else
    if [[ -n "${next_due}" ]]; then
      echo "Expected cleared next_touch_due, got ${next_due}." >&2
      exit 1
    fi
  fi
}

DUE_DATE="$(compute_due_date 7)"
REASON="Snooze QA check $(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "1/4 set_followup for ${TEST_CANDIDATE_ID} -> ${DUE_DATE}"
call_rpc "set_followup" "$(cat <<JSON
{"p_candidate_id":"${TEST_CANDIDATE_ID}","p_due_date":"${DUE_DATE}","p_reason":"${REASON}"}
JSON
)" >/dev/null

echo "2/4 verify snoozed row appears in get_touchpoint_grid"
GRID_AFTER_SNOOZE="$(call_rpc "get_touchpoint_grid" "{}")"
assert_grid_state "${GRID_AFTER_SNOOZE}" "${DUE_DATE}" "true"

echo "3/4 clear snooze with update_candidate_field"
call_rpc "update_candidate_field" "$(cat <<JSON
{"p_candidate_id":"${TEST_CANDIDATE_ID}","p_field":"next_touch_due","p_value":null}
JSON
)" >/dev/null

echo "4/4 verify row is unsnoozed"
GRID_AFTER_UNSNOOZE="$(call_rpc "get_touchpoint_grid" "{}")"
assert_grid_state "${GRID_AFTER_UNSNOOZE}" "" "false"

echo "Validation complete: follow-up snooze RPC flow is working."
