import Foundation

/// A write that worked, saved so the operator can replay it by name while
/// reverse-engineering the protocol.
struct SavedCommand: Codable {
    let name: String
    let serviceUUID: String
    let characteristicUUID: String
    let payloadHex: String
    let withResponse: Bool
    var note: String?
    let savedAt: String
}

/// The protocol profile gates the high-level helpers (brightness / RGB / CCT).
///
/// By design these helpers are DISABLED until `confirmed == true`. The operator
/// is expected to:
///   1. Use raw `write <char> <hex>` to find payloads that actually drive the
///      light (Phase 2 discovery).
///   2. Fill in the templates below from what worked.
///   3. Run `protocol confirm` to flip the gate.
/// Only then do `brightness` / `rgb` / `cct` become callable. We never assume
/// the NEEWER protocol up front.
struct ProtocolProfile: Codable {
    var confirmed: Bool
    var writeServiceUUID: String?
    var writeCharacteristicUUID: String?
    /// Templates use `{value}` (brightness), `{r}` `{g}` `{b}` (color),
    /// `{cct}` `{brightness}` (color temperature). Each placeholder is replaced
    /// by the value clamped to a single byte (00..ff). Literal hex bytes pass
    /// through unchanged, e.g. `78 86 03 {r} {g} {b}`.
    var brightnessTemplate: String?
    var rgbTemplate: String?
    var cctTemplate: String?
    /// Optional trailing checksum appended after substitution. Supported:
    /// `"sum8"` (low byte of the sum of all preceding bytes). `nil` = none.
    var checksum: String?

    static var empty: ProtocolProfile {
        ProtocolProfile(confirmed: false,
                        writeServiceUUID: nil,
                        writeCharacteristicUUID: nil,
                        brightnessTemplate: nil,
                        rgbTemplate: nil,
                        cctTemplate: nil,
                        checksum: nil)
    }

    /// Render a template into bytes by substituting `{name}` placeholders, then
    /// applying the optional checksum. Returns nil if any placeholder is left
    /// unfilled or the result isn't valid hex.
    func render(_ template: String, values: [String: Int]) -> Data? {
        var s = template
        for (key, raw) in values {
            let byte = max(0, min(255, raw))
            s = s.replacingOccurrences(of: "{\(key)}", with: String(format: "%02x", byte))
        }
        guard !s.contains("{") else { return nil }
        guard var data = Hex.data(from: s) else { return nil }
        if checksum == "sum8" {
            let sum = data.reduce(UInt32(0)) { $0 &+ UInt32($1) }
            data.append(UInt8(sum & 0xff))
        }
        return data
    }
}

/// On-disk persistence for saved commands, the protocol profile, and exported
/// reports. Everything lives under `./neewer-data/` (gitignored) so a session's
/// findings survive across runs but never leave the machine.
final class Store {
    let root: URL
    private let commandsURL: URL
    private let profileURL: URL
    let reportsDir: URL

    init(root: URL = URL(fileURLWithPath: "neewer-data", isDirectory: true)) {
        self.root = root
        self.commandsURL = root.appendingPathComponent("commands.json")
        self.profileURL = root.appendingPathComponent("protocol.json")
        self.reportsDir = root.appendingPathComponent("reports", isDirectory: true)
        try? FileManager.default.createDirectory(at: reportsDir, withIntermediateDirectories: true)
    }

    // MARK: Saved commands

    func loadCommands() -> [SavedCommand] {
        guard let data = try? Data(contentsOf: commandsURL),
              let list = try? JSONDecoder().decode([SavedCommand].self, from: data) else {
            return []
        }
        return list
    }

    func saveCommands(_ list: [SavedCommand]) {
        let enc = JSONEncoder()
        enc.outputFormatting = [.prettyPrinted, .sortedKeys]
        if let data = try? enc.encode(list) {
            try? data.write(to: commandsURL)
        }
    }

    // MARK: Protocol profile

    func loadProfile() -> ProtocolProfile {
        guard let data = try? Data(contentsOf: profileURL),
              let p = try? JSONDecoder().decode(ProtocolProfile.self, from: data) else {
            return .empty
        }
        return p
    }

    func saveProfile(_ profile: ProtocolProfile) {
        let enc = JSONEncoder()
        enc.outputFormatting = [.prettyPrinted, .sortedKeys]
        if let data = try? enc.encode(profile) {
            try? data.write(to: profileURL)
        }
    }

    // MARK: Reports

    /// Write a report to `reports/<name>.json` and return the path.
    @discardableResult
    func writeReport(_ report: DeviceReport, filename: String) -> URL? {
        let enc = JSONEncoder()
        enc.outputFormatting = [.prettyPrinted, .sortedKeys]
        let url = reportsDir.appendingPathComponent(filename)
        guard let data = try? enc.encode(report) else { return nil }
        do {
            try data.write(to: url)
            return url
        } catch {
            return nil
        }
    }
}
