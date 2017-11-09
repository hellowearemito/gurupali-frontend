dist: dist/index.html dist/index.js dist/index.css

dist/index.css: src/index.css
	cp $< $@

dist/index.html: src/index.html
	cp $< $@

dist/index.js: src/index.js
	npx babel $< --out-file $@
