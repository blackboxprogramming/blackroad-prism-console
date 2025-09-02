"""Client for connecting to public solar panel data APIs.

This module fetches solar production estimates from the NREL PVWatts API,
which provides public access to solar panel performance data.
"""

from __future__ import annotations

from typing import Any

import requests


class SolarNetworkClient:
    """Client for retrieving solar production estimates.

    The client uses the public NREL PVWatts API and defaults to the provided
    demonstration key. Users can supply their own API key for higher rate
    limits.
    """

    base_url = "https://developer.nrel.gov/api/pvwatts/v8.json"

    def __init__(self, api_key: str = "DEMO_KEY") -> None:
        """Initialize the client with an API key.

        Args:
            api_key: NREL API key. The default "DEMO_KEY" is suitable for
                low-volume requests.
        """
        self.api_key = api_key

    def fetch_estimate(self, **params: Any) -> dict[str, Any]:
        """Fetch a solar production estimate from the API.

        Args:
            **params: Additional query parameters such as ``system_capacity`` or
                ``tilt``. Refer to the PVWatts API documentation for all
                supported fields.

        Returns:
            Parsed JSON response from the API.

        Raises:
            requests.HTTPError: If the HTTP request fails.
        """
        query = {"api_key": self.api_key} | params
        headers = {"Accept": "application/json"}
        response = requests.get(
            self.base_url, params=query, headers=headers, timeout=10
        )
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":  # pragma: no cover
    client = SolarNetworkClient()
    try:
        data = client.fetch_estimate(
            system_capacity=4,
            module_type=1,
            losses=10,
            array_type=1,
            tilt=10,
            azimuth=180,
            lat=39.742043,
            lon=-105.177996,
        )
        ac_annual = data.get("outputs", {}).get("ac_annual")
        print("AC Annual Output (kWh):", ac_annual)
    except requests.HTTPError as exc:  # pragma: no cover
        print("API request failed:", exc)
