import Foundation
import CoreBluetooth

/// Guardrails for "safe BLE writes only": block writes that target firmware
/// update / OTA / DFU services, which is where a bad payload could brick a
/// device. This prototype never pairs, bonds, unpairs, or issues factory
/// resets — it only does GATT reads/writes/notifications, and refuses writes to
/// the services below.
enum Safety {
    /// Service UUIDs associated with firmware update / OTA / DFU on common BLE
    /// stacks. Matched case-insensitively against both the short (16-bit) and
    /// full (128-bit) forms CoreBluetooth may report.
    static let blockedServiceUUIDFragments: [String] = [
        "FE59",                                  // Nordic Secure DFU (assigned 0xFE59)
        "00001530-1212-EFDE-1523-785FEABCD123",  // Nordic legacy DFU service
        "0000FE59",                              // Nordic Secure DFU, 128-bit form
        "F000FFC0",                              // TI OAD (over-the-air download)
        "0000FEED",                              // commonly seen OTA service
        "8E400001",                              // some vendor OTA stacks
    ]

    /// True if writing to this service should be refused.
    static func isBlocked(serviceUUID: CBUUID) -> Bool {
        let u = serviceUUID.uuidString.uppercased()
        return blockedServiceUUIDFragments.contains { u.contains($0.uppercased()) }
    }

    /// Human-readable reason for a refusal, for logging.
    static func blockReason(serviceUUID: CBUUID) -> String {
        "service \(serviceUUID.uuidString) looks like a firmware/OTA/DFU service — writes refused for safety"
    }
}
