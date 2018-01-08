BROWSERIFY = ./node_modules/.bin/browserify
UGLIFY = ./node_modules/uglify-es/bin/uglifyjs

pushall:
	git push origin gh-pages

run:
	wzrd app.js:index.js -- \
		-d

# Some apps needs to run at port 80 because some auth APIs will only redirect
# back to port 80/443.
run-on-80:
	sudo wzrd app.js:index.js --port 80 -- -d

build:
	$(BROWSERIFY) app.js | $(UGLIFY) -c -m -o index.js

prettier:
	prettier --single-quote --write "**/*.js"
