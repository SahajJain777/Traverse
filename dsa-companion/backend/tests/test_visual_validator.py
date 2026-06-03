"""Tests for the visual validator — deterministic, no external deps."""

from services.visual_validator import validate_visual_html

# ── Valid HTML ────────────────────────────────────────────────────────

def test_valid_minimal_html():
    """A complete, self-contained document with all required elements should pass."""
    html = """<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
      * { box-sizing: border-box; }
      .container { max-width: 100%; }
    </style></head><body>
    <div class="container">
      <span id="step-counter">Step 1 / 5</span>
      <button onclick="prev()">Prev</button>
      <button onclick="next()">Next</button>
    </div>
    <script>let x=1; function next(){} function prev(){}</script>
    </body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is True, f"Expected valid, got: {reason}"
    assert reason == ""


def test_valid_with_interactive_elements():
    """Document with step-forward/back buttons and state display is valid."""
    html = """<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
      * { box-sizing: border-box; }
      .viz { max-width: 100%; }
    </style></head><body>
    <div class="viz">
      <span id="step">Step 0 / 10</span>
      <pre id="state"></pre>
      <button onclick="next()">Next</button>
      <button onclick="prev()">Back</button>
    </div>
    <script>
      let step = 0;
      function next() { step++; render(); }
      function prev() { step--; render(); }
      function render() { document.getElementById("state").textContent = step; }
    </script>
    </body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is True, f"Expected valid, got: {reason}"
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


# ── Design system standards ───────────────────────────────────────────

def test_missing_viewport_meta():
    html = """<html><head><style>*{box-sizing:border-box;}.c{max-width:100%}</style></head>
    <body><span>Step</span><button>Prev</button><button>Next</button>
    <script>function next(){} function prev(){}</script></body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "viewport" in reason.lower()


def test_missing_max_width():
    html = """<html><head><meta name="viewport" content="width=device-width"><style>
      *{box-sizing:border-box}</style></head>
    <body><span>Step</span><button>Prev</button><button>Next</button>
    <script>function next(){} function prev(){}</script></body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "max-width" in reason.lower()


def test_missing_step_counter():
    html = """<html><head><meta name="viewport" content="width=device-width"><style>
      *{box-sizing:border-box}.c{max-width:100%}</style></head>
    <body><button>Prev</button><button>Next</button>
    <script>function next(){} function prev(){}</script></body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "step" in reason.lower()


def test_missing_nav_buttons():
    html = """<html><head><meta name="viewport" content="width=device-width"><style>
      *{box-sizing:border-box}.c{max-width:100%}</style></head>
    <body><span>Step 1 / 5</span>
    <script>console.log("hi")</script></body></html>"""
    valid, reason = validate_visual_html(html)
    assert valid is False
    assert "step-back" in reason.lower() or "step-forward" in reason.lower()
