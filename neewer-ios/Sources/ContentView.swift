import SwiftUI

struct ContentView: View {
    @EnvironmentObject var controller: LightController

    var body: some View {
        NavigationStack {
            List {
                if !controller.bluetoothReady {
                    Label("Turn on Bluetooth to find your lights", systemImage: "antenna.radiowaves.left.and.right.slash")
                        .foregroundStyle(.secondary)
                }

                Section("Scenes") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            SceneButton(title: "Mellow", icon: "moon.stars.fill", tint: .purple) {
                                controller.sceneMellow()
                            }
                            SceneButton(title: "Daylight", icon: "sun.max.fill", tint: .yellow) {
                                controller.sceneDaylight()
                            }
                            SceneButton(title: "All Off", icon: "power", tint: .gray) {
                                controller.sceneAllOff()
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
                }

                Section(controller.lights.isEmpty ? "Searching…" : "Lights (\(controller.lights.count))") {
                    ForEach(controller.lights) { light in
                        NavigationLink {
                            LightDetailView(lightID: light.id)
                        } label: {
                            LightRow(light: light)
                        }
                    }
                }
            }
            .navigationTitle("Glow")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        controller.isScanning ? controller.stopScan() : controller.startScan()
                    } label: {
                        Image(systemName: controller.isScanning ? "arrow.clockwise.circle.fill" : "arrow.clockwise.circle")
                    }
                }
            }
        }
    }
}

private struct SceneButton: View {
    let title: String
    let icon: String
    let tint: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon).font(.title2)
                Text(title).font(.caption).bold()
            }
            .frame(width: 84, height: 64)
            .background(tint.opacity(0.22), in: RoundedRectangle(cornerRadius: 14))
            .foregroundStyle(tint)
        }
        .buttonStyle(.plain)
    }
}

private struct LightRow: View {
    @EnvironmentObject var controller: LightController
    let light: Light

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(swatch)
                .frame(width: 26, height: 26)
                .overlay(Circle().stroke(.white.opacity(0.15)))
            VStack(alignment: .leading, spacing: 2) {
                Text(light.name).font(.body)
                Text(light.isConnected ? "Connected · \(light.macString)" : "Connecting…")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
            Toggle("", isOn: Binding(
                get: { light.isOn },
                set: { controller.setPower(light.id, on: $0) }
            ))
            .labelsHidden()
        }
    }

    private var swatch: Color {
        guard light.isOn else { return .gray.opacity(0.4) }
        switch light.mode {
        case .color: return Color(hue: light.hue / 360, saturation: light.sat / 100, brightness: 1)
        case .cct:
            // warm (32) -> cool (56) rough preview
            let t = (light.cct - 32) / 24
            return Color(red: 1.0, green: 0.75 + 0.2 * t, blue: 0.5 + 0.5 * t)
        }
    }
}

struct LightDetailView: View {
    @EnvironmentObject var controller: LightController
    let lightID: UUID

    private var light: Light? { controller.lights.first(where: { $0.id == lightID }) }

    var body: some View {
        Form {
            if let light {
                Section {
                    Toggle("Power", isOn: Binding(
                        get: { light.isOn },
                        set: { controller.setPower(lightID, on: $0) }
                    ))
                }

                Section("Brightness") {
                    Slider(value: bind(\.brightness), in: 0...100, step: 1)
                    Text("\(Int(light.brightness))%").font(.caption).foregroundStyle(.secondary)
                }

                Section("Mode") {
                    Picker("Mode", selection: Binding(
                        get: { light.mode },
                        set: { m in controller.mutate(lightID) { $0.mode = m } }
                    )) {
                        Text("White").tag(LightMode.cct)
                        if light.supportsColor { Text("Colour").tag(LightMode.color) }
                    }
                    .pickerStyle(.segmented)
                }

                if light.mode == .cct {
                    Section("Colour temperature") {
                        Slider(value: bind(\.cct), in: 32...56, step: 1)
                        Text("\(Int(light.cct) * 100)K").font(.caption).foregroundStyle(.secondary)
                    }
                } else {
                    Section("Colour") {
                        ColorWheel(hue: bind(\.hue), sat: bind(\.sat))
                            .frame(height: 240)
                            .padding(.vertical, 8)
                        Text("Hue \(Int(light.hue))°  ·  Sat \(Int(light.sat))%")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("Light unavailable").foregroundStyle(.secondary)
            }
        }
        .navigationTitle(light?.name ?? "Light")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func bind(_ key: WritableKeyPath<Light, Double>) -> Binding<Double> {
        Binding(
            get: { light?[keyPath: key] ?? 0 },
            set: { v in controller.mutate(lightID) { $0[keyPath: key] = v } }
        )
    }
}
