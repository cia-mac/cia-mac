import Foundation

/// Neewer "new" BLE protocol — the one used by the NW-* / GL1C generation of lights.
///
/// Reverse-engineered and verified live against four lights (NW-20200015,
/// NEEWER-GL1C, NW-20240061). The defining trait of this protocol is that every
/// command embeds the light's own 6-byte MAC address, followed by a sum8 checksum.
/// Classic Neewer commands (no MAC) are silently ignored by these lights.
///
/// Frame layout:  78  <tag>  <size>  <MAC×6>  <subtag>  <payload…>  <sum8>
/// where size = payload.count + 7 (the 6 MAC bytes + 1 subtag byte).
enum NeewerProtocol {
    static let prefix: UInt8 = 0x78

    // MARK: MAC discovery

    /// Neewer advertises the light's MAC as its 6-byte manufacturer-data blob,
    /// byte-reversed. e.g. advert `38 cf ee a9 bf d8` -> MAC `D8:BF:A9:EE:CF:38`.
    /// This is the only way to obtain the MAC on iOS (CoreBluetooth hides it).
    static func mac(fromManufacturerData data: Data) -> [UInt8]? {
        guard data.count >= 6 else { return nil }
        return Array(data.suffix(6).reversed())
    }

    static func macString(_ mac: [UInt8]) -> String {
        mac.map { String(format: "%02X", $0) }.joined(separator: ":")
    }

    // MARK: Frame construction

    private static func sum8(_ bytes: [UInt8]) -> UInt8 {
        UInt8(bytes.reduce(0) { $0 + Int($1) } & 0xFF)
    }

    private static func frame(tag: UInt8, mac: [UInt8], subtag: UInt8, payload: [UInt8]) -> Data {
        var b: [UInt8] = [prefix, tag, UInt8(payload.count + 7)]
        b += mac
        b.append(subtag)
        b += payload
        b.append(sum8(b))
        return Data(b)
    }

    // MARK: Commands

    /// Power on/off.  78 8D 08 <MAC> 81 01|02 <sum8>
    static func power(mac: [UInt8], on: Bool) -> Data {
        frame(tag: 0x8D, mac: mac, subtag: 0x81, payload: [on ? 0x01 : 0x02])
    }

    /// CCT + brightness.  78 90 0B <MAC> 87 <bri> <cct> <gm+50> 04 <sum8>
    /// - brightness: 0...100
    /// - cct: colour temperature / 100 (e.g. 32 = 3200K ... 56 = 5600K)
    /// - gm: green/magenta shift -50...50 (0 = neutral)
    static func cct(mac: [UInt8], brightness: Int, cct: Int, gm: Int = 0) -> Data {
        let br = UInt8(clamping: max(0, min(100, brightness)))
        let temp = UInt8(clamping: max(0, min(255, cct)))
        let g = UInt8(clamping: max(-50, min(50, gm)) + 50)
        return frame(tag: 0x90, mac: mac, subtag: 0x87, payload: [br, temp, g, 0x04])
    }

    /// HSI colour.  78 8F 0C <MAC> 86 <hueLo> <hueHi> <sat> <bri> 00 <sum8>
    /// - hue: 0...360 (sent as 16-bit little-endian)
    /// - sat: 0...100
    /// - brightness: 0...100
    static func hsi(mac: [UInt8], hue: Int, sat: Int, brightness: Int) -> Data {
        let h = max(0, min(360, hue))
        let hLo = UInt8(h & 0xFF)
        let hHi = UInt8((h >> 8) & 0xFF)
        let s = UInt8(clamping: max(0, min(100, sat)))
        let br = UInt8(clamping: max(0, min(100, brightness)))
        return frame(tag: 0x8F, mac: mac, subtag: 0x86, payload: [hLo, hHi, s, br, 0x00])
    }
}
