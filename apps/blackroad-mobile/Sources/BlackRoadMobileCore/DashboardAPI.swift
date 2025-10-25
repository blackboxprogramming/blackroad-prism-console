import Foundation

public enum APIError: LocalizedError, Equatable {
    case invalidResponse
    case underlying(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server response was invalid."
        case .underlying(let error):
            return error.localizedDescription
        }
    }
}

public protocol DashboardAPIClient {
    func fetchDashboard() async throws -> DashboardPayload
}

public final class LiveDashboardAPIClient: DashboardAPIClient {
    private let session: URLSession
    private let baseURL: URL
    private let tokenProvider: () -> String?

    public init(baseURL: URL = URL(string: ProcessInfo.processInfo.environment["BLACKROAD_API_URL"] ?? "https://console.blackroad.io/api/mobile/dashboard")!,
                session: URLSession = .shared,
                tokenProvider: @escaping () -> String? = { Keychain.shared.token }) {
        self.baseURL = baseURL
        self.session = session
        self.tokenProvider = tokenProvider
    }

    public func fetchDashboard() async throws -> DashboardPayload {
        var request = URLRequest(url: baseURL)
        if let token = tokenProvider() {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw APIError.invalidResponse
        }

        do {
            return try JSONDecoder().decode(DashboardPayload.self, from: data)
        } catch {
            throw APIError.underlying(error)
        }
    }
}
