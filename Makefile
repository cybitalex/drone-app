get_deps: 
	@mkdir -p web/assets/leaflet web/assets/external/toastify-js web/assets/external/bootstrap web/assets/external/popper web/assets/external/echarts_5.5.1/
	@wget https://leafletjs-cdn.s3.amazonaws.com/content/leaflet/v1.9.4/leaflet.zip
	@echo "Leaflet downloaded"
	@unzip leaflet.zip -d web/assets/external/leaflet
	@rm leaflet.zip
	@wget https://github.com/apvarun/toastify-js/archive/refs/tags/1.12.0.zip
	@unzip 1.12.0.zip -d web/assets/external/toastify-js
	@rm 1.12.0.zip
	@echo "Toastify-js downloaded"
	@wget https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip
	@unzip bootstrap-5.3.3-dist.zip -d web/assets/external/bootstrap
	@rm -rf bootstrap-5.3.3-dist.zip
	@echo "Bootstrap downloaded"
	@wget https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js
	@mv popper.min.js web/assets/external/popper/popper.min.js
	@echo "Popper downloaded"
	@wget https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js
	@mv echarts.min.js web/assets/external/echarts_5.5.1/echarts.min.js
	@echo "Echarts downloaded"
	@echo "All Dependencies downloaded"
	@echo "Removing extras from downloaded dependancies..."
	
clean: 
	@rm -rf leaflet.zip leaflet.zip.* 1.12.0.zip 1.12.0.zip.* bootstrap-5.3.3-dist.zip bootstrap-5.3.3-dist.zip.* popper.min.js
	@echo "Cleaned up..."
	@echo "Removing extras from downloaded dependancies..."
	@rm -rf web/assets/external/
	@mkdir -p web/assets/external/
	@echo "Cleaned up repos. Run 'make ' to remove extra dependancies, or 'make get_deps' to replace them."

all: pull
	@echo "Downloaded dependancies and cleaned up extras..."
