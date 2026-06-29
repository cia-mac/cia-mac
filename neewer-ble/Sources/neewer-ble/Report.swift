import Foundation
import CoreBluetooth

extension BLEManager {
    /// Build a JSON-ready report of the connected device from discovered
    /// services/characteristics and whatever values have been read so far.
    func buildReport(for device: DiscoveredPeripheral) -> DeviceReport {
        // Read CoreBluetooth state on the central queue for thread safety.
        let (services, values) = onQueueSync { () -> ([CBService], [CBUUID: Data]) in
            (self.connected?.services ?? [], self.latestValuesSnapshot())
        }

        var serviceReports: [ServiceReport] = []
        for service in services {
            var charReports: [CharacteristicReport] = []
            for c in service.characteristics ?? [] {
                let value = values[c.uuid]
                charReports.append(CharacteristicReport(
                    uuid: c.uuid.uuidString,
                    properties: c.properties.labels,
                    readable: c.properties.contains(.read),
                    writableWithResponse: c.properties.contains(.write),
                    writableWithoutResponse: c.properties.contains(.writeWithoutResponse),
                    notify: c.properties.contains(.notify),
                    indicate: c.properties.contains(.indicate),
                    lastValueHex: value.map { Hex.string($0) },
                    lastValueUTF8: value.flatMap { Hex.printableUTF8($0) },
                    descriptors: (c.descriptors ?? []).map { $0.uuid.uuidString }
                ))
            }
            serviceReports.append(ServiceReport(
                uuid: service.uuid.uuidString,
                isPrimary: service.isPrimary,
                blockedForWrites: Safety.isBlocked(serviceUUID: service.uuid),
                characteristics: charReports
            ))
        }

        let iso = ISO8601DateFormatter()
        return DeviceReport(
            name: device.displayName,
            identifier: device.peripheral.identifier.uuidString,
            rssi: device.rssi,
            likelyNeewer: device.likelyNeewer,
            advertisedServiceUUIDs: device.advServiceUUIDs.map { $0.uuidString },
            manufacturerDataHex: device.manufacturerData.map { Hex.string($0) },
            services: serviceReports,
            generatedAt: iso.string(from: Date())
        )
    }
}
