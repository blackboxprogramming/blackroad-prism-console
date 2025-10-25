import XCTest
@testable import BlackRoadMobileCore

final class DashboardViewModelTests: XCTestCase {
    func testRefreshSuccessUpdatesState() async {
        let payload = DashboardPayload(summary: "All good", metrics: Metric.previewData, shortcuts: Shortcut.previewData)
        let api = MockDashboardAPIClient(result: .success(payload))
        let cache = TestCache()
        let telemetry = Telemetry()
        let viewModel = DashboardViewModel(api: api, cache: cache, telemetry: telemetry)

        await viewModel.refresh()

        XCTAssertEqual(viewModel.summary, payload.summary)
        XCTAssertEqual(viewModel.metrics.count, payload.metrics.count)
        XCTAssertEqual(viewModel.banner, .hidden)
        XCTAssertNil(viewModel.error)
        XCTAssertNotNil(cache.saved)
    }

    func testRefreshFailureFallsBackToCache() async {
        let payload = DashboardPayload(summary: "Cached", metrics: Metric.previewData, shortcuts: Shortcut.previewData)
        let cache = TestCache()
        try? cache.save(payload)
        let api = MockDashboardAPIClient(result: .failure(.invalidResponse))
        let telemetry = Telemetry()
        let viewModel = DashboardViewModel(api: api, cache: cache, telemetry: telemetry)

        await viewModel.refresh()

        XCTAssertEqual(viewModel.summary, payload.summary)
        XCTAssertEqual(viewModel.banner, .offline("Offline - showing cached data"))
        XCTAssertNotNil(viewModel.error)
    }
}

private final class TestCache: DashboardCache {
    var saved: DashboardPayload?

    func save(_ payload: DashboardPayload) throws {
        saved = payload
    }

    func load() -> DashboardPayload? {
        saved
    }
}
