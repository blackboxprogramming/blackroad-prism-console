# Disposable Malware Lab Workflow

This guide captures a practical, repeatable workflow for running risky experiments (e.g., malware detonation, unknown binaries, or untrusted code) in a disposable environment while preserving artifact integrity and provenance.

## 1. Build a Disposable Lab

### Snapshot-centric virtual machines

Virtual machine (VM) snapshots let you revert to a known-good baseline within seconds after each run. Create a “clean base” snapshot immediately after installing and hardening the guest OS.

#### KVM / libvirt (CLI)
```bash
# create baseline snapshot
virsh snapshot-create-as mylab clean-base --description "Fresh baseline"
# inspect available snapshots
virsh snapshot-list mylab --tree
# revert to baseline
virsh snapshot-revert mylab clean-base
```

#### KVM / virt-manager (GUI)
1. Open **virt-manager** and highlight the VM.
2. Navigate to **View → Snapshots → +**.
3. Name the snapshot (e.g., `clean-base`) and save.
4. To revert, select the snapshot and click **Revert**.

#### VMware Workstation / Fusion
1. **VM → Snapshot → Take Snapshot…** right after provisioning.
2. Enter a descriptive name (e.g., `Clean Baseline`) and confirm.
3. After each test, choose **VM → Snapshot → Revert to Snapshot**.

#### VirtualBox
```bash
# take snapshot from the host
VBoxManage snapshot "Malware Lab" take "clean-base" --description "Fresh baseline"
# list snapshots
VBoxManage snapshot "Malware Lab" list
# restore snapshot
VBoxManage snapshot "Malware Lab" restore "clean-base"
```
Alternatively, use the GUI via **Machine → Take Snapshot…** and **Machine → Snapshots → Restore**.

#### Proxmox VE
1. In the Proxmox web UI, select the VM and open the **Snapshots** tab.
2. Click **Take Snapshot**, give it a name (e.g., `clean-base`), and enable RAM capture if you need exact memory state.
3. After each detonation, return to the snapshot by selecting it and clicking **Rollback**.

### Containment tips
- Keep malware analysis VMs isolated: disable shared clipboards and folders, prefer NAT-only or fenced networks, and document your baseline configuration.
- For quick tooling runs (not live malware), ephemeral containers such as `docker run --rm …` inside the VM are convenient. Do **not** run risky samples directly in host namespaces.

## 2. Minimum Safe Cycle

1. Snapshot the clean VM (or confirm you can revert to `clean-base`).
2. Stage the sample entirely inside the VM—no shared folders or clipboard bridges.
3. Execute the sample, capturing telemetry (packet captures, screenshots, logs, debugger traces).
4. Move resulting artifacts to a designated export directory inside the VM.
5. Hash and sign those artifacts before moving them to the host.
6. Revert the VM to the baseline snapshot.

## 3. Preserve Integrity and Provenance

Hashing and signing exported artifacts ensures tamper-evidence and prepares you for formal provenance workflows (NIST SSDF and SLSA).

```bash
# create deterministic digests
sha256sum report.txt > report.txt.sha256
sha256sum results.tar.gz > results.tar.gz.sha256
```

### Signing options

#### OpenPGP
```bash
gpg --detach-sign --armor results.tar.gz
```
Distribute your public key alongside the artifact so recipients can verify the signature.

#### Sigstore (keyless)
```bash
cosign sign-blob --output-signature results.tar.gz.sig results.tar.gz
```
Requires connectivity to Sigstore; recommended when you need transparency logs and short-lived identities.

### Why this matters
- **NIST SSDF 1.1 (SP 800-218):** Emphasizes safeguarding builds and maintaining traceability across the SDLC. Hashing/signing plus controlled labs directly support these controls.
- **SLSA (Supply-chain Levels for Software Artifacts):** Provenance and tamper-resistant builds begin at Level 2. By hashing/signing today, you lay the groundwork for later SLSA attestations (e.g., in-toto metadata emitted by BuildKit or Tekton).

## 4. Quick Setup Checklist

- **Host:** Enable virtualization extensions; install your hypervisor (KVM/libvirt, VMware, VirtualBox, or Proxmox).
- **Guest:** Install the analysis OS (e.g., REMnux, FLARE VM, hardened Linux). Apply updates, add tooling, and snapshot immediately.
- **Networking:** Use NAT, host-only, or isolated virtual switches/VLANs; disable clipboard and folder sharing.
- **Inside the VM:** Install capture/logging tools, designate an export directory, and configure `gpg` and/or `cosign`.
- **Run cycle:** Snapshot → Test → Collect artifacts → Hash/sign → Export → Revert.

Following this loop keeps experiments reproducible, auditable, and ready for provenance requirements as your security posture matures.
