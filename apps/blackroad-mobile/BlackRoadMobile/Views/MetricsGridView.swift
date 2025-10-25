import SwiftUI
import BlackRoadMobileCore

struct MetricsGridView: View {
    let metrics: [Metric]

    private let columns = [GridItem(.adaptive(minimum: 140), spacing: 16)]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Metrics")
                .font(.headline)
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(metrics) { metric in
                    MetricCard(metric: metric)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
    }
}

struct MetricCard: View {
    let metric: Metric

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: metric.icon)
                    .accessibilityHidden(true)
                Text(metric.title)
                    .font(.headline)
            }
            Text(metric.value)
                .font(.title2)
                .bold()
            Text(metric.caption)
                .font(.footnote)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(metric.status.backgroundColor))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(metric.title): \(metric.value). \(metric.caption)")
    }
}

private extension Metric.Status {
    var backgroundColor: Color {
        switch self {
        case .healthy:
            return Color.green.opacity(0.1)
        case .warning:
            return Color.orange.opacity(0.1)
        case .critical:
            return Color.red.opacity(0.1)
        }
    }
}

#Preview {
    MetricsGridView(metrics: Metric.previewData)
}
