"""Tests for the visual validator — deterministic, no external deps."""

from services.visual_validator import validate_visual_html

# ── Valid HTML ────────────────────────────────────────────────────────

def test_valid_minimal_html():
    """A complete, self-contained document should pass."""
    html = "<html><head><style>body{}</style></head><body><script>let x=1</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is True
    assert reason == ""


def test_valid_with_interactive_elements():
    """Document with step-forward/back buttons and state display is valid."""
    html = """<html><body><script>
      let step = 0;
      function next() { step++; render(); }
      function prev() { step--; render(); }
      function render() { document.getElementById("state").textContent = step; }
    </script>
    <pre id="state"></pre>
    <button onclick="next()">Next</button>
    <button onclick="prev()">Back</button>
    </body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is True
    assert reason == ""


# ── Empty / invalid inputs ────────────────────────────────────────────

def test_empty_string():
    valid, reason = validate_visual_html("")
    assert valid is False
    assert "empty" in reason.lower()


def test_non_string_input():
    valid, reason = validate_visual_html(None)  # type: ignore
    assert valid is False
    assert "not a string" in reason.lower()


def test_too_long_html():
    html = "<html><body><script>//</script></body></html>" * 10_000
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "exceeds size limit" in reason.lower()


# ── Security: external resources ──────────────────────────────────────

def test_external_script_tag():
    html = '<html><body><script src="http://evil.com/x.js"></script></body></html>'
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "external script" in reason.lower()


def test_fetch_blocked():
    html = "<html><body><script>fetch('/api/data')</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "network" in reason.lower() or "fetch" in reason.lower()


def test_xml_http_request_blocked():
    html = "<html><body><script>new XMLHttpRequest()</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "network" in reason.lower() or "xmlhttprequest" in reason.lower()


def test_eval_blocked():
    html = "<html><body><script>eval('alert(1)')</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "eval" in reason.lower()


def test_new_function_blocked():
    html = "<html><body><script>new Function('return 1')</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "new Function" in reason


def test_document_write_blocked():
    html = "<html><body><script>document.write('x')</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "document.write" in reason.lower()


def test_dynamic_import_blocked():
    html = "<html><body><script>import('./mod.js')</script></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "import" in reason.lower()


# ── Structural completeness ───────────────────────────────────────────

def test_missing_html_tag():
    """Without <html> tag, it's not a complete document."""
    html = "<body><script>let x=1</script></body>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "complete document" in reason.lower()


def test_missing_body_tag():
    html = "<html><script>let x=1</script></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "complete document" in reason.lower()


def test_missing_script_tag():
    html = "<html><body><p>No script here</p></body></html>"
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "complete document" in reason.lower()
