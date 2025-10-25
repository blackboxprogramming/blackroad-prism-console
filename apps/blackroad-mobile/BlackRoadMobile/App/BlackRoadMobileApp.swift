import SwiftUI
import LocalAuthentication
import BlackRoadMobileCore

@main
struct BlackRoadMobileApp: App {
    @StateObject private var appViewModel = AppBootstrapper().makeDashboardViewModel()
    @AppStorage("hasAuthenticated") private var hasAuthenticated = false

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: appViewModel)
                .environmentObject(appViewModel.telemetry)
                .task {
                    guard !hasAuthenticated else { return }
                    if await BiometricsGate.shared.authenticateIfNeeded() {
                        hasAuthenticated = true
                    }
                }
        }
    }
}
