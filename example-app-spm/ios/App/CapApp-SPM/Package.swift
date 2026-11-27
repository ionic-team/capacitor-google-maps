// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(name: "capacitor-ios", path: "../../../node_modules/@capacitor/ios"),
        .package(name: "CapacitorApp", path: "../../../../node_modules/.pnpm/@capacitor+app@9.0.0-alpha.2_@capacitor+core@9.0.0-rc.1/node_modules/@capacitor/app"),
        .package(name: "CapacitorGoogleMaps", path: "../../../../plugin"),
        .package(name: "CapacitorHaptics", path: "../../../../node_modules/.pnpm/@capacitor+haptics@9.0.0-next.3_@capacitor+core@9.0.0-rc.1/node_modules/@capacitor/haptics"),
        .package(name: "CapacitorKeyboard", path: "../../../../node_modules/.pnpm/@capacitor+keyboard@9.0.0-next.3_@capacitor+core@9.0.0-rc.1/node_modules/@capacitor/keyboard"),
        .package(name: "CapacitorStatusBar", path: "../../../../node_modules/.pnpm/@capacitor+status-bar@9.0.0-alpha.2_@capacitor+core@9.0.0-rc.1/node_modules/@capacitor/status-bar")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-ios"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorGoogleMaps", package: "CapacitorGoogleMaps"),
                .product(name: "CapacitorHaptics", package: "CapacitorHaptics"),
                .product(name: "CapacitorKeyboard", package: "CapacitorKeyboard"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar")
            ]
        )
    ]
)
