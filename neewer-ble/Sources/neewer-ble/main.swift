import Foundation

// neewer-ble — Mac-first BLE controller prototype.
//
// Entry point. CoreBluetooth callbacks are delivered on the manager's private
// queue, so the main thread is free to run the interactive REPL (blocking on
// readLine). No RunLoop.main.run() is needed: a CBCentralManager created with a
// custom dispatch queue delivers events on that queue independently of the main
// run loop.

let store = Store()
let ble = BLEManager()
let repl = REPL(ble: ble, store: store)
repl.run()
