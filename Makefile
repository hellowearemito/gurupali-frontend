dist: dist/index.html dist/index.js dist/index.css dist/billboard.js dist/billboard.css

dist/index.css: src/index.css
	cp $< $@

dist/index.html: src/index.html
	cp $< $@

dist/index.js: src/index.js
	npx babel $< --out-file $@

dist/billboard.js:
	wget http://naver.github.io/billboard.js/release/latest/dist/billboard.js -O $@

dist/billboard.css:
	wget http://naver.github.io/billboard.js/release/latest/dist/billboard.css -O $@

