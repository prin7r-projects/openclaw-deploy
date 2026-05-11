import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "games"))

from starfall import GameConfig, Point, StarfallGame  # noqa: E402


class StarfallGameTest(unittest.TestCase):
    def test_player_movement_is_clamped_to_board(self) -> None:
        game = StarfallGame(GameConfig(width=7, height=7, spawn_chance=0), seed=1)

        for _ in range(10):
            game.step("a")
            game.step("s")

        self.assertEqual(game.state.player, Point(0, 6))

    def test_surviving_turn_increments_score(self) -> None:
        game = StarfallGame(GameConfig(width=7, height=7, spawn_chance=0), seed=1)

        game.step("")

        self.assertEqual(game.state.score, 1)
        self.assertEqual(game.state.lives, 3)
        self.assertFalse(game.state.game_over)

    def test_meteor_collision_costs_life_without_score(self) -> None:
        game = StarfallGame(GameConfig(width=7, height=7, spawn_chance=0), seed=1)
        game.state.meteors.add(Point(3, 5))

        game.step("")

        self.assertEqual(game.state.player, Point(3, 6))
        self.assertEqual(game.state.lives, 2)
        self.assertEqual(game.state.score, 0)

    def test_game_over_after_last_life_is_lost(self) -> None:
        game = StarfallGame(GameConfig(width=7, height=7, lives=1, spawn_chance=0), seed=1)
        game.state.meteors.add(Point(3, 5))

        game.step("")

        self.assertTrue(game.state.game_over)
        self.assertEqual(game.state.message, "Game over. The sky wins.")


if __name__ == "__main__":
    unittest.main()
