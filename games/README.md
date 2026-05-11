# Python Games

## Starfall

Starfall is a tiny terminal dodge game written with only the Python standard
library.

Run it from the repository root:

```bash
python3 games/starfall.py
```

Controls:

- `W`, `A`, `S`, `D` move the ship.
- Press `Enter` to wait.
- `Q` quits.

For a deterministic non-interactive smoke run:

```bash
python3 games/starfall.py --demo --seed 7 --turns 5
```
