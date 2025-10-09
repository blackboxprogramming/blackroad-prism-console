import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var dashboard: AppDashboardViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    metricsGrid
                    actionsSection
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("BlackRoad")
            .task {
                await dashboard.refresh()
            }
            .refreshable {
                await dashboard.refresh()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Operations Pulse")
                .font(.largeTitle.weight(.semibold))
            Text(dashboard.summary)
                .font(.callout)
                .foregroundStyle(.secondary)
            if let timestamp = dashboard.lastUpdated {
                Text("Updated \(timestamp.formatted(date: .omitted, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: 16)], spacing: 16) {
            ForEach(dashboard.metrics) { metric in
                MetricCard(metric: metric)
            }
        }
    }

    private var actionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Shortcuts")
                .font(.title3.weight(.semibold))
            ForEach(dashboard.shortcuts) { shortcut in
                Link(destination: shortcut.url) {
                    HStack {
                        Label(shortcut.title, systemImage: shortcut.icon)
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct MetricCard: View {
    let metric: DashboardMetric

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(metric.title)
                    .font(.headline)
                Spacer()
                Image(systemName: metric.icon)
                    .foregroundStyle(metric.status.tint)
            }
            Text(metric.value)
                .font(.system(.largeTitle, design: .rounded).weight(.semibold))
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text(metric.caption)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(metric.status.background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(metric.title) \(metric.value) \(metric.caption)")
    }
}

#Preview {
    ContentView()
        .environmentObject(AppDashboardViewModel.preview)
}
