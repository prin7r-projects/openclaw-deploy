#!/usr/bin/env python3
"""Rover Quest, a small standard-library terminal game."""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass, field
from random import Random
from typing import Iterable


@dataclass(frozen=True, slots=True)
class Point:
    x: int
    y: int


@dataclass(frozen=True, slots=True)
class GameConfig:
    width: int = 9
    height: int = 7
    crystals: int = 5
    hazards: int = 7
    max_turns: int = 45

    def __post_init__(self) -> None:
        if self.width < 5:
            raise ValueError("width must be at least 5")
        if self.height < 5:
            raise ValueError("height must be at least 5")
        if self.crystals < 1:
            raise ValueError("crystals must be at least 1")
        if self.hazards < 0:
            raise ValueError("hazards must not be negative")
        if self.max_turns < 1:
            raise ValueError("max_turns must be at least 1")
        if self.crystals + self.hazards >= self.width * self.height:
            raise ValueError("too many crystals and hazards for the board")


@dataclass(slots=True)
class GameState:
    player: Point
    crystals: set[Point] = field(default_factory=set)
    hazards: set[Point] = field(default_factory=set)
    score: int = 0
    turn: int = 0
    game_over: bool = False
    won: bool = False
    message: str = "Collect every crystal before power runs out."


class RoverQuestGame:
    """Turn-based collection game with deterministic seeds for tests."""

    MOVES = {
        "": (0, 0),
        "w": (0, -1),
        "a": (-1, 0),
        "s": (0, 1),
        "d": (1, 0),
    }

    def __init__(self, config: GameConfig | None = None, seed: int | None = None) -> None:
        self.config = config or GameConfig()
        self.random = Random(seed)
        start = Point(self.config.width // 2, self.config.height // 2)
        crystals, hazards = self._generate_board(start)
        self.state = GameState(player=start, crystals=crystals, hazards=hazards)

    def _generate_board(self, start: Point) -> tuple[set[Point], set[Point]]:
        cells = [
            Point(x, y)
            for y in range(self.config.height)
            for x in range(self.config.width)
            if Point(x, y) != start
        ]
        self.random.shuffle(cells)
        crystal_end = self.config.crystals
        hazard_end = crystal_end + self.config.hazards
        return set(cells[:crystal_end]), set(cells[crystal_end:hazard_end])

    def step(self, command: str) -> GameState:
        if self.state.game_over:
            return self.state

        move_key = command.strip().lower()[:1]
        dx, dy = self.MOVES.get(move_key, (0, 0))
        invalid_command = move_key not in self.MOVES

        player = Point(
            x=clamp(self.state.player.x + dx, 0, self.config.width - 1),
            y=clamp(self.state.player.y + dy, 0, self.config.height - 1),
        )
        crystals = set(self.state.crystals)
        score = self.state.score
        game_over = False
        won = False

        if invalid_command:
            message = "Unknown command; rover held position."
        elif player in self.state.hazards:
            message = "Mission failed. The rover hit a hazard."
            game_over = True
        elif player in crystals:
            crystals.remove(player)
            score += 1
            if crystals:
                message = "Crystal collected."
            else:
                message = "Mission complete. All crystals secured."
                game_over = True
                won = True
        else:
            message = "Rover moved."

        turn = self.state.turn + 1
        if not game_over and turn >= self.config.max_turns:
            message = "Mission failed. The rover ran out of power."
            game_over = True

        self.state = GameState(
            player=player,
            crystals=crystals,
            hazards=set(self.state.hazards),
            score=score,
            turn=turn,
            game_over=game_over,
            won=won,
            message=message,
        )
        return self.state

    def render(self) -> str:
        rows = []
        for y in range(self.config.height):
            cells = []
            for x in range(self.config.width):
                point = Point(x, y)
                if point == self.state.player:
                    cells.append("R")
                elif point in self.state.crystals:
                    cells.append("C")
                elif point in self.state.hazards:
                    cells.append("X")
                else:
                    cells.append(".")
            rows.append("|" + "".join(cells) + "|")

        border = "+" + "-" * self.config.width + "+"
        hud = (
            f"Crystals {self.state.score}/{self.config.crystals} | "
            f"Power {max(0, self.config.max_turns - self.state.turn)}"
        )
        controls = "WASD move | Enter wait | Q quit"
        return "\n".join([hud, border, *rows, border, self.state.message, controls])


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def clear_screen() -> None:
    if os.environ.get("ROVER_QUEST_NO_CLEAR") == "1" or not sys.stdout.isatty():
        return
    print("\033[2J\033[H", end="")


def run_interactive(seed: int | None) -> int:
    game = RoverQuestGame(seed=seed)
    clear_screen()
    print(game.render())

    while not game.state.game_over:
        command = input("\nMove: ")
        if command.strip().lower() == "q":
            print("Final score:", game.state.score)
            return 0

        game.step(command)
        clear_screen()
        print(game.render())

    print("\nFinal score:", game.state.score)
    return 0


def run_demo(seed: int | None, turns: int) -> int:
    game = RoverQuestGame(seed=seed)
    demo_moves: Iterable[str] = ("w", "a", "s", "d", "")
    moves = list(demo_moves)

    print(game.render())
    for turn in range(turns):
        if game.state.game_over:
            break
        game.step(moves[turn % len(moves)])
        print()
        print(game.render())

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Play Rover Quest, a tiny terminal game.")
    parser.add_argument("--seed", type=int, default=None, help="Seed the map.")
    parser.add_argument("--demo", action="store_true", help="Run a non-interactive demo.")
    parser.add_argument("--turns", type=int, default=8, help="Demo turns to run.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.demo:
        return run_demo(args.seed, max(0, args.turns))
    return run_interactive(args.seed)


if __name__ == "__main__":
    raise SystemExit(main())
