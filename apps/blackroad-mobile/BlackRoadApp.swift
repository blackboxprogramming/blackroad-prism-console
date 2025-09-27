import SwiftUI

@main
struct BlackRoadApp: App {
    @StateObject private var dashboard = AppDashboardViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(dashboard)
        }
    }
}
