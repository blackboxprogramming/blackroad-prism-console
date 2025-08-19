#include <thread>
#include "Fw/Types/Assert.hpp"
#include "Os/Task.hpp"
#include "Bridge/BridgeComponent.hpp"
#include "Transport/ZmqServer.hpp"      // or gRPC server wrapper

int main() {
    BridgeComponent bridge;
    ZmqServer transport("ipc:///var/run/lucidia_bridge.sock");

    bridge.registerTransport(transport);
    bridge.startRateGroups({10, 50, 100}); // Hz

    // Watchdog
    std::thread watchdog([&](){
        while (true) {
            bridge.ping();
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    });

    bridge.loop();        // Runs scheduler, telemetry, command processing
    watchdog.join();
    return 0;
}
