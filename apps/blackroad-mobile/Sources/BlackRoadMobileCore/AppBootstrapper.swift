import Foundation

public struct AppBootstrapper {
    private let api: DashboardAPIClient
    private let cache: DashboardCache
    private let telemetryInstance: Telemetry

    public init(api: DashboardAPIClient? = nil, cache: DashboardCache? = nil, telemetry: Telemetry? = nil) {
        self.api = api ?? LiveDashboardAPIClient()
        self.cache = cache ?? AppStorageDashboardCache()
        self.telemetryInstance = telemetry ?? Telemetry()
    }

    public func makeDashboardViewModel() -> DashboardViewModel {
        DashboardViewModel(api: api, cache: cache, telemetry: telemetryInstance)
    }

    public var telemetry: Telemetry { telemetryInstance }
}

public extension AppBootstrapper {
    static let preview: AppBootstrapper = {
        let payload = DashboardPayload(
            summary: "All systems nominal. Last incident resolved 22 minutes ago.",
            metrics: Metric.previewData,
            shortcuts: Shortcut.previewData
        )

        let cache = InMemoryCache(payload: payload)
        let api = MockDashboardAPIClient(result: .success(payload))
        return AppBootstrapper(api: api, cache: cache, telemetry: Telemetry())
    }()
}

private final class InMemoryCache: DashboardCache {
    private var payload: DashboardPayload?

    init(payload: DashboardPayload?) {
        self.payload = payload
    }

    func save(_ payload: DashboardPayload) throws {
        self.payload = payload
    }

    func load() -> DashboardPayload? {
        payload
    }
}

public final class MockDashboardAPIClient: DashboardAPIClient {
    private let result: Result<DashboardPayload, APIError>

    public init(result: Result<DashboardPayload, APIError>) {
        self.result = result
    }

    public func fetchDashboard() async throws -> DashboardPayload {
        switch result {
        case .success(let payload):
            return payload
        case .failure(let error):
            throw error
        }
    }
}
