import Foundation

public final class Telemetry: ObservableObject {
    public enum Event: Equatable {
        case screenViewed(String)
        case shortcutTapped(String)
        case manualRefresh
    }

    @Published private(set) var bufferedEvents: [Event] = []
    private let maxBuffer = 10

    public init() {}

    public func track(event: Event) {
        DispatchQueue.main.async {
            self.bufferedEvents.append(event)
            if self.bufferedEvents.count >= self.maxBuffer {
                self.flush()
            }
        }
    }

    public func flush() {
        // In production this would upload to observability pipeline.
        bufferedEvents.removeAll()
    }
}
