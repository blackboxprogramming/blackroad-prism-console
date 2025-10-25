// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BlackRoadMobile",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(name: "BlackRoadMobileCore", targets: ["BlackRoadMobileCore"])
    ],
    targets: [
        .target(
            name: "BlackRoadMobileCore",
            path: "Sources/BlackRoadMobileCore"
        ),
        .testTarget(
            name: "BlackRoadMobileCoreTests",
            dependencies: ["BlackRoadMobileCore"],
            path: "Tests"
        )
    ]
)
