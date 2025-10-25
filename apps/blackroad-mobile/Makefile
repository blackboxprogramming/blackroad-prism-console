APP_NAME=BlackRoadMobile
SCHEME=BlackRoadMobile
DESTINATION?="platform=iOS Simulator,name=iPhone 15"

.PHONY: dev test lint format build mocks

dev:
xed .

mocks:
./mocks/server.py

test:
xcodebuild test -project $(APP_NAME).xcodeproj -scheme $(SCHEME) -destination $(DESTINATION)

lint:
swiftlint --strict || true

format:
swiftformat . || true

build:
xcodebuild build -project $(APP_NAME).xcodeproj -scheme $(SCHEME) -destination $(DESTINATION)
