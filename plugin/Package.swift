// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorGoogleMaps",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorGoogleMaps",
            targets: ["CapacitorGoogleMapsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/googlemaps/ios-maps-sdk.git", .upToNextMajor(from:"9.4.0")),
        .package(url: "https://github.com/googlemaps/google-maps-ios-utils.git", .exact("6.1.0"))
    ],
    targets: [
        .target(
            name: "CapacitorGoogleMapsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
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