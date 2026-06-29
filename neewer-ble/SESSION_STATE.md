# neewer-ble — live session state (resume here)

This captures the real, on-device findings so any session can continue without
re-discovering. Last updated from a live run against the physical light.

## Confirmed device

- **Name:** `NEEWER-GL1C` (a NEEWER GL1C fill light)
- **Scan index:** `6` (RSSI ~ −59), flagged ★ likely-NEEWER
- A second NEEWER-style device also appears: `NW-20200015` (idx 11, weaker).

## Confirmed GATT map (from `connect 6`)

```
service 69400001-B5A3-F393-E0A9-E50E24DCCA99        # classic NEEWER control service
  [0] 69400003-...   {notify}                       # light -> host responses (logged as 📥)
  [1] 69400002-...   {writeWithoutResponse, write}  # host -> light COMMAND CHANNEL  ← write here

service 7F510004-B5A3-F393-E0A9-E50E24DCCA9E        # newer/secondary service (fallback)
  [2] 7F510005-...   {writeWithoutResponse, write, notify}
  [3] 7F510006-...   {writeWithoutResponse, write}
```

The classic NEEWER command channel is **characteristic index `[1]` (`69400002`)**.
Responses arrive on `[0]` (`69400003`) and are auto-logged by the CLI.

## How to resume the live session

```bash
cd ~/neewer-build/neewer-ble && swift run neewer-ble
# then:  scan   (wait 5s)   connect 6
```

## Candidate commands to TEST (not assumed — confirm by watching the light)

NEEWER's documented frame: `78 <cmd> <len> <data...> <checksum>`, where the
checksum is the low byte of the sum of all preceding bytes (the CLI's
`protocol set checksum sum8` matches this; here the bytes are pre-computed).

CCT mode = `78 87 02 <brightness 0x00-0x64> <cct ÷100, e.g. 0x38=5600K> <chk>`:

| intent                    | write command (paste at `>` prompt)   |
|---------------------------|----------------------------------------|
| 5600K @ 100%              | `write 1 78 87 02 64 38 9d`            |
| 5600K @ 10%               | `write 1 78 87 02 0a 38 43`            |
| 3200K @ 50%               | `write 1 78 87 02 32 20 53`            |

If `[1]` produces no visible change, repeat the same payloads on the 7F51
service — `write 2 ...` and `write 3 ...`.

HSI/RGB candidate (test after CCT is confirmed):
`78 86 04 <hue_lo> <hue_hi> <sat 0-0x64> <bri 0-0x64> <chk>` — e.g. pure red
hue=0, sat=100, bri=100: `write 1 78 86 04 00 00 64 64 66`.

## Once a command visibly works

1. `save <name>` it (e.g. `save cct-5600-full`).
2. Fill the gated profile so the high-level helpers turn on:
   ```
   protocol set service 69400001-B5A3-F393-E0A9-E50E24DCCA99
   protocol set char    69400002-B5A3-F393-E0A9-E50E24DCCA99
   protocol set checksum sum8
   protocol set cct        78 87 02 {brightness} {cct}
   protocol set brightness 78 87 02 {value} 38
   protocol set rgb        78 86 04 00 00 {g} {b}   # refine once HSI/RGB is mapped
   protocol confirm
   ```
   (Templates use placeholders; `checksum sum8` appends the trailing byte, so the
   pre-computed checksums above are NOT included in the templates.)

## Hard constraint (why a step is always manual)

Bluetooth writes must run on the Mac that's physically near the light. The
cloud agent has no Bluetooth radio and no link to the local Terminal, so the
`write`/`scan`/`connect` keystrokes happen on the Mac; protocol decoding and
code changes happen in the session.
