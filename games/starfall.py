#!/usr/bin/env python3
"""Starfall, a small standard-library terminal game."""

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
    width: int = 17
    height: int = 11
    lives: int = 3
    spawn_chance: float = 0.55
    max_meteors: int = 22

    def __post_init__(self) -> None:
        if self.width < 7:
            raise ValueError("width must be at least 7")
        if self.height < 7:
            raise ValueError("height must be at least 7")
        if self.lives < 1:
            raise ValueError("lives must be at least 1")
        if not 0 <= self.spawn_chance <= 1:
            raise ValueError("spawn_chance must be between 0 and 1")
        if self.max_meteors < 1:
            raise ValueError("max_meteors must be at least 1")


@dataclass(slots=True)
class GameState:
    player: Point
    meteors: set[Point] = field(default_factory=set)
    score: int = 0
    lives: int = 3
    turn: int = 0
    game_over: bool = False
    message: str = "Dodge the falling stars."


class StarfallGame:
    """Turn-based dodge game logic with deterministic seeds for tests."""

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
        self.state = GameState(
            player=Point(self.config.width // 2, self.config.height - 1),
            lives=self.config.lives,
        )

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

        meteors = {
            Point(meteor.x, meteor.y + 1)
            for meteor in self.state.meteors
            if meteor.y + 1 < self.config.height
        }

        if len(meteors) < self.config.max_meteors and self.random.random() < self.config.spawn_chance:
            meteors.add(Point(self.random.randrange(self.config.width), 0))

        lives = self.state.lives
        score = self.state.score
        message = "Clear lane."

        if player in meteors:
            lives -= 1
            meteors.remove(player)
            message = "Hit! Hull integrity down."
            if lives == 0:
                message = "Game over. The sky wins."
        else:
            score += 1

        if invalid_command:
            message = "Unknown command; drifted in place."

        self.state = GameState(
            player=player,
            meteors=meteors,
            score=score,
            lives=lives,
            turn=self.state.turn + 1,
            game_over=lives == 0,
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
                    cells.append("^")
                elif point in self.state.meteors:
                    cells.append("*")
                else:
                    cells.append(" ")
            rows.append("|" + "".join(cells) + "|")

        border = "+" + "-" * self.config.width + "+"
        hud = f"Score {self.state.score} | Lives {self.state.lives} | Turn {self.state.turn}"
        controls = "WASD move | Enter wait | Q quit"
        return "\n".join([hud, border, *rows, border, self.state.message, controls])


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def clear_screen() -> None:
    if os.environ.get("STARFALL_NO_CLEAR") == "1" or not sys.stdout.isatty():
        return
    print("\033[2J\033[H", end="")


def run_interactive(seed: int | None) -> int:
    game = StarfallGame(seed=seed)
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
    game = StarfallGame(seed=seed)
    demo_moves: Iterable[str] = ("", "a", "d", "w", "s")
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
    parser = argparse.ArgumentParser(description="Play Starfall, a tiny terminal dodge game.")
    parser.add_argument("--seed", type=int, default=None, help="Seed the meteor field.")
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
