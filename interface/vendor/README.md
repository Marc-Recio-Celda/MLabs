# Local reader libraries

Prebuilt browser distributions; no install, build, CDN or network connection is required at runtime.
Versions, upstream archives and SHA-256 hashes are recorded in manifest.json; original licences accompany each distribution. Mermaid loads only for a note containing a diagram.

- [markdown-it](https://github.com/markdown-it/markdown-it): HTML disabled, local note links resolved against the declared catalog.
- [KaTeX](https://katex.org/docs/security): trust disabled, limited expansion; unsupported input stays readable.
- [Mermaid](https://mermaid.js.org/config/usage): strict security, source retained for invalid diagrams.

To update, copy the corresponding prebuilt files from the official npm archive, retain licences and regenerate the checksums. Run the reader and containment tests, then inspect formulas and diagrams in the browser.
