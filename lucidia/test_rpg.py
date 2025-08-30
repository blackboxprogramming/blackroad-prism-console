"""Tests for the tiny Lucidia RPG game."""
import random

from lucidia.rpg import Character, Game


def test_player_wins_against_weak_enemy() -> None:
    rng = random.Random(0)
    player = Character("Hero", hp=10, attack_min=3, attack_max=3)
    enemy = Character("Goblin", hp=5, attack_min=1, attack_max=1)
    game = Game(player, enemy, rng)
    winner = game.run()
    assert winner == "Hero"
    assert player.is_alive()
    assert not enemy.is_alive()
