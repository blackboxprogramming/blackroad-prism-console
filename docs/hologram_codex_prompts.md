# Hologram Codex Prompts

This document collects ready-to-use prompts for generating hologram rendering scripts with OpenAI Codex. If you want something
you can run immediately without Codex, use the maintained demo script at `scripts/waveshare_hologram_demo.py`.

## Built-In Demo Script

1. Install the dependencies on your Raspberry Pi or Linux workstation:
   ```bash
   sudo apt-get update
   sudo apt-get install python3-pygame python3-opengl
   python3 -m pip install --upgrade pygame PyOpenGL
   ```
2. Copy this repository (or at least `scripts/waveshare_hologram_demo.py`) onto the device that drives the WaveShare cube.
3. Run the demo from a terminal that is attached to the HDMI output going into the cube:
   ```bash
   python3 scripts/waveshare_hologram_demo.py --width 1080 --height 1080 --depth 7
   ```
   Adjust the width/height so that the window is square and fills the WaveShare panel. The ESC or **Q** key stops the loop.
4. Once the animation looks right, optionally create a `systemd` service or desktop autostart entry so the hologram plays on boot.

## Simple Rotating Cube

Use this prompt to have Codex emit Python code that renders a rotating cube to a WaveShare hologram display using PyOpenGL and Pygame.

```
# Write Python code to display a rotating 3D hologram on a WaveShare transparent display cube.
# Requirements:
# 1. Use PyOpenGL and Pygame to render a simple 3D cube or figure.
# 2. Apply rotation animation on the Y-axis and Z-axis.
# 3. Output the rendered frames to an HDMI-connected display (WaveShare cube).
# 4. Code should be modular with clear functions:
#    - init_display()
#    - draw_object()
#    - main_loop()
# 5. Include comments explaining setup for Raspberry Pi or Linux computer.
# 6. Ensure the program can be stopped cleanly with ESC key.

# Write the full code below:
```

## Dancing Avatar Variant

Ask Codex for a more advanced output that loads and animates a dancing 3D avatar instead of a primitive cube.

```
# Write Python code to display a dancing 3D avatar on a WaveShare transparent display cube.
# Requirements:
# 1. Use PyOpenGL and Pygame to render a skinned avatar loaded from a glTF file.
# 2. Play an included dance animation clip, looping it smoothly.
# 3. Apply subtle Y-axis rotation during the performance to maintain the holographic illusion.
# 4. Output frames to the HDMI-connected WaveShare cube, targeting Raspberry Pi or Linux desktops.
# 5. Organize the code into functions:
#    - init_display()
#    - load_avatar()
#    - play_animation()
#    - main_loop()
# 6. Add comments covering package installation (PyOpenGL, Pygame, pygltflib or equivalent) and GPU considerations.
# 7. Allow exiting cleanly with the ESC key and ensure resources are released.

# Write the full code below:
```

Choose the prompt that best matches the desired hologram demo and paste it directly into Codex.
