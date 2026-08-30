#!/usr/bin/env python3
"""papertrail: check for new instructor feedback on the classroom server.

Split out of submit.py (which used to check for comments as a side effect of
every submission) so submission and comment-checking are two separate,
independently runnable actions — /papertrail:submit sends, /papertrail:check
looks for feedback, either any time.

Fetches every comment across ALL of the student's own past submissions
(GET /api/my-comments, one call, server-side — never trusts local
bookkeeping alone for which submissions exist), then routes anything not
already seen through the SAME board-feedback document pipeline
board.py's --pull already uses for the single-project hosted board:
assemble_hosted_document -> inspect_feedback_document (prints a document
whose ```json board-feedback``` fence has "mode": "hosted" — the student's
own board.md step 5 routing then discusses/acts on it exactly like any other
collaborator feedback).

Stdlib only, Python 3.9+. Exit codes: 0 always (a comment-check failure is
never fatal to the surrounding session — same "fail open" spirit as
submit.py's own git_log_excerpt/fetch_comments); 1 only for a genuine usage
error (no classroom server configured yet).
"""

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Feedback documents are routed to stdout and can contain any Unicode the
# instructor typed (em dashes, curly quotes, non-Latin scripts). On a console
# whose default encoding is not UTF-8 (e.g. cp949 on Korean Windows) a bare
# print() of that text raises UnicodeEncodeError and takes the command down.
# Force UTF-8 on the streams we print through, mirroring what PYTHONUTF8=1
# would do, so routing never crashes on the comment text.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
import classroom  # noqa: E402
from board import (  # noqa: E402
    find_root,
    group_comments,
    assemble_hosted_document,
    inspect_feedback_document,
    _http_get_json,
)


def die(msg, code=1):
    print("check: %s" % msg, file=sys.stderr)
    sys.exit(code)


def fetch_my_comments(url, token):
    endpoint = url.rstrip("/") + "/api/my-comments"
    return _http_get_json(endpoint, {"Authorization": "Bearer %s" % token})


def main():
    root = find_root()
    if not (root / "plans" / "master-plan.md").is_file():
        die("no plans/master-plan.md found — run /papertrail:init first")

    cfg = classroom.read_classroom_config(root)
    if not cfg or not cfg.get("serverUrl") or not cfg.get("token"):
        die(
            "no classroom server configured yet — run /papertrail:submit "
            "first, which saves the server URL and your personal token."
        )

    url = cfg["serverUrl"]
    token = cfg["token"]

    # Recover from a prior run that crashed after writing an inbox document
    # but before routing it — drain and route any leftovers before touching
    # the new fetch, same crash-safety shape as board.py's pull().
    inbox = classroom.comments_inbox_dir(root)
    if inbox.is_dir():
        for p in sorted(inbox.glob("*.txt")):
            inspect_feedback_document(root, p.read_text(encoding="utf-8", errors="replace"))
            p.unlink()

    try:
        data = fetch_my_comments(url, token)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            die("Token rejected. Ask your instructor for a fresh personal token.")
        die("Classroom server returned HTTP %s while checking for feedback." % e.code)
        return
    except (urllib.error.URLError, OSError):
        die(
            "Classroom server unreachable (it may be down, or the URL may "
            "be wrong). Check the URL with your instructor and try again."
        )
        return

    comments = data.get("comments", [])
    pulled = classroom.read_pulled_comment_ids(root)
    new = [c for c in comments if c.get("id") and c.get("id") not in pulled]
    if not new:
        print("No new instructor feedback.")
        return

    groups = group_comments(new)
    inbox.mkdir(parents=True, exist_ok=True)
    docs = []
    for (author, client_id), group in groups.items():
        meta = {
            "sessionId": client_id or author,
            "generatedAt": "",
            "focus": None,
            "reviewer": author,
            "shareHash": group[-1].get("shareHash"),
        }
        doc = assemble_hosted_document(
            [dict(c["annotation"], docHash=c.get("docHash")) for c in group],
            meta, root=root,
        )
        prefix = "".join(ch if ch.isalnum() or ch in "._-" else "-" for ch in "%s-%s" % (author, client_id))[:40] or "group"
        fname = "%s-%d.txt" % (prefix, len(docs))
        inbox_path = inbox / fname
        inbox_path.write_text(doc, encoding="utf-8")  # inbox FIRST
        docs.append((inbox_path, doc))

    # Only after every document is safely on disk do we mark ids pulled.
    all_ids = pulled | {c["id"] for c in new}
    classroom.write_pulled_comment_ids(root, all_ids)

    for inbox_path, doc in docs:
        inspect_feedback_document(root, doc)  # route (prints)
        inbox_path.unlink()


if __name__ == "__main__":
    main()
