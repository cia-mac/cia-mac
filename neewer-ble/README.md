# neewer-ble — Mac-first BLE controller prototype

A local macOS command-line tool to **discover, inspect, and safely poke** a
NEEWER light (or any BLE peripheral) over CoreBluetooth. It is deliberately
built **discovery-first**: it does **not** assume the NEEWER protocol. You use it
to scan, connect, dump every service/characteristic, log values, and then
hand-test raw hex payloads. The high-level brightness/RGB/CCT helpers stay
**disabled** until *you* confirm a protocol you verified yourself.

- **Local only.** No cloud, no account, no login. Findings are written to
  `./neewer-data/` and never leave the machine.
- **Safe writes only.** No firmware/OTA/DFU writes (those services are blocked),
  no pairing/bonding, no factory reset — only GATT reads, writes, and
  notification subscriptions.
- **Mac first.** This is a Swift Package Manager CLI targeting macOS. iPhone is
  explicitly out of scope for this prototype.

> This lives in the `cia-mac/cia-mac` repo because that's the repo this session
> was scoped to. It is a self-contained subproject under `neewer-ble/` and is
> completely independent of the Next.js "Starving Artist" app in the repo root.

## Requirements

- macOS 11+ with Bluetooth.
- Swift toolchain (Xcode or the Swift command-line tools: `xcode-select --install`).

## Build & run

```bash
cd neewer-ble
swift build
swift run neewer-ble
```

### Bluetooth permission (one-time)

macOS requires the app launching CoreBluetooth to have Bluetooth permission.
The first time you run, macOS may prompt — allow it. If it doesn't prompt, or
you previously denied it:

**System Settings → Privacy & Security → Bluetooth** → enable your terminal app
(Terminal, iTerm, or the IDE you ran `swift run` from). Then re-run.

If permission is missing the tool tells you exactly this instead of hanging.

## Phase 1 — discovery & logging

```
scan [seconds]   start scanning (optionally for N seconds, then auto-list)
stop             stop scanning
list             list discovered devices — ★ marks a *likely* NEEWER
info <idx>       advertisement details (services, manufacturer data)
connect <idx>    connect + discover all services/characteristics
services         list services/characteristics of the connected device
read <idx>       read a characteristic's current value
export [file]    write a JSON report of the connected device
```

- The **★ NEEWER heuristic** is name/service-prefix based *only* — a convenience
  flag, never a protocol assumption. Everything is treated as an unknown device.
- On connect, the tool auto-reads every readable characteristic and subscribes
  to every notify/indicate characteristic, **logging incoming notifications live**
  (`📥 notify …`). That response logging is the main lever for reverse-engineering.
- `export` writes `neewer-data/reports/<name>.json` containing every service,
  characteristic, its properties, last-read value (hex + UTF-8 if printable),
  and descriptors. Services that are blocked for writes are flagged in the JSON.

Example report shape:

```json
{
  "name": "NEEWER-RGB660",
  "identifier": "…",
  "rssi": -52,
  "likelyNeewer": true,
  "services": [
    {
      "uuid": "69400001-B5A3-F393-E0A9-E50E24DCCA99",
      "isPrimary": true,
      "blockedForWrites": false,
      "characteristics": [
        { "uuid": "69400002-…", "properties": ["writeWithoutResponse"], "writableWithoutResponse": true },
        { "uuid": "69400003-…", "properties": ["notify"], "notify": true }
      ]
    }
  ]
}
```

## Phase 2 — command test panel

Find what actually drives the light by writing raw hex, then save what works:

```
write <idx> <hex>    write raw hex to characteristic <idx> (safe services only)
save <name> [note]   save the last successful write under a name
commands             list saved commands
run <name>           replay a saved command
```

Hex is forgiving: `78 86 03 64`, `7886 0364`, `0x78 0x86`, `78-86-03-64` all work.

### Gated helpers (brightness / RGB / CCT)

These stay **disabled** until you confirm a protocol — exactly as requested
("brightness slider only after command is known", "RGB/CCT only after protocol
confirmed"). The flow:

```
1) Discover working payloads by hand with `write <idx> <hex>` and the live
   notification log.
2) Describe them as templates:
     protocol set service <serviceUUID>
     protocol set char    <writeCharacteristicUUID>
     protocol set brightness 78 86 01 {value}
     protocol set rgb        78 86 03 {r} {g} {b}
     protocol set cct        78 86 02 {cct} {brightness}
     protocol set checksum   sum8        # optional trailing checksum byte
3) protocol confirm        # flips the gate ON
```

Now these work (and are clamped to one byte each):

```
brightness <0-100>   substitutes {value}/{brightness}
rgb <r> <g> <b>      substitutes {r} {g} {b}   (each 0-255)
cct <byte> [bri]     substitutes {cct} {brightness}  (byte you mapped, e.g. 32→3200K)
protocol show        show current profile + gating status
protocol reset       wipe the profile, disabling helpers again
```

Editing any template automatically re-disables the helpers until you
`protocol confirm` again, so a half-edited profile can never fire.

Template placeholders (`{value}`, `{r}`, `{g}`, `{b}`, `{cct}`, `{brightness}`)
are replaced by the value as a single hex byte; literal hex bytes pass through
unchanged. `checksum sum8` appends the low byte of the sum of all preceding
bytes — a common pattern, opt-in only. No protocol is hard-coded.

## Safety model

- Writes to firmware/OTA/DFU-looking services (Nordic DFU `FE59`, legacy DFU,
  TI OAD, etc.) are **refused** — see `Sources/neewer-ble/Safety.swift`.
- The tool never pairs, bonds, unpairs, or sends reset commands. It only does
  GATT read / write / notify.
- Write-with-response is preferred so you get a real success/failure ACK.

## Data layout (gitignored)

```
neewer-data/
  commands.json     saved successful commands
  protocol.json     the protocol profile + confirmation gate
  reports/*.json    exported device reports
```

## Source layout

```
Sources/neewer-ble/
  main.swift        entry point
  BLEManager.swift  CoreBluetooth central + peripheral delegate
  REPL.swift        interactive command loop (Phase 1 + Phase 2)
  Report.swift      builds the JSON device report
  Store.swift       persistence + protocol profile + template rendering
  Models.swift      Codable report models + property labels
  Safety.swift      OTA/DFU write denylist
  Hex.swift         forgiving hex parse/format
```

## Roadmap (not in this prototype)

- iPhone (SwiftUI) front-end reusing `BLEManager` once the protocol is confirmed.
- A real brightness slider / colour picker UI, gated on the same confirmation.
