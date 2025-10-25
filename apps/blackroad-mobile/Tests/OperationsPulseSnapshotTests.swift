import XCTest
import SwiftUI
@testable import BlackRoadMobileCore
@testable import BlackRoadMobile

final class OperationsPulseSnapshotTests: XCTestCase {
    func testContentViewRendersWithPreviewPayload() {
        let viewModel = AppBootstrapper.preview.makeDashboardViewModel()
        let view = ContentView(viewModel: viewModel).environmentObject(viewModel.telemetry)

        if #available(iOS 16.0, *) {
            let renderer = ImageRenderer(content: view)
            let image = renderer.uiImage
            XCTAssertNotNil(image)
        } else {
            XCTAssertFalse(String(describing: view.body).isEmpty)
        }
    }
}
