CONTENTS = js l10n COPYING.txt icon-128.png icon-512.png index.html manifest.webapp style.css

.PHONY: all
all: musicmetadata.zip musicmetadata.manifest.webapp github.manifest.webapp

.PHONY: clean
clean:
	find . -name '*~' -delete

.PHONY: icons
icons: icon-128.png icon-512.png

icon-128.png: icon.svg
	rsvg-convert -w 128 icon.svg -o icon-128.png
	optipng icon-128.png

icon-512.png: icon.svg
	rsvg-convert -w 512 icon.svg -o icon-512.png
	optipng icon-512.png

#musicmetadata.zip: clean icons $(CONTENTS)
musicmetadata.zip: clean $(CONTENTS)
	rm -f musicmetadata.zip
	zip -r musicmetadata.zip $(CONTENTS)

musicmetadata.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "http:\/\/localhost:8080\/musicmetadata.zip"/' > musicmetadata.manifest.webapp

github.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "https:\/\/schnark.github.io\/musicmetadata\/musicmetadata.zip"/' > github.manifest.webapp
