import Foundation
import CoreBluetooth

enum LightMode: String { case cct, color }

/// One discovered Neewer light + its current (optimistic) UI state.
struct Light: Identifiable {
    let id: UUID                 // CBPeripheral.identifier
    var name: String
    var mac: [UInt8]
    var rssi: Int
    var isConnected: Bool = false

    var isOn: Bool = true
    var brightness: Double = 60  // 0...100
    var mode: LightMode = .cct
    var cct: Double = 44         // ×100 K (32...56)
    var hue: Double = 30         // 0...360
    var sat: Double = 100        // 0...100

    var macString: String { NeewerProtocol.macString(mac) }
    var supportsColor: Bool { !name.uppercased().contains("T100") } // T100 tubes are CCT-only
}

/// Scans for, connects to, and drives Neewer lights using the verified new protocol.
final class LightController: NSObject, ObservableObject {
    @Published var lights: [Light] = []
    @Published var isScanning = false
    @Published var bluetoothReady = false

    private var central: CBCentralManager!
    private let writeUUID  = CBUUID(string: "69400002-B5A3-F393-E0A9-E50E24DCCA99")
    private let notifyUUID = CBUUID(string: "69400003-B5A3-F393-E0A9-E50E24DCCA99")
    private let svcUUID    = CBUUID(string: "69400001-B5A3-F393-E0A9-E50E24DCCA99")

    private var peripherals: [UUID: CBPeripheral] = [:]
    private var writeChars:  [UUID: CBCharacteristic] = [:]
    private var macs:        [UUID: [UInt8]] = [:]

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: .main)
    }

    // MARK: Scanning

    func startScan() {
        guard bluetoothReady else { return }
        isScanning = true
        central.scanForPeripherals(withServices: nil,
                                   options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
    }

    func stopScan() {
        central.stopScan()
        isScanning = false
    }

    // MARK: Commands

    private func send(_ data: Data, to id: UUID) {
        guard let p = peripherals[id], let ch = writeChars[id] else { return }
        let type: CBCharacteristicWriteType =
            ch.properties.contains(.writeWithoutResponse) ? .withoutResponse : .withResponse
        p.writeValue(data, for: ch, type: type)
    }

    private var sendWork: [UUID: DispatchWorkItem] = [:]

    /// Coalesce rapid changes (slider / colour-wheel drags) to ~40ms per light,
    /// so a fast drag doesn't flood the radio and jam the connection.
    private func throttledApply(_ id: UUID) {
        sendWork[id]?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, let l = self.lights.first(where: { $0.id == id }) else { return }
            self.rawApply(l)
        }
        sendWork[id] = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.04, execute: work)
    }

    func rawApply(_ light: Light) {
        guard let mac = macs[light.id] else { return }
        if !light.isOn {
            send(NeewerProtocol.power(mac: mac, on: false), to: light.id)
            return
        }
        switch light.mode {
        case .cct:
            send(NeewerProtocol.cct(mac: mac,
                                    brightness: Int(light.brightness),
                                    cct: Int(light.cct)), to: light.id)
        case .color:
            send(NeewerProtocol.hsi(mac: mac,
                                    hue: Int(light.hue),
                                    sat: Int(light.sat),
                                    brightness: Int(light.brightness)), to: light.id)
        }
    }

    func setPower(_ id: UUID, on: Bool) {
        update(id) { $0.isOn = on }
        guard let mac = macs[id] else { return }
        if on {
            if let l = lights.first(where: { $0.id == id }) { rawApply(l) }
            else { send(NeewerProtocol.power(mac: mac, on: true), to: id) }
        } else {
            send(NeewerProtocol.power(mac: mac, on: false), to: id)
        }
    }

    func mutate(_ id: UUID, _ change: (inout Light) -> Void) {
        update(id, change)
        throttledApply(id)
    }

    private func update(_ id: UUID, _ change: (inout Light) -> Void) {
        if let i = lights.firstIndex(where: { $0.id == id }) { change(&lights[i]) }
    }

    // MARK: Scenes (apply to every connected light)

    func sceneAllOff() {
        for l in lights { setPower(l.id, on: false) }
    }

    func sceneDaylight() {
        for l in lights {
            mutate(l.id) { $0.isOn = true; $0.mode = .cct; $0.cct = 56; $0.brightness = 100 }
        }
    }

    /// The "mellow" look: dim, alternating warm orange / amber / purple.
    func sceneMellow() {
        let colorTriples: [(hue: Double, sat: Double, bri: Double)] = [
            (25, 95, 14),   // warm orange
            (32, 95, 13),   // amber
            (282, 90, 12),  // purple
            (300, 88, 12)   // violet
        ]
        var ci = 0
        for l in lights {
            if l.supportsColor {
                let c = colorTriples[ci % colorTriples.count]; ci += 1
                mutate(l.id) {
                    $0.isOn = true; $0.mode = .color
                    $0.hue = c.hue; $0.sat = c.sat; $0.brightness = c.bri
                }
            } else {
                // CCT-only light: dim warm white to match the mood
                mutate(l.id) { $0.isOn = true; $0.mode = .cct; $0.cct = 32; $0.brightness = 12 }
            }
        }
    }
}

// MARK: - CBCentralManagerDelegate

extension LightController: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        bluetoothReady = central.state == .poweredOn
        if bluetoothReady { startScan() }
    }

    func centralManager(_ central: CBCentralManager,
                        didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any],
                        rssi RSSI: NSNumber) {
        let name = peripheral.name
            ?? (advertisementData[CBAdvertisementDataLocalNameKey] as? String)
            ?? ""
        let services = advertisementData[CBAdvertisementDataServiceUUIDsKey] as? [CBUUID] ?? []
        let upper = name.uppercased()
        let looksNeewer = upper.hasPrefix("NEEWER") || upper.hasPrefix("NW-") || services.contains(svcUUID)
        guard looksNeewer else { return }

        guard let mfg = advertisementData[CBAdvertisementDataManufacturerDataKey] as? Data,
              let mac = NeewerProtocol.mac(fromManufacturerData: mfg) else { return }

        let id = peripheral.identifier
        macs[id] = mac
        if peripherals[id] == nil {
            peripheral.delegate = self
            peripherals[id] = peripheral
        }

        if let i = lights.firstIndex(where: { $0.id == id }) {
            lights[i].rssi = RSSI.intValue
            lights[i].name = name.isEmpty ? lights[i].name : name
        } else {
            lights.append(Light(id: id, name: name.isEmpty ? "Neewer light" : name,
                                mac: mac, rssi: RSSI.intValue))
            lights.sort { $0.rssi > $1.rssi }
        }
        central.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        update(peripheral.identifier) { $0.isConnected = true }
        peripheral.discoverServices([svcUUID])
    }

    func centralManager(_ central: CBCentralManager,
                        didDisconnectPeripheral peripheral: CBPeripheral,
                        error: Error?) {
        update(peripheral.identifier) { $0.isConnected = false }
        writeChars[peripheral.identifier] = nil
        // lights are sticky; try to reconnect so control survives a brief drop
        central.connect(peripheral, options: nil)
    }
}

// MARK: - CBPeripheralDelegate

extension LightController: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        for s in peripheral.services ?? [] where s.uuid == svcUUID {
            peripheral.discoverCharacteristics([writeUUID, notifyUUID], for: s)
        }
    }

    func peripheral(_ peripheral: CBPeripheral,
                    didDiscoverCharacteristicsFor service: CBService,
                    error: Error?) {
        for c in service.characteristics ?? [] {
            if c.uuid == writeUUID { writeChars[peripheral.identifier] = c }
            if c.uuid == notifyUUID { peripheral.setNotifyValue(true, for: c) }
        }
    }
}
