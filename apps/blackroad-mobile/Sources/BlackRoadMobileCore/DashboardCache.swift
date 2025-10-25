import Foundation
import SwiftUI

public protocol DashboardCache {
    func save(_ payload: DashboardPayload) throws
    func load() -> DashboardPayload?
}

public final class AppStorageDashboardCache: DashboardCache {
    private let storageKey = "dashboard_payload"
    private let versionKey = "dashboard_payload_version"
    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let version = 1

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func save(_ payload: DashboardPayload) throws {
        let data = try encoder.encode(payload)
        defaults.set(data, forKey: storageKey)
        defaults.set(version, forKey: versionKey)
    }

    public func load() -> DashboardPayload? {
        guard defaults.integer(forKey: versionKey) == version,
              let data = defaults.data(forKey: storageKey) else { return nil }
        return try? decoder.decode(DashboardPayload.self, from: data)
    }
}
