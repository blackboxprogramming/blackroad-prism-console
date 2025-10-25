import LocalAuthentication

enum BiometricsGate {
    static let shared = BiometricsGateImpl()
}

protocol BiometricsGating {
    func authenticateIfNeeded() async -> Bool
}

final class BiometricsGateImpl: BiometricsGating {
    private let context: LAContext

    init(context: LAContext = .init()) {
        self.context = context
    }

    func authenticateIfNeeded() async -> Bool {
        guard Keychain.shared.token != nil else { return true }
        let reason = "Unlock BlackRoad Mobile"
        var error: NSError?
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            return await withCheckedContinuation { continuation in
                context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, _ in
                    continuation.resume(returning: success)
                }
            }
        } else {
            return true
        }
    }
}
