"""
Daily simulation cycle for Lifebound.
Uses SimPy: one simulation time unit = one day.
"""
import argparse
import simpy


def daily_cycle(env: simpy.Environment, days: int | None):
    """Process that runs one tick per simulated day."""
    day = 0
    while True:
        yield env.timeout(1)  # 1 = one day
        day += 1
        # TODO: later — fetch state from API, decide events, POST back
        print(f"Simulation day {day}")
        if days is not None and day >= days:
            env.exit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Lifebound daily simulation.")
    parser.add_argument(
        "--days",
        type=int,
        default=10,
        metavar="N",
        help="Run for N days (default: 10). Omit or 0 = run until interrupted.",
    )
    args = parser.parse_args()

    env = simpy.Environment()
    env.process(daily_cycle(env, args.days if args.days > 0 else None))
    env.run(until=args.days if args.days > 0 else float("inf"))


if __name__ == "__main__":
    main()
