import SwiftUI
import BlackRoadMobileCore

struct ContentView: View {
    @ObservedObject var viewModel: DashboardViewModel
    @EnvironmentObject var telemetry: Telemetry

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    OperationsPulseView(summary: viewModel.summary)
                    MetricsGridView(metrics: viewModel.metrics)
                    ShortcutsView(shortcuts: viewModel.shortcuts)
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Operations Pulse")
            .refreshable {
                await viewModel.refresh()
                telemetry.track(event: .manualRefresh)
            }
        }
        .overlay(alignment: .top) {
            if case let .offline(message) = viewModel.banner {
                OfflineBanner(message: message)
            }
        }
        .task {
            telemetry.track(event: .screenViewed("operations_pulse"))
        }
        .alert(item: $viewModel.error) { error in
            Alert(title: Text("Unable to refresh"), message: Text(error.localizedDescription))
        }
    }
}

struct OfflineBanner: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.callout)
            .accessibilityLabel("Offline message: \(message)")
            .foregroundColor(.white)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(Color.orange)
            .transition(.move(edge: .top))
    }
}

#Preview {
    ContentView(viewModel: AppBootstrapper.preview.makeDashboardViewModel())
        .environmentObject(Telemetry())
}
