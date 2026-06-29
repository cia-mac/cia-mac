import SwiftUI

@main
struct GlowApp: App {
    @StateObject private var controller = LightController()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(controller)
                .preferredColorScheme(.dark)
        }
    }
}
