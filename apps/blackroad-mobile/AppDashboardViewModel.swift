import Combine
import Foundation
import SwiftUI

@MainActor
final class AppDashboardViewModel: ObservableObject {
    @Published private(set) var metrics: [DashboardMetric] = []
    @Published private(set) var shortcuts: [DashboardShortcut] = DashboardShortcut.defaults
    @Published private(set) var summary: String = "Connecting to BlackRoad..."
    @Published private(set) var lastUpdated: Date?

    private let api: BlackRoadAPI
    private var refreshTask: Task<Void, Never>?

    init(api: BlackRoadAPI = BlackRoadAPI()) {
        self.api = api
    }

    deinit {
        refreshTask?.cancel()
    }

    func refresh() async {
        refreshTask?.cancel()
        refreshTask = Task { [weak self] in
            await self?.loadDashboard()
        }
    }

    private func loadDashboard() async {
        do {
            let payload = try await api.fetchDashboard()
            withAnimation(.easeInOut(duration: 0.2)) {
                metrics = payload.metrics
                shortcuts = payload.shortcuts
                summary = payload.summary
                lastUpdated = Date()
            }
        } catch {
            let fallback = BlackRoadAPI.stub
            withAnimation(.easeInOut(duration: 0.2)) {
                metrics = fallback.metrics
                shortcuts = fallback.shortcuts
                summary = "Offline snapshot"
                lastUpdated = Date()
            }
        }
    }
}

extension AppDashboardViewModel {
    static var preview: AppDashboardViewModel {
        let vm = AppDashboardViewModel(api: BlackRoadAPI(fetcher: { BlackRoadAPI.stub }))
        vm.metrics = BlackRoadAPI.stub.metrics
        vm.shortcuts = BlackRoadAPI.stub.shortcuts
        vm.summary = BlackRoadAPI.stub.summary
        vm.lastUpdated = Date()
        return vm
    }
}

struct DashboardMetric: Identifiable, Codable {
    enum Status: String, Codable {
        case good
        case warning
        case critical

        var tint: Color {
            switch self {
            case .good:
                return Color.green
            case .warning:
                return Color.orange
            case .critical:
                return Color.red
            }
        }

        var background: some ShapeStyle {
            switch self {
            case .good:
                return Color.green.opacity(0.15)
            case .warning:
                return Color.orange.opacity(0.15)
            case .critical:
                return Color.red.opacity(0.15)
            }
        }
    }

    let id: UUID
    let title: String
    let value: String
    let caption: String
    let icon: String
    let status: Status
}

struct DashboardShortcut: Identifiable, Codable {
    let id: UUID
    let title: String
    let icon: String
    let url: URL

    static let defaults: [DashboardShortcut] = [
        DashboardShortcut(
            id: UUID(),
            title: "Open Prism Console",
            icon: "display",
            url: URL(string: "https://console.blackroad.io")!
        ),
        DashboardShortcut(
            id: UUID(),
            title: "Run SLO Report",
            icon: "speedometer",
            url: URL(string: "https://console.blackroad.io/docs/slo")!
        )
    ]
}

struct DashboardPayload: Codable {
    let summary: String
    let metrics: [DashboardMetric]
    let shortcuts: [DashboardShortcut]
}
