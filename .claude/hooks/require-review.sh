#!/usr/bin/env bash
# PreToolUse hook: block `gh pr create` unless the current HEAD has a passing /multi-review.
# Exit 0 = allow, exit 2 = block (stderr is shown to Claude). Fails closed; no bypass flag.
# A workflow guardrail for Claude Code sessions, not a security boundary (the state file is local).
set -uo pipefail

REQUIRED_ANGLES='["functionality","architecture","security","scalability","tests"]'

block() {
  printf 'PR creation blocked by require-review hook: %b\n' "$1" >&2
  exit 2
}

input=$(cat)

# cheap pre-filter so a missing jq only affects commands that could invoke gh
# (no left boundary: in raw JSON a preceding newline is the two chars `\n`; JSON `\u` escapes and
# ANSI-C $'...' strings can spell gh)
[[ "$input" =~ gh([^[:alnum:]_-]|$) || "$input" == *'\u'* || "$input" == *"\$'"* ]] || exit 0

command -v jq >/dev/null 2>&1 || block "jq is not installed."
command -v git >/dev/null 2>&1 || block "git is not installed."

cmd=$(printf '%s' "$input" | jq -er '.tool_input.command // ""' 2>/dev/null) \
  || block "could not parse hook input."

# Split the command into simple-command segments, one per line, the way a shell would:
# - backslash-newline is removed first (line continuation, also inside double quotes)
# - break on ; & | && || newline outside quotes
# - $( ` ( <( >( open a nested command (also inside double quotes) and ) ` close it again,
#   restoring the surrounding quote state
# - single-quoted text is data; $'...' (ANSI-C) is decoded; a here-string word is data but
#   its $( ) still runs
# - a redirection (>out, 2>&1, <in) and its target are split off so they can't hide the command;
#   the target is data but its $( ) still runs
# - heredoc bodies are data, but with an unquoted delimiter their $( ) and ` ` still run;
#   an unterminated heredoc body is inspected as commands (fail closed)
# Only a segment whose first word is gh counts, so text that merely mentions
# `gh pr create` (commit messages, grep, echo) passes through.
segments() {
  local joined=${1//$'\\\n'/}
  printf '%s\n' "$joined" | awk '
    function emit(s) { print s }
    function flush() {
      if (redir) { emit(buf); buf = saved; redir = 0; rt = 0 }
      emit(buf); buf = ""
    }
    function push(o) { flush(); sp++; sq[sp] = q; so[sp] = o; q = "" }
    function pop() { flush(); q = sq[sp]; sp-- }
    function hexval(s,   k, v, ch) {
      v = 0
      for (k = 1; k <= length(s); k++) { ch = index("0123456789abcdef", tolower(substr(s, k, 1))) - 1; v = v * 16 + ch }
      return v
    }
    function chr(v) { return (v >= 32 && v < 127) ? sprintf("%c", v) : " " }
    function startredir() {
      # a fd number right before the operator (2>) belongs to the redirection
      if (match(buf, /(^|[ \t])[0-9]+$/)) buf = substr(buf, 1, RSTART - 1 + (RLENGTH > 0 && substr(buf, RSTART, 1) ~ /[ \t]/ ? 1 : 0))
      saved = buf; buf = "REDIR "; redir = 1; rt = 0
    }
    # one character of an ANSI-C $'...' string starting at i; returns chars consumed
    function ansi(line, i,   c, nx, m, h) {
      c = substr(line, i, 1)
      if (c != "\\") { buf = buf (c ~ /[;&|`()<>$]/ ? " " : c); return 1 }
      nx = substr(line, i + 1, 1)
      if (nx == "x" && match(substr(line, i + 2), /^[0-9A-Fa-f][0-9A-Fa-f]?/)) { buf = buf chr(hexval(substr(line, i + 2, RLENGTH))); return 2 + RLENGTH }
      if ((nx == "u" || nx == "U") && match(substr(line, i + 2), /^[0-9A-Fa-f]+/)) {
        m = (nx == "u" ? 4 : 8); h = substr(line, i + 2, (RLENGTH < m ? RLENGTH : m))
        buf = buf chr(hexval(h)); return 2 + length(h)
      }
      if (match(substr(line, i + 1), /^[0-7][0-7]?[0-7]?/)) {
        h = substr(line, i + 1, RLENGTH); m = 0
        for (k = 1; k <= length(h); k++) m = m * 8 + substr(h, k, 1)
        buf = buf chr(m); return 1 + RLENGTH
      }
      buf = buf (nx == "\\" || nx == "\047" || nx == "\"" ? nx : " "); return 2
    }
    hd != "" {
      t = $0; gsub(/^[ \t]+|[ \t]+$/, "", t)
      if (t == hd) { hd = ""; nb = 0; next }
      body[++nb] = $0
      if (hq) next
      # unquoted heredoc body: text is data, $( ) and ` ` are commands
      q = "\""; buf = "HEREDOC "; line = $0 "\"" ; n = length(line); i = 1
    }
    hd == "" { line = $0; n = length(line); i = 1 }
    {
      while (i <= n) {
        c = substr(line, i, 1); c2 = substr(line, i, 2)
        if (q == "\047") { if (c == "\047") q = ""; buf = buf (c == "\047" ? c : (c ~ /[;&|`()<>$]/ ? " " : c)); i++; continue }
        if (q == "A") { if (c == "\047") { q = ""; i++; continue } i += ansi(line, i); continue }
        if (q == "\"") {
          if (c == "\\") { buf = buf " "; i += 2; continue }
          if (c == "\"") { q = ""; buf = buf c; i++; continue }
          if (c2 == "$(") { push("("); i += 2; continue }
          if (c == "`") { push("`"); i++; continue }
          buf = buf (c ~ /[;&|()<>]/ ? " " : c); i++; continue
        }
        if (redir && c ~ /[ \t]/) { if (rt) flush_redir_only(); else { i++; continue } }
        if (c == "`") { if (sp > 0 && so[sp] == "`") pop(); else push("`"); i++; continue }
        if (c2 == "$(") { push("("); i += 2; continue }
        if (c2 == "$\047") { q = "A"; i += 2; if (redir) rt = 1; continue }
        if (c2 == "<(" || c2 == ">(") { push("("); i += 2; continue }
        if (c == "(") { push("("); i++; continue }
        if (c == ")") { if (sp > 0 && so[sp] == "(") pop(); else flush(); i++; continue }
        if (substr(line, i, 3) == "<<<") { flush(); buf = "HERESTRING "; i += 3; continue }
        if (c2 == "<<" && match(substr(line, i + 2), /^-?[ \t]*["\047]?[A-Za-z_][A-Za-z0-9_]*["\047]?/)) {
          d = substr(line, i + 2 + RSTART - 1, RLENGTH); hq = (d ~ /["\047]/)
          gsub(/^-?[ \t]*["\047]?|["\047]$/, "", d)
          hd = d; nb = 0; i += 2 + RLENGTH; continue
        }
        if (c2 == "&>" || c ~ /[<>]/) {
          if (redir) flush_redir_only()
          startredir()
          i += (c2 == "&>" ? 2 : 1)
          while (substr(line, i, 1) ~ /[<>&|]/) i++
          continue
        }
        if (c == "\047" || c == "\"") { q = c; buf = buf c; i++; if (redir) rt = 1; continue }
        if (c == "\\") { buf = buf substr(line, i, 2); i += 2; if (redir) rt = 1; continue }
        if (c ~ /[;&|]/) { flush(); i++; continue }
        if (redir && c !~ /[ \t]/) rt = 1
        buf = buf c; i++
      }
      if (hd != "" && !hq && buf ~ /^HEREDOC /) { emit(buf); buf = ""; q = ""; next }
      if (q == "") flush(); else buf = buf " "
    }
    function flush_redir_only() { emit(buf); buf = saved; redir = 0; rt = 0 }
    END {
      if (buf != "") flush()
      if (hd != "") for (k = 1; k <= nb; k++) print body[k]
    }'
}

# gh [global flags [value]] ... ; quotes/backslashes are stripped before matching
flags='([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*'
gh_head="^([^[:space:]]*/)?gh${flags}[[:space:]]+"
pr_create_re="${gh_head}pr[[:space:]]+(create|new)([[:space:]]|\$)"
api_re="${gh_head}api[[:space:]]"
# only the create endpoint; /pulls/<n>/... (comments, reviews) is not PR creation
pulls_re='/pulls([?[:space:]]|$)'
api_write_re='(-X|--method)[[:space:]=]*([Pp][Oo][Ss][Tt]|\$)|[[:space:]](-f|-F|--field|--raw-field|--input)'
# an endpoint built from a variable can't be checked: treat a write to it as PR creation
api_dynamic_re="${gh_head}api[[:space:]]+([^[:space:]]+[[:space:]]+)*[^-[:space:]]*\\$"
# commands/keywords (incl. any shell's -c: sh/bash/dash/ksh/zsh/fish/busybox sh) that run (part of)
# the rest of the segment as a command; after one, the
# command is the first gh word that follows, whatever options/operands sit in between
wrapper_re='^(([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*)|command|sudo|env|exec|eval|time|nohup|nice|timeout|xargs|if|then|else|elif|do|while|until|!|\{|([^[:space:]]*/)?(busybox[[:space:]]+)?([a-z]*sh|fish)([[:space:]]+-[^[:space:]]+)*[[:space:]]+-[A-Za-z]*c[A-Za-z]*)[[:space:]]+'
wrapped_gh_re='(^|[[:space:]])(([^[:space:]]*/)?gh([[:space:]].*)?)$'
cd_re='^(cd|pushd)([[:space:]]+([^[:space:]]+))?[[:space:]]*$'

is_pr_create=false
pr_seg=""
cd_target=""
while IFS= read -r seg; do
  seg=$(printf '%s' "$seg" | tr -d "\"'\\\\")
  seg="${seg#"${seg%%[![:space:]]*}"}"
  wrapped=false
  while [[ "$seg" =~ $wrapper_re ]]; do seg="${seg:${#BASH_REMATCH[0]}}"; wrapped=true; done
  if $wrapped && ! [[ "$seg" =~ ^([^[:space:]]*/)?gh[[:space:]] ]] && [[ "$seg" =~ $wrapped_gh_re ]]; then
    seg="${BASH_REMATCH[2]}"
  fi
  if [[ "$seg" =~ $cd_re ]]; then cd_target="${BASH_REMATCH[3]:-$HOME}"; continue; fi
  if [[ "$seg" =~ $pr_create_re ]] \
     || { [[ "$seg" =~ $api_re ]] && [[ "$seg" =~ $api_write_re ]] \
          && { [[ "$seg" =~ $pulls_re ]] || [[ "$seg" =~ $api_dynamic_re ]]; }; }; then
    is_pr_create=true
    pr_seg="$seg"
    break
  fi
done < <(segments "$cmd")
$is_pr_create || exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')
[ -n "$cwd" ] || cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
# `cd <dir> && gh pr create` creates the PR from <dir>: judge that repo
if [ -n "$cd_target" ]; then
  case "$cd_target" in
    "~"*) cwd="$HOME${cd_target#\~}" ;;
    /*) cwd="$cd_target" ;;
    *) cwd="$cwd/$cd_target" ;;
  esac
fi

top=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || block "$cwd is not inside a git repository."
sha=$(git -C "$top" rev-parse HEAD 2>/dev/null) || block "could not resolve HEAD in $top."

# the PR must target the reviewed repo and branch
if [[ "$pr_seg" =~ (^|[[:space:]])(-R|--repo)([[:space:]]+|=)([^[:space:]]+) ]]; then
  want=$(printf '%s' "${BASH_REMATCH[4]}" | tr '[:upper:]' '[:lower:]' | awk -F/ '{print $(NF-1) "/" $NF}')
  have=$(git -C "$top" remote get-url origin 2>/dev/null | tr '[:upper:]' '[:lower:]' | sed -E 's#\.git$##; s#^.*[:/]([^/:]+/[^/]+)$#\1#')
  [ -n "$have" ] && [ "$want" = "$have" ] || block "--repo $want is not this repository's origin (${have:-none}). Create the PR from the reviewed repo."
fi
if [[ "$pr_seg" =~ (^|[[:space:]])(-H|--head)([[:space:]]+|=)([^[:space:]]+) ]]; then
  head_branch="${BASH_REMATCH[4]##*:}"
  current=$(git -C "$top" rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ "$head_branch" = "$current" ] || block "--head $head_branch is not the reviewed branch ($current). Check it out and run /multi-review there."
fi

if [ -n "$(git -C "$top" status --porcelain --untracked-files=no)" ]; then
  block "uncommitted changes to tracked files. Commit them, then run /multi-review so the review covers exactly what will be pushed."
fi

state="$top/.claude/review-state/$sha.json"
[ -f "$state" ] || block "no review found for HEAD $sha. Run /multi-review first."

jq -e 'type == "object"' "$state" >/dev/null 2>&1 || block "review state $state is malformed. Re-run /multi-review."

bad_angles=$(jq -r --argjson req "$REQUIRED_ANGLES" '
  $req[] as $a | select((.angles // {})[$a] != "ok") | "  - angle \($a): \((.angles // {})[$a] // "missing")"
' "$state" 2>/dev/null) || block "review state $state is malformed. Re-run /multi-review."

open=$(jq -r '
  ((.waivers // []) | map(.id)) as $waived
  | (.findings // [])[]
  | select(.severity == "critical" or .severity == "high")
  | select(.id as $id | ($waived | index($id)) | not)
  | "  - [\(.severity)] \(.id): \(.title) (\(.file):\(.line // "-"))"
' "$state" 2>/dev/null) || block "review state $state is malformed. Re-run /multi-review."

if [ -n "$bad_angles" ] || [ -n "$open" ]; then
  msg="review for HEAD $sha did not pass."
  [ -n "$bad_angles" ] && msg="$msg\nAngles not reviewed:\n$bad_angles"
  [ -n "$open" ] && msg="$msg\nOpen critical/high findings:\n$open"
  msg="$msg\nFix, commit, and re-run /multi-review. Only the user may waive a finding."
  block "$msg"
fi

exit 0
