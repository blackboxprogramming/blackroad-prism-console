# Chia farming on a Pi (low power)
- Farming/harvesting is low energy; **plotting is not**. Create plots elsewhere.
- Mount plots at `/mnt/plots` and enable the service in `miners-compose.yml`.

Example:
```bash
sudo mkdir -p /mnt/plots
sudo mount /dev/sdX1 /mnt/plots   # your HDD
sudo nano /etc/fstab               # add a persistent mount entry
docker compose -f miners/miners-compose.yml up -d chia
docker compose -f miners/miners-compose.yml logs -f chia
```

```

---
