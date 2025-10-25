import XCTest
@testable import BlackRoadMobileCore

final class TelemetryTests: XCTestCase {
    func testTelemetryBuffersAndFlushes() {
        let telemetry = Telemetry()
        for _ in 0..<10 {
            telemetry.track(event: .manualRefresh)
        }

        let expectation = XCTestExpectation(description: "Flush occurs")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            XCTAssertTrue(telemetry.bufferedEvents.isEmpty)
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1)
    }
}
