import Foundation

public struct DashboardPayload: Codable, Equatable {
    public let summary: String
    public let metrics: [Metric]
    public let shortcuts: [Shortcut]
}

public struct Metric: Identifiable, Codable, Equatable {
    public enum Status: String, Codable {
        case healthy
        case warning
        case critical
    }

    public let id: UUID
    public let title: String
    public let value: String
    public let caption: String
    public let icon: String
    public let status: Status

    public init(id: UUID = UUID(), title: String, value: String, caption: String, icon: String, status: Status) {
        self.id = id
        self.title = title
        self.value = value
        self.caption = caption
        self.icon = icon
        self.status = status
    }
}

public struct Shortcut: Identifiable, Codable, Equatable {
    public let id: UUID
    public let title: String
    public let icon: String
    public let url: URL

    public init(id: UUID = UUID(), title: String, icon: String, url: URL) {
        self.id = id
        self.title = title
        self.icon = icon
        self.url = url
    }
}

#if DEBUG
public extension Metric {
    static let previewData: [Metric] = [
        Metric(title: "Uptime", value: "99.99%", caption: "SLA maintained", icon: "waveform.path.ecg", status: .healthy),
        Metric(title: "Incidents", value: "0", caption: "Past 24 hours", icon: "shield.lefthalf.filled", status: .healthy),
        Metric(title: "Deploys", value: "3", caption: "Last 8 hours", icon: "arrow.up.circle", status: .warning)
    ]
}

public extension Shortcut {
    static let previewData: [Shortcut] = [
        Shortcut(title: "Runbooks", icon: "book", url: URL(string: "https://console.blackroad.io/runbooks")!),
        Shortcut(title: "PagerDuty", icon: "bell", url: URL(string: "https://pagerduty.com")!),
        Shortcut(title: "Status Page", icon: "chart.bar", url: URL(string: "https://status.blackroad.io")!)
    ]
}
#endif
