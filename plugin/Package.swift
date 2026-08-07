// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorGoogleMaps",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapacitorGoogleMaps",
            targets: ["CapacitorGoogleMapsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "9.0.0-alpha.5"),
        .package(url: "https://github.com/googlemaps/ios-maps-sdk.git", .upToNextMajor(from:"10.15.0")),
        .package(url: "https://github.com/googlemaps/google-maps-ios-utils.git", .exact("7.1.0"))
    ],
    targets: [
        .target(
            name: "CapacitorGoogleMapsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "GoogleMaps", package: "ios-maps-sdk"),
                .product(name: "GoogleMapsUtils", package: "google-maps-ios-utils")
            ],
            path: "ios/Sources/CapacitorGoogleMapsPlugin"),
        .testTarget(
            name: "CapacitorGoogleMapsPluginTests",
            dependencies: ["CapacitorGoogleMapsPlugin"],
            path: "ios/Tests/CapacitorGoogleMapsPluginTests")
    ]
)