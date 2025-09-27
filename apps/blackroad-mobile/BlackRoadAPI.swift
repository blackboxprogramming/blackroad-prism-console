import Foundation

struct BlackRoadAPI {
    typealias Fetcher = () async throws -> DashboardPayload

    private let fetcher: Fetcher

    init(fetcher: @escaping Fetcher = BlackRoadAPI.liveFetcher) {
        self.fetcher = fetcher
    }

    func fetchDashboard() async throws -> DashboardPayload {
        try await fetcher()
    }
}

extension BlackRoadAPI {
    static var stub: DashboardPayload {
        DashboardPayload(
            summary: "All systems nominal",
            metrics: [
                DashboardMetric(
                    id: UUID(),
                    title: "API Latency",
                    value: "112 ms",
                    caption: "p95 across 5m",
                    icon: "speedometer",
                    status: .good
                ),
                DashboardMetric(
                    id: UUID(),
                    title: "Active Tasks",
                    value: "7",
                    caption: "Ops + enablement",
                    icon: "list.bullet.rectangle",
                    status: .warning
                ),
                DashboardMetric(
                    id: UUID(),
                    title: "LLM Health",
                    value: "OK",
                    caption: "Responsive in <2s",
                    icon: "waveform",
                    status: .good
                ),
                DashboardMetric(
                    id: UUID(),
                    title: "Incidents",
                    value: "1",
                    caption: "PagerDuty SEV-3",
                    icon: "exclamationmark.triangle",
                    status: .critical
                )
            ],
            shortcuts: [
                DashboardShortcut(
                    id: UUID(),
                    title: "Open Prism Console",
                    icon: "display",
                    url: URL(string: "https://console.blackroad.io")!
                ),
                DashboardShortcut(
                    id: UUID(),
                    title: "Run Bench",
                    icon: "play.circle",
                    url: URL(string: "https://console.blackroad.io/tools/bench")!
                )
            ]
        )
    }

    static func liveFetcher() async throws -> DashboardPayload {
        let configuration = URLSessionConfiguration.default
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        let session = URLSession(configuration: configuration)

        guard let url = Environment.url(for: "BLACKROAD_API_URL", fallback: "https://console.blackroad.io/api/mobile/dashboard") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        if let token = Environment.value(for: "BLACKROAD_API_TOKEN"), !token.isEmpty {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(DashboardPayload.self, from: data)
    }
}

enum Environment {
    static func value(for key: String) -> String? {
        ProcessInfo.processInfo.environment[key]
    }

    static func url(for key: String, fallback: String) -> URL? {
        if let raw = value(for: key), let url = URL(string: raw) {
            return url
        }
        return URL(string: fallback)
    }
}
