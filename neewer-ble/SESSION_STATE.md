# neewer-ble SESSION_STATE

Last updated: 2026-06-28. Lane: local BLE reverse-engineering of NEEWER lights,
plus a native iPhone controller app (`../neewer-ios`, product "Glow").

## TL;DR

The NEEWER protocol is fully cracked, verified live against 4 lights, and
generalized. A Mac CLI (`neewer-ble`) and an iOS app (`Glow`) both drive the
lights. No cloud, no Neewer account.

## The crack (this is the load-bearing finding)

The `NW-*` / `GL1C` generation uses Neewer's **new protocol**, NOT the classic
`78 81/82/87` command set. The defining trait: **every command embeds the
light's own 6-byte MAC address** plus a sum8 checksum. Classic commands (no MAC)
are accepted at the GATT layer (clean ACK) but silently ignored by the firmware,
which is why early attempts looked dead despite a healthy connection.

Frame layout:

```
78  <tag>  <size>  <MAC x6>  <subtag>  <payload...>  <checksum>
```
- `size` = payload byte count + 7 (6 MAC bytes + 1 subtag byte)
- `checksum` = low byte of the sum of every preceding byte (sum8)

Verified commands:

| function | bytes |
| --- | --- |
| power on  | `78 8D 08 <MAC> 81 01 <sum8>` |
| power off | `78 8D 08 <MAC> 81 02 <sum8>` |
| CCT + brightness | `78 90 0B <MAC> 87 <bri 0-100> <cct/100> <gm+50> 04 <sum8>` |
| HSI colour | `78 8F 0C <MAC> 86 <hueLo> <hueHi> <sat 0-100> <bri 0-100> 00 <sum8>` (hue 0-360 little-endian) |

### Getting the MAC (critical)

CoreBluetooth hides the BLE MAC on both macOS and iOS. Two ways to get it:

1. **From the advertisement (works everywhere, the right way on iOS):** the
   light advertises its MAC as the 6-byte manufacturer-data blob, **byte
   reversed**. Example: GL1C advert `38 cf ee a9 bf d8` -> MAC `D8:BF:A9:EE:CF:38`.
   Proven on two lights. This is why Neewer puts it in the advert.
2. **From macOS (fallback):** `system_profiler SPBluetoothDataType` lists a
   *connected* device's address by name.

## The 4 lights in this room

| name | identifier (CoreBluetooth UUID) | MAC | write char | colour? |
| --- | --- | --- | --- | --- |
| NW-20200015&FFFFFFFF | F1EC7C6C-24C6-8145-5F16-CF508BDD6C83 | `DF:E9:CA:4A:07:BC` | `69400002` | yes |
| NEEWER-GL1C | 37C9EA18-95F7-8CE2-15A1-6115EC833B67 | `D8:BF:A9:EE:CF:38` | `69400002` | yes |
| NW-20240061&FFFFFFFF | 6312A2EB-8EB5-9701-C523-8847EC24AD68 | `C2:7F:82:EC:60:21` | `69400002` | yes |
| NEEWER-T100C-2 | 2A0071E1-6488-BE00-16F5-604D3CF9BEFF | unreachable | unreachable | CCT only |

T100C-2 is unreachable from this spot: -82 dBm, `connect` times out, and it
advertises **no manufacturer data**, so the advert-MAC trick cannot address it
(the iOS app cannot derive its MAC either). Retry only from much closer, or grab
its MAC via `system_profiler` after a successful connection.

All control lives on service `69400001-B5A3-F393-E0A9-E50E24DCCA99`: write char
`69400002`, notify char `69400003`. (The characteristic *index* in the CLI
differs per light, e.g. NW-2020 = `[0]`, GL1C = `[1]`; always address by UUID.)

## CLI (`neewer-ble`, Swift Package, macOS)

- Discovery-first tool: scan / connect / dump services / raw `write <idx> <hex>`
  / save commands / gated brightness-rgb-cct helpers behind `protocol confirm`.
- **Patch applied (uncommitted before this session's commit):** `BLEManager.swift`
  now prefers **write-without-response** when a char supports both. NEEWER
  firmware only acts on the without-response path; the original with-response
  preference produced ACKs but no effect.
- Confirmed protocol profile saved for **NW-2020** in `neewer-data/protocol.json`
  (gitignored). cct template `78 90 0B DF E9 CA 4A 07 BC 87 {brightness} {cct} 32 04`,
  brightness template holds cct at 0x28, checksum `sum8`. `cct`/`brightness`
  helpers verified working through the render path.

## iOS app (`../neewer-ios`, product "Glow")

SwiftUI + CoreBluetooth, builds clean against iOS 26.5 SDK (BUILD SUCCEEDED).
- `NeewerProtocol.swift` reproduces the verified command builders + MAC-from-advert.
- `LightController.swift` auto-discovers Neewer lights, derives each MAC, holds
  all connected simultaneously, throttles drags to ~40ms.
- UI: light list with live swatches, per-light power / brightness / white (CCT)
  / colour (a real colour wheel), and one-tap scenes: Mellow, Daylight, All Off.
- T100C tubes auto-detected as CCT-only.
- To run on device: open `Glow.xcodeproj`, set signing Team, Run on a plugged-in
  iPhone (simulator has no Bluetooth). Project regenerated via `xcodegen`.

## "Mellow" scene (set live this session)

NW-2020 warm orange (hue 25), NW-2024 amber (hue 32), GL1C purple (hue 282),
all dim (bri ~12-14). Baked into the app as the Mellow scene preset.

## Open / next

- T100C-2 unreachable from here (see note above). Retry from closer if wanted.
- App has an icon now (warm->purple glow orb, `neewer-ios/icon/make_icon.py`).
- App: rename if desired, persist last light state, scene editor.
- Decide whether the iOS app graduates into its own product lane vs cia-mac.
  Default for now: stays under cia-mac alongside neewer-ble.
