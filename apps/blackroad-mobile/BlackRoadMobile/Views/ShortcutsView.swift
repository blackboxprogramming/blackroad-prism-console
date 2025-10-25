import SwiftUI
import BlackRoadMobileCore

struct ShortcutsView: View {
    let shortcuts: [Shortcut]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Shortcuts")
                .font(.headline)
            ForEach(shortcuts) { shortcut in
                Link(destination: shortcut.url) {
                    HStack {
                        Image(systemName: shortcut.icon)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading) {
                            Text(shortcut.title)
                                .font(.body)
                            Text(shortcut.url.absoluteString)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                                .truncationMode(.middle)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                            .accessibilityHidden(true)
                    }
                    .padding()
                    .background(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.2)))
                }
                .accessibilityLabel("Open \(shortcut.title)")
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
    }
}

#Preview {
    ShortcutsView(shortcuts: Shortcut.previewData)
}
