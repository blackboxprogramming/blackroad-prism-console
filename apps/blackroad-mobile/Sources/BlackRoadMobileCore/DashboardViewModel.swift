import Foundation
import Combine

public final class DashboardViewModel: ObservableObject {
    public enum Banner: Equatable {
        case offline(String)
        case hidden
    }

    public struct IdentifiedError: Identifiable, Equatable {
        public let id = UUID()
        public let underlying: APIError

        public var localizedDescription: String {
            underlying.localizedDescription
        }
    }

    @Published public private(set) var summary: String = ""
    @Published public private(set) var metrics: [Metric] = []
    @Published public private(set) var shortcuts: [Shortcut] = []
    @Published public private(set) var banner: Banner = .hidden
    @Published public var error: IdentifiedError?

    public let telemetry: Telemetry

    private let api: DashboardAPIClient
    private let cache: DashboardCache

    public init(api: DashboardAPIClient, cache: DashboardCache, telemetry: Telemetry) {
        self.api = api
        self.cache = cache
        self.telemetry = telemetry

        if let payload = cache.load() {
            apply(payload, showOffline: false)
        }
    }

    @MainActor
    public func refresh() async {
        do {
            let payload = try await api.fetchDashboard()
            try cache.save(payload)
            apply(payload, showOffline: false)
            banner = .hidden
        } catch let error as APIError {
            handleError(error)
        } catch {
            handleError(.underlying(error))
        }
    }

    private func apply(_ payload: DashboardPayload, showOffline: Bool) {
        summary = payload.summary
        metrics = payload.metrics
        shortcuts = payload.shortcuts
        if showOffline {
            banner = .offline("Offline - showing cached data")
        }
    }

    private func handleError(_ apiError: APIError) {
        if let cached = cache.load() {
            apply(cached, showOffline: true)
        }
        banner = .offline("Offline - showing cached data")
        error = IdentifiedError(underlying: apiError)
    }
}
