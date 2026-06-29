// swift-tools-version:5.7
import PackageDescription

// Mac-first BLE controller prototype for NEEWER lights.
// CoreBluetooth is Apple-only, so this package targets macOS exclusively.
// Build:  swift build
// Run:    swift run neewer-ble
let package = Package(
    name: "neewer-ble",
    platforms: [
        .macOS(.v11)
    ],
    targets: [
        .executableTarget(
            name: "neewer-ble",
            path: "Sources/neewer-ble"
        )
    ]
)
