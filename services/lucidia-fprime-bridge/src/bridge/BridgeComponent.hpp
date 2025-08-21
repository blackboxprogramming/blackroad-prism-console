#pragma once

#include <vector>
#include "Transport/ZmqServer.hpp"

class BridgeComponent {
  public:
    void registerTransport(ZmqServer &transport);
    void startRateGroups(const std::vector<int> &rates);
    void ping();
    void loop();
    void handleCommandSeq(const CommandSeq &seq);

  private:
    ZmqServer *transport = nullptr;
    // add members for scheduler, telemetry queues, etc.
};
