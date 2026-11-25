#!/usr/bin/env python3
"""Bundle the site into one self-contained HTML file (CSS, data, logos inlined).

Usage: python3 tools/build_single_file.py OUT.html
The output is ready to publish as a single web page.
"""
import base64, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
rd = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()

css = rd("styles.css")
m = re.search(r"@media \(prefers-color-scheme: dark\) \{\n  :root \{(.*?)\n  \}\n\}", css, re.S)
if m:  # also honour an explicit light/dark choice by the host page
    dark = m.group(1)
    css = css.replace(m.group(0),
        '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {' + dark + "\n    color-scheme: dark;\n  }\n}\n"
        ':root[data-theme="dark"] {' + dark + "\n  color-scheme: dark;\n}")
css = css.replace(".wrap { max-width: 1180px; margin: 0 auto; padding: 0 16px; }",
    ".wrap { max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }")

def inline_logos(js):
    def sub(mo):
        path = mo.group(1)
        with open(os.path.join(ROOT, path), "rb") as f:
            return '"data:image/png;base64,' + base64.b64encode(f.read()).decode() + '"'
    return re.sub(r'"(assets/logos/[^"]+\.png)"', sub, js)

html = rd("index.html")
title = re.search(r"<title>(.*?)</title>", html).group(1)
body = html.split("<body>")[1].split("</body>")[0]
for src in re.findall(r'<script src="([^"]+)"></script>', body):
    js = rd(src)
    if src.endswith("banks.js"):
        js = inline_logos(js)
    body = body.replace(f'<script src="{src}"></script>', "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>")

out = f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n{css}\n</style>\n{body}'
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(f"Wrote {sys.argv[1]} ({len(out):,} bytes)")
