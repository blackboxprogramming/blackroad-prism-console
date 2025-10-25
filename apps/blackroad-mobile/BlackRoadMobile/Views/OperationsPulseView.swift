import SwiftUI
import BlackRoadMobileCore

struct OperationsPulseView: View {
    let summary: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Operations Pulse")
                .font(.title)
                .bold()
            Text(summary)
                .font(.body)
                .accessibilityLabel("Operations summary: \(summary)")
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    OperationsPulseView(summary: "Platform latency remains under 120ms across all regions.")
}
