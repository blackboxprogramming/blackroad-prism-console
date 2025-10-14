# Raspberry Pi Developer Mode Setup Scripts

This directory contains helper scripts for preparing Raspberry Pi devices for BlackRoad developer workflows.

## Files

- `developer_mode_setup.sh` &mdash; Automates the "Day 1" provisioning sequence for a Raspberry Pi mini tower, including package upgrades, Docker, I2C enablement, fan PWM service, and an SSD1306 OLED status display script.

## Usage

```bash
curl -sSL https://your-url/setup.sh | bash
```

Or run locally after copying the repository:

```bash
chmod +x developer_mode_setup.sh
./developer_mode_setup.sh
```

After completion, reboot the Pi to ensure the fan control service and OLED statistics display start automatically.
