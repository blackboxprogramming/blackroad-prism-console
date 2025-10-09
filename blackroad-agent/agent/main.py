import asyncio
from . import telemetry, jobs


async def main():
    while True:
        pi_stats = telemetry.collect_local()
        try:
            jetson_stats = telemetry.collect_remote("jetson.local")
        except Exception:
            jetson_stats = {}
        print("Pi:", pi_stats, "Jetson:", jetson_stats)
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(main())
