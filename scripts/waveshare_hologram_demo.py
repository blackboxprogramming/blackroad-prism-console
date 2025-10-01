"""WaveShare hologram cube demo.

This script renders a colored cube that continuously rotates on two axes. It is
intended for Raspberry Pi or Linux desktops driving the WaveShare transparent
hologram display via HDMI. The code uses PyGame to manage the window and event
loop while PyOpenGL performs the rendering.

Usage:
    python3 waveshare_hologram_demo.py [--width WIDTH] [--height HEIGHT]

Install dependencies with:
    pip install pygame PyOpenGL

On Raspberry Pi OS you may also need the SDL dependencies:
    sudo apt-get install python3-pygame python3-opengl
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass

import pygame
from pygame import locals as pyg_locals
from OpenGL import GL
from OpenGL import GLU


@dataclass
class DisplayConfig:
    """Runtime configuration for the hologram window."""

    width: int = 960
    height: int = 720
    depth: float = 6.0
    rotation_speed_y: float = 35.0  # degrees per second
    rotation_speed_z: float = 20.0  # degrees per second


def init_display(cfg: DisplayConfig) -> None:
    """Initialize pygame and configure the OpenGL viewport."""

    pygame.display.init()
    pygame.font.init()
    flags = pyg_locals.DOUBLEBUF | pyg_locals.OPENGL
    pygame.display.set_mode((cfg.width, cfg.height), flags)
    pygame.display.set_caption("WaveShare Hologram Demo")
    pygame.mouse.set_visible(False)

    GL.glViewport(0, 0, cfg.width, cfg.height)
    GL.glEnable(GL.GL_DEPTH_TEST)
    GL.glClearColor(0.02, 0.02, 0.02, 1.0)

    aspect_ratio = cfg.width / cfg.height
    GLU.gluPerspective(45.0, aspect_ratio, 0.1, 50.0)
    GL.glTranslatef(0.0, 0.0, -cfg.depth)


def draw_cube(size: float = 1.4) -> None:
    """Render a six-faced cube with distinct colors per face."""

    half = size / 2.0
    vertices = (
        (half, -half, -half),
        (half, half, -half),
        (-half, half, -half),
        (-half, -half, -half),
        (half, -half, half),
        (half, half, half),
        (-half, -half, half),
        (-half, half, half),
    )

    faces = (
        (0, 1, 2, 3),  # back
        (4, 5, 1, 0),  # right
        (7, 6, 4, 5),  # front
        (6, 7, 2, 3),  # left
        (5, 7, 2, 1),  # top
        (4, 6, 3, 0),  # bottom
    )

    colors = (
        (0.9, 0.1, 0.2),
        (0.2, 0.7, 0.9),
        (0.1, 0.9, 0.4),
        (0.9, 0.6, 0.15),
        (0.6, 0.2, 0.8),
        (0.9, 0.9, 0.15),
    )

    GL.glBegin(GL.GL_QUADS)
    for face, color in zip(faces, colors):
        GL.glColor3f(*color)
        for vertex_index in face:
            GL.glVertex3f(*vertices[vertex_index])
    GL.glEnd()

    GL.glColor3f(0.05, 0.05, 0.05)
    GL.glLineWidth(2.0)
    GL.glBegin(GL.GL_LINES)
    edges = (
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 0),
        (4, 5),
        (5, 7),
        (7, 6),
        (6, 4),
        (0, 4),
        (1, 5),
        (2, 7),
        (3, 6),
    )
    for edge in edges:
        for vertex_index in edge:
            GL.glVertex3f(*vertices[vertex_index])
    GL.glEnd()


def handle_events() -> bool:
    """Process pygame events. Returns True while the app should continue."""

    for event in pygame.event.get():
        if event.type == pyg_locals.QUIT:
            return False
        if event.type == pyg_locals.KEYDOWN:
            if event.key in (pyg_locals.K_ESCAPE, pyg_locals.K_q):
                return False
    return True


def main_loop(cfg: DisplayConfig) -> None:
    """Run the render loop until the user requests exit."""

    clock = pygame.time.Clock()
    angle_y = 0.0
    angle_z = 0.0

    running = True
    while running:
        running = handle_events()
        delta_time = clock.tick(60) / 1000.0

        angle_y = (angle_y + cfg.rotation_speed_y * delta_time) % 360
        angle_z = (angle_z + cfg.rotation_speed_z * delta_time) % 360

        GL.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT)
        GL.glPushMatrix()
        GL.glRotatef(angle_y, 0.0, 1.0, 0.0)
        GL.glRotatef(angle_z, 0.0, 0.0, 1.0)
        draw_cube()
        GL.glPopMatrix()

        pygame.display.flip()

    pygame.quit()


def parse_args(argv: list[str] | None = None) -> DisplayConfig:
    """Parse CLI arguments and return the configuration."""

    parser = argparse.ArgumentParser(description="WaveShare hologram demo")
    parser.add_argument("--width", type=int, default=960, help="Render window width")
    parser.add_argument("--height", type=int, default=720, help="Render window height")
    parser.add_argument(
        "--depth",
        type=float,
        default=6.0,
        help="Camera distance from the cube (larger pushes cube farther away)",
    )
    parser.add_argument(
        "--speed-y",
        type=float,
        default=35.0,
        help="Rotation speed around the Y axis in degrees per second",
    )
    parser.add_argument(
        "--speed-z",
        type=float,
        default=20.0,
        help="Rotation speed around the Z axis in degrees per second",
    )
    args = parser.parse_args(argv)

    return DisplayConfig(
        width=args.width,
        height=args.height,
        depth=args.depth,
        rotation_speed_y=args.speed_y,
        rotation_speed_z=args.speed_z,
    )


def main(argv: list[str] | None = None) -> int:
    cfg = parse_args(argv)
    pygame.init()
    try:
        init_display(cfg)
        main_loop(cfg)
    except Exception:  # pragma: no cover - ensure pygame quits on unexpected errors
        pygame.quit()
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
