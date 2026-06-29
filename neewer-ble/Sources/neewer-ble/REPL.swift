import Foundation
import CoreBluetooth

/// Interactive command loop. Runs on the main thread; BLE callbacks arrive on
/// the manager's private queue. Blocking operations bridge with a semaphore.
final class REPL {
    private let ble: BLEManager
    private let store: Store
    private var profile: ProtocolProfile
    private var commands: [SavedCommand]
    private var connectedDevice: DiscoveredPeripheral?

    init(ble: BLEManager, store: Store) {
        self.ble = ble
        self.store = store
        self.profile = store.loadProfile()
        self.commands = store.loadCommands()

        // Log notifications/indications as they arrive — invaluable when
        // reverse-engineering responses.
        ble.onNotification = { uuid, data in
            let utf8 = Hex.printableUTF8(data).map { " (\"\($0)\")" } ?? ""
            print("\n  📥 notify \(uuid.uuidString): \(Hex.string(data))\(utf8)")
            print("> ", terminator: "")
            fflush(stdout)
        }
    }

    // MARK: - Run loop

    func run() {
        printBanner()
        guard waitForPowerOn() else { return }
        print("Bluetooth ready. Type `help` for commands, `scan` to begin.\n")

        while true {
            print("> ", terminator: "")
            fflush(stdout)
            guard let line = readLine() else { break } // EOF (Ctrl-D)
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty { continue }
            if handle(trimmed) == .quit { break }
        }
        print("bye.")
    }

    private enum Outcome { case ok, quit }

    private func handle(_ line: String) -> Outcome {
        var parts = line.split(separator: " ", omittingEmptySubsequences: true).map(String.init)
        let cmd = parts.removeFirst().lowercased()
        let args = parts

        switch cmd {
        case "help", "?":      printHelp()
        case "scan":           cmdScan(args)
        case "stop":           ble.stopScan(); print("scan stopped.")
        case "list", "ls":     cmdList()
        case "info":           cmdInfo(args)
        case "connect":        cmdConnect(args)
        case "services", "chars": cmdServices()
        case "read":           cmdRead(args)
        case "write":          cmdWrite(args)
        case "save":           cmdSave(args)
        case "commands":       cmdCommands()
        case "run":            cmdRun(args)
        case "export":         cmdExport(args)
        case "protocol":       cmdProtocol(args)
        case "brightness":     cmdBrightness(args)
        case "rgb":            cmdRGB(args)
        case "cct":            cmdCCT(args)
        case "disconnect":     ble.disconnect(); connectedDevice = nil; print("disconnected.")
        case "quit", "exit", "q": return .quit
        default:               print("unknown command `\(cmd)` — type `help`.")
        }
        return .ok
    }

    // MARK: - Phase 1 commands

    private func cmdScan(_ args: [String]) {
        ble.startScan()
        if let first = args.first, let secs = Double(first) {
            print("scanning for \(secs)s …")
            usleep(useconds_t(secs * 1_000_000))
            ble.stopScan()
            cmdList()
        } else {
            print("scanning… (run `list` to see devices, `stop` to stop)")
        }
    }

    private func cmdList() {
        let devices = ble.snapshot()
        if devices.isEmpty { print("no devices yet. `scan` first."); return }
        print("idx  rssi  neewer?  name / uuid")
        for (idx, d) in devices {
            let flag = d.likelyNeewer ? "  ★    " : "       "
            print(String(format: "%3d  %4d %@ %@", idx, d.rssi, flag, d.displayName))
            print("                     \(d.peripheral.identifier.uuidString)")
        }
        print("(★ = likely NEEWER by name/service heuristic, not a protocol assumption)")
    }

    private func cmdInfo(_ args: [String]) {
        guard let idx = args.first.flatMap({ Int($0) }), let d = ble.device(at: idx) else {
            print("usage: info <idx>"); return
        }
        print("name:        \(d.displayName)")
        print("identifier:  \(d.peripheral.identifier.uuidString)")
        print("rssi:        \(d.rssi)")
        print("likelyNeewer:\(d.likelyNeewer)")
        print("adv services:\(d.advServiceUUIDs.map { $0.uuidString }.joined(separator: ", "))")
        if let mfg = d.manufacturerData {
            print("mfg data:    \(Hex.string(mfg))")
        }
    }

    private func cmdConnect(_ args: [String]) {
        guard let idx = args.first.flatMap({ Int($0) }), let d = ble.device(at: idx) else {
            print("usage: connect <idx>"); return
        }
        print("connecting to \(d.displayName) … (discovering services)")
        let sem = DispatchSemaphore(value: 0)
        var outcome: Result<Void, Error> = .failure(BLEError.bluetoothUnavailable("timeout"))
        ble.connect(d) { result in outcome = result; sem.signal() }
        if sem.wait(timeout: .now() + 20) == .timedOut {
            print("connect timed out."); return
        }
        switch outcome {
        case .success:
            connectedDevice = d
            print("connected. discovered \(ble.connectedChars().count) characteristics.")
            cmdServices()
        case .failure(let e):
            print("connect failed: \(e.localizedDescription)")
        }
    }

    private func cmdServices() {
        guard connectedDevice != nil else { print("not connected."); return }
        let chars = ble.connectedChars()
        if chars.isEmpty { print("no characteristics."); return }
        var lastService: CBUUID?
        for c in chars {
            if c.service != lastService {
                let blocked = Safety.isBlocked(serviceUUID: c.service) ? "  ⛔ writes blocked (OTA/DFU)" : ""
                print("\nservice \(c.service.uuidString)\(blocked)")
                lastService = c.service
            }
            let props = c.props.labels.joined(separator: ",")
            var line = String(format: "  [%2d] %@  {%@}", c.index, c.char.uuidString, props)
            if let v = c.value {
                line += "  = \(Hex.string(v))"
                if let s = Hex.printableUTF8(v) { line += " (\"\(s)\")" }
            }
            print(line)
        }
        print("\nwrite with: write <idx> <hex>   read with: read <idx>")
    }

    private func cmdRead(_ args: [String]) {
        guard connectedDevice != nil else { print("not connected."); return }
        guard let idx = args.first.flatMap({ Int($0) }) else { print("usage: read <idx>"); return }
        let sem = DispatchSemaphore(value: 0)
        var outcome: Result<Data, Error> = .failure(BLEError.badIndex)
        ble.read(charIndex: idx) { r in outcome = r; sem.signal() }
        if sem.wait(timeout: .now() + 8) == .timedOut { print("read timed out."); return }
        switch outcome {
        case .success(let data):
            var msg = "value: \(Hex.string(data))"
            if let s = Hex.printableUTF8(data) { msg += " (\"\(s)\")" }
            print(msg)
        case .failure(let e):
            print("read failed: \(e.localizedDescription)")
        }
    }

    // MARK: - Phase 2: raw write + saved commands

    private func cmdWrite(_ args: [String]) {
        guard connectedDevice != nil else { print("not connected."); return }
        guard args.count >= 2, let idx = Int(args[0]) else {
            print("usage: write <idx> <hex>   e.g. write 4 78 86 03 64"); return
        }
        let hexStr = args.dropFirst().joined(separator: " ")
        guard let data = Hex.data(from: hexStr) else {
            print("could not parse hex: `\(hexStr)`"); return
        }
        writeData(charIndex: idx, data: data)
    }

    private func writeData(charIndex: Int, data: Data) {
        print("writing \(Hex.string(data)) → [\(charIndex)] …")
        let sem = DispatchSemaphore(value: 0)
        var err: Error?
        ble.write(charIndex: charIndex, data: data) { e in err = e; sem.signal() }
        if sem.wait(timeout: .now() + 8) == .timedOut { print("write timed out."); return }
        if let err = err {
            print("write failed: \(err.localizedDescription)")
        } else {
            print("write OK. (use `save <name>` to keep this command)")
        }
    }

    private func cmdSave(_ args: [String]) {
        guard let last = ble.lastSuccessfulWrite else {
            print("no successful write to save yet."); return
        }
        guard let name = args.first else { print("usage: save <name> [note]"); return }
        if commands.contains(where: { $0.name == name }) {
            print("a command named `\(name)` already exists. pick another name."); return
        }
        let note = args.count > 1 ? args.dropFirst().joined(separator: " ") : nil
        let iso = ISO8601DateFormatter()
        let cmd = SavedCommand(name: name,
                               serviceUUID: last.service.uuidString,
                               characteristicUUID: last.char.uuidString,
                               payloadHex: Hex.string(last.data),
                               withResponse: last.withResponse,
                               note: note,
                               savedAt: iso.string(from: Date()))
        commands.append(cmd)
        store.saveCommands(commands)
        print("saved `\(name)` → \(cmd.payloadHex) on \(cmd.characteristicUUID)")
    }

    private func cmdCommands() {
        if commands.isEmpty { print("no saved commands."); return }
        for c in commands {
            var line = "  \(c.name): \(c.payloadHex) → char \(c.characteristicUUID)"
            if let n = c.note { line += "  // \(n)" }
            print(line)
        }
    }

    private func cmdRun(_ args: [String]) {
        guard connectedDevice != nil else { print("not connected."); return }
        guard let name = args.first, let cmd = commands.first(where: { $0.name == name }) else {
            print("usage: run <name>  (see `commands`)"); return
        }
        guard let data = Hex.data(from: cmd.payloadHex) else { print("saved payload is invalid hex."); return }
        print("running `\(name)`: \(cmd.payloadHex) → \(cmd.characteristicUUID)")
        let sem = DispatchSemaphore(value: 0)
        var err: Error?
        ble.write(serviceUUID: cmd.serviceUUID, charUUID: cmd.characteristicUUID, data: data) { e in
            err = e; sem.signal()
        }
        if sem.wait(timeout: .now() + 8) == .timedOut { print("run timed out."); return }
        print(err == nil ? "OK." : "failed: \(err!.localizedDescription)")
    }

    private func cmdExport(_ args: [String]) {
        guard let device = connectedDevice else {
            print("connect to a device first — export captures the connected device's services."); return
        }
        let report = ble.buildReport(for: device)
        let safeName = device.displayName.replacingOccurrences(of: " ", with: "_")
            .components(separatedBy: CharacterSet.alphanumerics.inverted).joined()
        let filename = args.first ?? "\(safeName.isEmpty ? "device" : safeName).json"
        if let url = store.writeReport(report, filename: filename) {
            print("exported report → \(url.path)")
        } else {
            print("failed to write report.")
        }
    }

    // MARK: - Protocol profile + gated helpers

    private func cmdProtocol(_ args: [String]) {
        guard let sub = args.first?.lowercased() else { printProtocol(); return }
        let rest = Array(args.dropFirst())
        switch sub {
        case "show":    printProtocol()
        case "confirm": confirmProtocol()
        case "reset":   profile = .empty; store.saveProfile(profile); print("protocol profile reset (helpers disabled).")
        case "set":     protocolSet(rest)
        default:        print("usage: protocol [show|set|confirm|reset]")
        }
    }

    private func protocolSet(_ args: [String]) {
        guard args.count >= 2 else {
            print("""
            usage: protocol set <field> <value>
              service <uuid>          characteristic's service for helper writes
              char <uuid>             characteristic to write helpers to
              brightness <template>   e.g. 78 86 01 {value}
              rgb <template>          e.g. 78 86 03 {r} {g} {b}
              cct <template>          e.g. 78 86 02 {cct} {brightness}
              checksum <none|sum8>    optional trailing checksum byte
            """)
            return
        }
        let field = args[0].lowercased()
        let value = args.dropFirst().joined(separator: " ")
        switch field {
        case "service":   profile.writeServiceUUID = value
        case "char":      profile.writeCharacteristicUUID = value
        case "brightness":profile.brightnessTemplate = value
        case "rgb":       profile.rgbTemplate = value
        case "cct":       profile.cctTemplate = value
        case "checksum":  profile.checksum = (value.lowercased() == "none") ? nil : value.lowercased()
        default:          print("unknown field `\(field)`"); return
        }
        // Editing a field invalidates confirmation — operator must re-confirm.
        profile.confirmed = false
        store.saveProfile(profile)
        print("set \(field). NOTE: helpers re-disabled until you `protocol confirm`.")
    }

    private func confirmProtocol() {
        guard profile.writeServiceUUID != nil, profile.writeCharacteristicUUID != nil else {
            print("set `service` and `char` first."); return
        }
        guard profile.brightnessTemplate != nil || profile.rgbTemplate != nil || profile.cctTemplate != nil else {
            print("set at least one of brightness/rgb/cct templates first."); return
        }
        profile.confirmed = true
        store.saveProfile(profile)
        print("✅ protocol confirmed. brightness / rgb / cct helpers are now enabled.")
    }

    private func printProtocol() {
        print("protocol profile (\(profile.confirmed ? "CONFIRMED — helpers enabled" : "UNCONFIRMED — helpers disabled")):")
        print("  service:    \(profile.writeServiceUUID ?? "—")")
        print("  char:       \(profile.writeCharacteristicUUID ?? "—")")
        print("  brightness: \(profile.brightnessTemplate ?? "—")")
        print("  rgb:        \(profile.rgbTemplate ?? "—")")
        print("  cct:        \(profile.cctTemplate ?? "—")")
        print("  checksum:   \(profile.checksum ?? "none")")
        if !profile.confirmed {
            print("\n  Helpers stay disabled until you confirm a protocol you verified by hand:")
            print("    1) find working payloads with `write <idx> <hex>`")
            print("    2) protocol set service/char/brightness/rgb/cct …")
            print("    3) protocol confirm")
        }
    }

    /// Shared gate for the high-level helpers.
    private func gatedWrite(_ template: String?, values: [String: Int], label: String) {
        guard connectedDevice != nil else { print("not connected."); return }
        guard profile.confirmed else {
            print("⛔ \(label) is disabled — protocol not confirmed. See `protocol show`."); return
        }
        guard let template = template else {
            print("⛔ no \(label) template set. `protocol set \(label) <template>`"); return
        }
        guard let service = profile.writeServiceUUID, let char = profile.writeCharacteristicUUID else {
            print("⛔ protocol service/char not set."); return
        }
        guard let data = profile.render(template, values: values) else {
            print("could not render \(label) template (unfilled placeholder or bad hex)."); return
        }
        print("\(label): \(Hex.string(data)) → \(char)")
        let sem = DispatchSemaphore(value: 0)
        var err: Error?
        ble.write(serviceUUID: service, charUUID: char, data: data) { e in err = e; sem.signal() }
        if sem.wait(timeout: .now() + 8) == .timedOut { print("\(label) timed out."); return }
        print(err == nil ? "OK." : "failed: \(err!.localizedDescription)")
    }

    private func cmdBrightness(_ args: [String]) {
        guard let v = args.first.flatMap({ Int($0) }), (0...100).contains(v) else {
            print("usage: brightness <0-100>"); return
        }
        gatedWrite(profile.brightnessTemplate, values: ["value": v, "brightness": v], label: "brightness")
    }

    private func cmdRGB(_ args: [String]) {
        guard args.count >= 3,
              let r = Int(args[0]), let g = Int(args[1]), let b = Int(args[2]),
              [r, g, b].allSatisfy({ (0...255).contains($0) }) else {
            print("usage: rgb <r 0-255> <g 0-255> <b 0-255>"); return
        }
        gatedWrite(profile.rgbTemplate, values: ["r": r, "g": g, "b": b], label: "rgb")
    }

    private func cmdCCT(_ args: [String]) {
        // `value` is a single byte the operator confirmed maps to a colour
        // temperature on their light (e.g. 32 → 3200K). We do not assume units.
        guard let cct = args.first.flatMap({ Int($0) }) else {
            print("usage: cct <byte 0-255> [brightness 0-100]"); return
        }
        let bri = args.count > 1 ? (Int(args[1]) ?? 0) : 0
        gatedWrite(profile.cctTemplate, values: ["cct": cct, "brightness": bri], label: "cct")
    }

    // MARK: - Startup helpers

    private func waitForPowerOn() -> Bool {
        switch ble.state {
        case .poweredOn: return true
        case .unauthorized:
            print("""
            ⛔ Bluetooth permission denied for this terminal.
               Grant it in System Settings → Privacy & Security → Bluetooth,
               add your terminal app, then re-run.
            """)
            return false
        case .unsupported:
            print("⛔ Bluetooth LE not supported on this machine."); return false
        default:
            break
        }
        print("waiting for Bluetooth to power on …")
        let sem = DispatchSemaphore(value: 0)
        ble.whenReady { sem.signal() }
        if sem.wait(timeout: .now() + 10) == .timedOut {
            print("""
            ⛔ Bluetooth did not power on. Make sure it's turned on, and that this
               terminal has Bluetooth permission (System Settings → Privacy & Security
               → Bluetooth).
            """)
            return false
        }
        return true
    }

    private func printBanner() {
        print("""
        ┌──────────────────────────────────────────────┐
        │  neewer-ble — Mac-first BLE controller (proto) │
        │  local only · safe writes · no protocol guess  │
        └──────────────────────────────────────────────┘
        """)
    }

    private func printHelp() {
        print("""
        Phase 1 — discovery & logging
          scan [seconds]      start scanning (optionally for N seconds then list)
          stop                stop scanning
          list                list discovered devices (★ = likely NEEWER)
          info <idx>          advertisement details for a device
          connect <idx>       connect + discover services/characteristics
          services            list services/characteristics of connected device
          read <idx>          read a characteristic's value
          export [file]       write JSON report of connected device → neewer-data/reports/

        Phase 2 — command test panel
          write <idx> <hex>   write raw hex to a characteristic (safe svcs only)
          save <name> [note]  save the last successful write
          commands            list saved commands
          run <name>          replay a saved command
          protocol show       show protocol profile + gating status
          protocol set …      set service/char/brightness/rgb/cct/checksum
          protocol confirm    enable helpers once you've verified the protocol
          brightness <0-100>  GATED until `protocol confirm`
          rgb <r> <g> <b>     GATED until `protocol confirm`
          cct <byte> [bri]    GATED until `protocol confirm`

          disconnect          drop the connection
          quit                exit
        """)
    }
}
