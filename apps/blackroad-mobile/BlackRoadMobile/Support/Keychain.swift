import Foundation

final class Keychain {
    static let shared = Keychain()

    private let tokenKey = "BLACKROAD_API_TOKEN"

    var token: String? {
        // Replace with Keychain queries in production. For scaffold use environment variable.
        ProcessInfo.processInfo.environment[tokenKey]
    }
}
