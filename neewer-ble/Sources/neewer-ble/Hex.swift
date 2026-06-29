import Foundation

/// Hex parsing/formatting helpers shared across the CLI.
///
/// Accepts forgiving input so the operator can paste payloads from sniffer logs:
/// `0x12 0xFF`, `12-ff`, `12:ff`, `12ff`, `0x12ff` all parse to the same bytes.
enum Hex {
    /// Parse a forgiving hex string into raw bytes. Returns nil on odd length or
    /// any non-hex character that survives normalization.
    static func data(from raw: String) -> Data? {
        var s = raw.lowercased()
        // Drop common byte prefixes/separators.
        for token in ["0x", " ", "-", ":", ",", "\t", "\n"] {
            s = s.replacingOccurrences(of: token, with: "")
        }
        guard !s.isEmpty else { return nil }
        guard s.count % 2 == 0 else { return nil }
        guard s.allSatisfy({ $0.isHexDigit }) else { return nil }

        var data = Data(capacity: s.count / 2)
        var idx = s.startIndex
        while idx < s.endIndex {
            let next = s.index(idx, offsetBy: 2)
            guard let byte = UInt8(s[idx..<next], radix: 16) else { return nil }
            data.append(byte)
            idx = next
        }
        return data
    }

    /// Space-separated lowercase hex, e.g. `12 ff 03`.
    static func string(_ data: Data) -> String {
        data.map { String(format: "%02x", $0) }.joined(separator: " ")
    }

    /// Compact lowercase hex with no separators, e.g. `12ff03`.
    static func compact(_ data: Data) -> String {
        data.map { String(format: "%02x", $0) }.joined()
    }

    /// Best-effort printable UTF-8 rendering of a value, or nil if it isn't
    /// printable text (control characters / invalid encoding).
    static func printableUTF8(_ data: Data) -> String? {
        guard let s = String(data: data, encoding: .utf8) else { return nil }
        guard s.unicodeScalars.allSatisfy({ $0.value >= 0x20 || $0 == "\n" || $0 == "\t" }) else {
            return nil
        }
        return s
    }
}
