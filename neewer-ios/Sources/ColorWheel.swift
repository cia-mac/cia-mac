import SwiftUI

/// A radial colour wheel: angle = hue (0–360°), radius = saturation (0–100%).
/// Writes straight to the bound hue/sat, so a drag drives the light live
/// (throttled by the controller).
struct ColorWheel: View {
    @Binding var hue: Double   // 0...360
    @Binding var sat: Double   // 0...100

    var body: some View {
        GeometryReader { geo in
            let d = min(geo.size.width, geo.size.height)
            let r = d / 2
            ZStack {
                Circle().fill(AngularGradient(colors: wheelColors, center: .center))
                Circle().fill(RadialGradient(colors: [.white, .clear],
                                             center: .center, startRadius: 0, endRadius: r))
                Circle()
                    .fill(Color(hue: hue / 360, saturation: sat / 100, brightness: 1))
                    .frame(width: 26, height: 26)
                    .overlay(Circle().strokeBorder(.white, lineWidth: 3))
                    .shadow(radius: 2)
                    .position(thumb(r: r))
            }
            .frame(width: d, height: d)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Circle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { handle($0.location, r: r) }
            )
        }
    }

    private var wheelColors: [Color] {
        stride(from: 0.0, through: 360.0, by: 30.0).map {
            Color(hue: $0 / 360, saturation: 1, brightness: 1)
        }
    }

    private func thumb(r: CGFloat) -> CGPoint {
        let rad = CGFloat(hue) * .pi / 180
        let dist = CGFloat(sat) / 100 * r
        return CGPoint(x: r + cos(rad) * dist, y: r + sin(rad) * dist)
    }

    private func handle(_ loc: CGPoint, r: CGFloat) {
        let dx = loc.x - r, dy = loc.y - r
        var deg = atan2(dy, dx) * 180 / .pi
        if deg < 0 { deg += 360 }
        hue = Double(deg)
        sat = Double(min(r, hypot(dx, dy)) / r * 100)
    }
}
