import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "games"))

from rover_quest import GameConfig, Point, RoverQuestGame  # noqa: E402


class RoverQuestGameTest(unittest.TestCase):
    def test_seeded_board_is_deterministic(self) -> None:
        config = GameConfig(width=7, height=7, crystals=3, hazards=4)
        first = RoverQuestGame(config, seed=9)
        second = RoverQuestGame(config, seed=9)

        self.assertEqual(first.state.crystals, second.state.crystals)
        self.assertEqual(first.state.hazards, second.state.hazards)

    def test_player_movement_is_clamped_to_board(self) -> None:
        game = RoverQuestGame(GameConfig(width=5, height=5, crystals=1, hazards=0), seed=1)
        game.state.crystals = {Point(4, 4)}

        for _ in range(10):
            game.step("a")
            game.step("w")

        self.assertEqual(game.state.player, Point(0, 0))
        self.assertFalse(game.state.game_over)

    def test_collecting_last_crystal_wins_game(self) -> None:
        game = RoverQuestGame(GameConfig(width=5, height=5, crystals=1, hazards=0), seed=1)
        game.state.player = Point(2, 2)
        game.state.crystals = {Point(3, 2)}

        game.step("d")

        self.assertEqual(game.state.score, 1)
        self.assertTrue(game.state.game_over)
        self.assertTrue(game.state.won)
        self.assertEqual(game.state.message, "Mission complete. All crystals secured.")

    def test_hazard_ends_game_without_score(self) -> None:
        game = RoverQuestGame(GameConfig(width=5, height=5, crystals=1, hazards=0), seed=1)
        game.state.player = Point(2, 2)
        game.state.crystals = {Point(4, 4)}
        game.state.hazards = {Point(3, 2)}

        game.step("d")

        self.assertEqual(game.state.score, 0)
        self.assertTrue(game.state.game_over)
        self.assertFalse(game.state.won)
        self.assertEqual(game.state.message, "Mission failed. The rover hit a hazard.")

    def test_power_limit_ends_game(self) -> None:
        game = RoverQuestGame(
            GameConfig(width=5, height=5, crystals=1, hazards=0, max_turns=1),
            seed=1,
        )
        game.state.crystals = {Point(4, 4)}

        game.step("")

        self.assertTrue(game.state.game_over)
        self.assertFalse(game.state.won)
        self.assertEqual(game.state.message, "Mission failed. The rover ran out of power.")


if __name__ == "__main__":
    unittest.main()
