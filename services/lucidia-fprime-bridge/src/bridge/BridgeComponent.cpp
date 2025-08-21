#include "BridgeComponent.hpp"

void BridgeComponent::registerTransport(ZmqServer &t) {
    this->transport = &t;
}

void BridgeComponent::startRateGroups(const std::vector<int> &rates) {
    // TODO: initialize scheduler with given rates
}

void BridgeComponent::ping() {
    // TODO: implement watchdog ping
}

void BridgeComponent::loop() {
    while (true) {
        // TODO: run scheduler and poll transport
        if (transport) {
            transport->poll();
        }
    }
}

void BridgeComponent::handleCommandSeq(const CommandSeq &seq) {
    // TODO: validate and queue sequence
}
