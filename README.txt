koupi.dev  intro + terminal-style page

Deploy: index.html and physics-intro-fine.js in the same folder. Nothing else.

Flow: intro -> click -> blocky dissolve -> BIOS -> page.
The page is embedded in index.html as base64 (var TERM_B64 = "...").

src/page.html   the whole page as one readable file (fonts inlined). This is what gets embedded.
src/page.css    styles  \
src/body.html   markup   > the same page split up, easier to edit
src/page.js     logic   /

After editing src/page.html, re-embed it:
  python3 -c "import re,base64;s=open('index.html').read();t=base64.b64encode(open('src/page.html','rb').read()).decode();open('index.html','w').write(re.sub(r'var TERM_B64 = \"[^\"]+\";','var TERM_B64 = \"'+t+'\";',s))"

Page: left = sections typed as you scroll (whoami / tora.txt / things-i-made / music.txt / contact.json) + a real shell at the bottom.
Right = character-cell canvas, one scene per section:
  hello   "koupi" made of letters, push them, click to scatter
  tora    ascii cat that keeps her distance from the cursor, slips away, leaps over it when cornered, naps after 10s
  things  hamachill = orange minecraft fish, mc-plugins = grass block (drawn with coloured characters), cat.koupi.dev = ascii cat (assembled from flying chars)
  music   ascii equalizer, click to play a small Web Audio loop
  contact links lean toward the cursor, click opens (discord copies the name)

layout (2026-10-16): one column. every section has its own live animation box right under it (no left/right split).
