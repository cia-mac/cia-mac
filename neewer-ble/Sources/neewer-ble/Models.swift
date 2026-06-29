import Foundation
import CoreBluetooth

// MARK: - JSON report models (Phase 1 export)

/// One GATT characteristic as captured in the exported report.
struct CharacteristicReport: Codable {
    let uuid: String
    let properties: [String]
    let readable: Bool
    let writableWithResponse: Bool
    let writableWithoutResponse: Bool
    let notify: Bool
    let indicate: Bool
    var lastValueHex: String?
    var lastValueUTF8: String?
    var descriptors: [String]
}

/// One GATT service plus its characteristics.
struct ServiceReport: Codable {
    let uuid: String
    let isPrimary: Bool
    var blockedForWrites: Bool
    var characteristics: [CharacteristicReport]
}

/// Full device report exported to JSON.
struct DeviceReport: Codable {
    let name: String?
    let identifier: String
    let rssi: Int
    let likelyNeewer: Bool
    let advertisedServiceUUIDs: [String]
    let manufacturerDataHex: String?
    var services: [ServiceReport]
    let generatedAt: String
}

// MARK: - CoreBluetooth property formatting

extension CBCharacteristicProperties {
    /// Human-readable list of the property flags set on a characteristic.
    var labels: [String] {
        var out: [String] = []
        if contains(.broadcast) { out.append("broadcast") }
        if contains(.read) { out.append("read") }
        if contains(.writeWithoutResponse) { out.append("writeWithoutResponse") }
        if contains(.write) { out.append("write") }
        if contains(.notify) { out.append("notify") }
        if contains(.indicate) { out.append("indicate") }
        if contains(.authenticatedSignedWrites) { out.append("authenticatedSignedWrites") }
        if contains(.extendedProperties) { out.append("extendedProperties") }
        return out
    }
}
