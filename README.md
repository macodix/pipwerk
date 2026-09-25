# Pipwerk

Pipwerk is a system for graphical strategy design, backtesting, trading execution and inter-component messaging.

## Components

- **Pipwerk Studio** (`pipwerk-studio`): graphical strategy designer
- **Pipwerk Backtest** (`pipwerk-backtest`): strategy tester
- **Pipwerk Trader** (`pipwerk-trader`): trading system
- **Pipwerk Relay** (`pipwerk-relay`): messaging system

## Repository structure

- `components/`: independently runnable applications
- `packages/`: shared Python and TypeScript packages
- `contracts/`: versioned API, message and strategy contracts
- `docs/design/`: requirements, domain model, strategies and design work
- `docs/technical/`: technical documentation
- `docs/user/`: user documentation
- `tests/integration/`: cross-component tests
- `deploy/`: installation, packaging and service definitions
- `tools/`: development and verification tools

## License

GNU General Public License v3.0. See `LICENSE`.
