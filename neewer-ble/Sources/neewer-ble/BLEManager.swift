import Foundation
import CoreBluetooth

/// A peripheral seen during scanning, plus the advertisement data we care about.
final class DiscoveredPeripheral {
    let peripheral: CBPeripheral
    var advName: String?
    var rssi: Int
    var advServiceUUIDs: [CBUUID]
    var manufacturerData: Data?
    var lastSeen: Date

    init(peripheral: CBPeripheral, advName: String?, rssi: Int,
         advServiceUUIDs: [CBUUID], manufacturerData: Data?, lastSeen: Date) {
        self.peripheral = peripheral
        self.advName = advName
        self.rssi = rssi
        self.advServiceUUIDs = advServiceUUIDs
        self.manufacturerData = manufacturerData
        self.lastSeen = lastSeen
    }

    /// Best available display name.
    var displayName: String { advName ?? peripheral.name ?? "(unnamed)" }

    /// Heuristic only — NOT a protocol assumption. Flags a device as a likely
    /// NEEWER for the operator's convenience, based on advertised name or the
    /// service UUID prefix NEEWER firmwares are commonly seen using. Connection
    /// and all commands still treat it as an unknown device.
    var likelyNeewer: Bool {
        let n = displayName.lowercased()
        if n.contains("neewer") || n.contains("nwr") || n.hasPrefix("nw-") { return true }
        return advServiceUUIDs.contains { $0.uuidString.uppercased().hasPrefix("69400001") }
    }
}

/// Callbacks are delivered on `queue` (a private serial queue). The REPL runs on
/// the main thread and bridges to these async APIs with a semaphore, which is
/// safe because the two never run on the same queue.
final class BLEManager: NSObject {
    private let queue = DispatchQueue(label: "neewer-ble.central")
    private var central: CBCentralManager!

    // Discovery state (guarded by `queue`).
    private(set) var ordered: [UUID] = []
    private(set) var discovered: [UUID: DiscoveredPeripheral] = [:]

    // Connection state.
    private(set) var connected: CBPeripheral?
    /// Flat, index-stable list of (service, characteristic) for the connected
    /// device, populated after discovery. The REPL addresses characteristics by
    /// their index in this list.
    private(set) var flatChars: [(service: CBService, char: CBCharacteristic)] = []
    private var latestValues: [CBUUID: Data] = [:]

    // Pending async operations.
    private var onPoweredOn: (() -> Void)?
    private var pendingCharServices = 0
    private var onDiscoveryComplete: ((Result<Void, Error>) -> Void)?
    private var onConnect: ((Result<Void, Error>) -> Void)?
    private var readCompletions: [CBUUID: (Result<Data, Error>) -> Void] = [:]
    private var writeCompletions: [CBUUID: (Error?) -> Void] = [:]

    /// Last write that returned success — used by `save`.
    private(set) var lastSuccessfulWrite: (service: CBUUID, char: CBUUID, data: Data, withResponse: Bool)?

    /// Called when a notify/indicate characteristic delivers data, so the REPL
    /// can log responses while reverse-engineering. Invoked on `queue`.
    var onNotification: ((CBUUID, Data) -> Void)?

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: queue)
    }

    // MARK: - Public API (all completions fire on `queue`)

    var state: CBManagerState { central.state }

    /// Run a block synchronously on the central queue (used by report building).
    func onQueueSync<T>(_ work: () -> T) -> T { queue.sync(execute: work) }

    /// Snapshot of read values. Must be called from within `onQueueSync`.
    func latestValuesSnapshot() -> [CBUUID: Data] { latestValues }

    /// Run `completion` once Bluetooth is powered on (immediately if already).
    func whenReady(_ completion: @escaping () -> Void) {
        queue.async {
            if self.central.state == .poweredOn {
                completion()
            } else {
                self.onPoweredOn = completion
            }
        }
    }

    func startScan() {
        queue.async {
            // Scan for everything; we do not assume any NEEWER service UUID.
            self.central.scanForPeripherals(withServices: nil,
                options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
        }
    }

    func stopScan() {
        queue.async { self.central.stopScan() }
    }

    /// Thread-safe snapshot of discovered devices in stable index order.
    func snapshot() -> [(index: Int, device: DiscoveredPeripheral)] {
        queue.sync {
            ordered.enumerated().compactMap { idx, id in
                discovered[id].map { (idx, $0) }
            }
        }
    }

    func device(at index: Int) -> DiscoveredPeripheral? {
        queue.sync {
            guard index >= 0, index < ordered.count else { return nil }
            return discovered[ordered[index]]
        }
    }

    /// Connect, discover all services/characteristics, auto-read readables and
    /// subscribe to notifications. `completion` fires after discovery settles.
    func connect(_ device: DiscoveredPeripheral,
                 completion: @escaping (Result<Void, Error>) -> Void) {
        queue.async {
            self.central.stopScan()
            self.flatChars = []
            self.latestValues = [:]
            self.onConnect = completion
            device.peripheral.delegate = self
            self.central.connect(device.peripheral, options: nil)
        }
    }

    func disconnect() {
        queue.async {
            if let p = self.connected { self.central.cancelPeripheralConnection(p) }
        }
    }

    /// Snapshot of the connected device's flat characteristic list for display.
    func connectedChars() -> [(index: Int, service: CBUUID, char: CBUUID, props: CBCharacteristicProperties, value: Data?)] {
        queue.sync {
            flatChars.enumerated().map { idx, pair in
                (idx, pair.service.uuid, pair.char.uuid, pair.char.properties, latestValues[pair.char.uuid])
            }
        }
    }

    func read(charIndex: Int, completion: @escaping (Result<Data, Error>) -> Void) {
        queue.async {
            guard charIndex >= 0, charIndex < self.flatChars.count else {
                completion(.failure(BLEError.badIndex)); return
            }
            let pair = self.flatChars[charIndex]
            guard pair.char.properties.contains(.read) else {
                completion(.failure(BLEError.notReadable)); return
            }
            self.readCompletions[pair.char.uuid] = completion
            self.connected?.readValue(for: pair.char)
        }
    }

    /// Write raw bytes to a characteristic by index. Refuses OTA/DFU services.
    func write(charIndex: Int, data: Data, completion: @escaping (Error?) -> Void) {
        queue.async {
            guard charIndex >= 0, charIndex < self.flatChars.count else {
                completion(BLEError.badIndex); return
            }
            let pair = self.flatChars[charIndex]
            self.writeResolved(service: pair.service, char: pair.char, data: data, completion: completion)
        }
    }

    /// Write to a characteristic addressed by service+characteristic UUID
    /// (used by saved commands and gated helpers).
    func write(serviceUUID: String, charUUID: String, data: Data, completion: @escaping (Error?) -> Void) {
        queue.async {
            guard let pair = self.flatChars.first(where: {
                $0.service.uuid == CBUUID(string: serviceUUID) && $0.char.uuid == CBUUID(string: charUUID)
            }) else {
                completion(BLEError.charNotFound); return
            }
            self.writeResolved(service: pair.service, char: pair.char, data: data, completion: completion)
        }
    }

    // MARK: - Internal

    private func writeResolved(service: CBService, char: CBCharacteristic,
                               data: Data, completion: @escaping (Error?) -> Void) {
        // Safety gate: never write to firmware/OTA/DFU services.
        if Safety.isBlocked(serviceUUID: service.uuid) {
            completion(BLEError.blocked(Safety.blockReason(serviceUUID: service.uuid)))
            return
        }
        let canWithResponse = char.properties.contains(.write)
        let canWithoutResponse = char.properties.contains(.writeWithoutResponse)
        guard canWithResponse || canWithoutResponse else {
            completion(BLEError.notWritable); return
        }
        // NEEWER lights act on write-WITHOUT-response; prefer it when offered.
        // Fall back to write-with-response only when that's all the char supports.
        if canWithResponse && !canWithoutResponse {
            writeCompletions[char.uuid] = { [weak self] err in
                if err == nil {
                    self?.lastSuccessfulWrite = (service.uuid, char.uuid, data, true)
                }
                completion(err)
            }
            connected?.writeValue(data, for: char, type: .withResponse)
        } else {
            // No ACK available; report success optimistically once dispatched.
            connected?.writeValue(data, for: char, type: .withoutResponse)
            lastSuccessfulWrite = (service.uuid, char.uuid, data, false)
            completion(nil)
        }
    }

    private func finishDiscovery(_ result: Result<Void, Error>) {
        let cb = onConnect
        onConnect = nil
        cb?(result)
    }
}

enum BLEError: LocalizedError {
    case badIndex
    case notReadable
    case notWritable
    case charNotFound
    case blocked(String)
    case bluetoothUnavailable(String)

    var errorDescription: String? {
        switch self {
        case .badIndex: return "no characteristic at that index"
        case .notReadable: return "characteristic is not readable"
        case .notWritable: return "characteristic is not writable"
        case .charNotFound: return "characteristic not found on connected device"
        case .blocked(let why): return why
        case .bluetoothUnavailable(let why): return why
        }
    }
}

// MARK: - CBCentralManagerDelegate

extension BLEManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            let cb = onPoweredOn
            onPoweredOn = nil
            cb?()
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any], rssi RSSI: NSNumber) {
        let id = peripheral.identifier
        let advName = advertisementData[CBAdvertisementDataLocalNameKey] as? String
        let services = advertisementData[CBAdvertisementDataServiceUUIDsKey] as? [CBUUID] ?? []
        let mfg = advertisementData[CBAdvertisementDataManufacturerDataKey] as? Data

        if let existing = discovered[id] {
            existing.rssi = RSSI.intValue
            existing.lastSeen = Date()
            if let advName = advName { existing.advName = advName }
            if !services.isEmpty { existing.advServiceUUIDs = services }
            if let mfg = mfg { existing.manufacturerData = mfg }
        } else {
            let d = DiscoveredPeripheral(peripheral: peripheral, advName: advName,
                                         rssi: RSSI.intValue, advServiceUUIDs: services,
                                         manufacturerData: mfg, lastSeen: Date())
            discovered[id] = d
            ordered.append(id)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        connected = peripheral
        peripheral.delegate = self
        peripheral.discoverServices(nil)
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        finishDiscovery(.failure(error ?? BLEError.bluetoothUnavailable("failed to connect")))
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        if connected?.identifier == peripheral.identifier {
            connected = nil
            flatChars = []
        }
    }
}

// MARK: - CBPeripheralDelegate

extension BLEManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error = error { finishDiscovery(.failure(error)); return }
        let services = peripheral.services ?? []
        pendingCharServices = services.count
        if services.isEmpty { finishDiscovery(.success(())); return }
        for service in services {
            peripheral.discoverCharacteristics(nil, for: service)
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let chars = service.characteristics {
            for c in chars {
                flatChars.append((service, c))
                if c.properties.contains(.read) {
                    peripheral.readValue(for: c)
                }
                if c.properties.contains(.notify) || c.properties.contains(.indicate) {
                    peripheral.setNotifyValue(true, for: c)
                }
                peripheral.discoverDescriptors(for: c)
            }
        }
        pendingCharServices -= 1
        if pendingCharServices <= 0 {
            // Give auto-reads a brief moment to land, then report ready.
            queue.asyncAfter(deadline: .now() + 1.2) {
                self.finishDiscovery(.success(()))
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverDescriptorsFor characteristic: CBCharacteristic, error: Error?) {
        // Descriptors are read lazily on demand; presence is enough for the report.
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        let uuid = characteristic.uuid
        if let value = characteristic.value {
            latestValues[uuid] = value
            // Route to an explicit read completion if one is waiting…
            if let cb = readCompletions.removeValue(forKey: uuid) {
                if let error = error { cb(.failure(error)) } else { cb(.success(value)) }
            } else if characteristic.isNotifying {
                // …otherwise this is an unsolicited notification: log it.
                onNotification?(uuid, value)
            }
        } else if let error = error, let cb = readCompletions.removeValue(forKey: uuid) {
            cb(.failure(error))
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        if let cb = writeCompletions.removeValue(forKey: characteristic.uuid) {
            cb(error)
        }
    }
}
