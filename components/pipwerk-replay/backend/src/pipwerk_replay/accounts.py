"""The test account (specification 6.2, req-test-005): model and service.

A test account is a named set of values for the settlement of a test run:
initial capital, account currency, leverage, spread and commission. The models
here are the public representation (web API) and are checked strictly: a field
that is not named is rejected, every value has a range, and no number is ``NaN``
or infinite. ``AccountService`` is the boundary in front of the database.

Which test account is the default one (decision of the developer): the default
test account has a fixed identifier, ``DEFAULT_ACCOUNT_ID``. The identifier of
every other test account is made by the service, never taken from a request, so
a test account of the user cannot get it. "Default" is therefore no stored
property that the user can change, and no name decides it: the start creates the
default test account exactly if no test account with this identifier exists. A
test account of the user with the same name is not touched and does not hinder
that (names are not unique). The default test account can be changed and deleted
like any other one; after deleting it, the next start creates it again.
"""

from __future__ import annotations

import unicodedata
import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from pipwerk_replay.storage import AccountRecord

#: Identifier of the default test account (a fixed value, see the module text).
DEFAULT_ACCOUNT_ID = "5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21"

#: Name of the default test account. The user interface shows the English text for the
#: default test account by itself; the stored name is German.
DEFAULT_ACCOUNT_NAME = "Standard-Testkonto"

MAX_NAME_LENGTH = 100
MAX_INITIAL_CAPITAL = 1e12
MAX_LEVERAGE = 1000
MAX_SPREAD_POINTS = 100_000.0
MAX_COMMISSION = 100_000.0

SpreadMode = Literal["candle", "fixed"]
"""``candle``: the spread of the candle (of the tick); ``fixed``: ``spread_points``."""

#: Unicode categories that are no part of a name: control characters, line and paragraph
#: separators.
_FORBIDDEN_IN_NAME = frozenset({"Cc", "Zl", "Zp"})

Currency = Annotated[str, StringConstraints(pattern=r"^[A-Z]{3}$")]


def _has_forbidden_character(name: str) -> bool:
    return any(unicodedata.category(character) in _FORBIDDEN_IN_NAME for character in name)


class AccountInput(BaseModel):
    """The values of a test account that the user sets (create and change)."""

    model_config = ConfigDict(extra="forbid", strict=True)

    name: str = Field(
        min_length=1,
        max_length=MAX_NAME_LENGTH,
        description="Name of the test account, 1 to 100 characters without control characters.",
    )
    initial_capital: float = Field(
        gt=0,
        le=MAX_INITIAL_CAPITAL,
        allow_inf_nan=False,
        description="Initial capital in the account currency, greater than 0.",
    )
    currency: Currency = Field(
        description="Account currency, three capital letters (for example EUR)."
    )
    leverage: int = Field(ge=1, le=MAX_LEVERAGE, description="Leverage, 1 to 1000.")
    spread_mode: SpreadMode = Field(
        description="candle: the spread of the candles; fixed: the value of spread_points."
    )
    spread_points: float | None = Field(
        allow_inf_nan=False,
        ge=0,
        le=MAX_SPREAD_POINTS,
        description=(
            "Fixed spread in points. Required for the spread mode fixed, null for the mode candle."
        ),
    )
    commission_per_lot_side: float = Field(
        ge=0,
        le=MAX_COMMISSION,
        allow_inf_nan=False,
        description="Commission per lot and side in the account currency, 0 or more.",
    )

    @model_validator(mode="after")
    def _check_values(self) -> AccountInput:
        if _has_forbidden_character(self.name) or not self.name.strip():
            raise ValueError("The name must contain a visible character and no control character.")
        if self.spread_mode == "fixed" and self.spread_points is None:
            raise ValueError("The spread mode fixed needs spread_points.")
        if self.spread_mode == "candle" and self.spread_points is not None:
            raise ValueError("The spread mode candle takes no spread_points.")
        return self


class Account(AccountInput):
    """A test account: its values, its identifier and whether it is the default one.

    ``is_default`` is read-only: it is true exactly for the account with the fixed
    identifier of the default test account.
    """

    id: str = Field(description="Identifier of the test account (a UUID).")
    is_default: bool = Field(description="Whether this is the default test account.")


class AccountNotFoundError(Exception):
    """There is no test account with the identifier."""


def default_account_input() -> AccountInput:
    """The values of the default test account (10 000 EUR, leverage 30, spread of the
    candles, commission 0)."""
    return AccountInput(
        name=DEFAULT_ACCOUNT_NAME,
        initial_capital=10_000.0,
        currency="EUR",
        leverage=30,
        spread_mode="candle",
        spread_points=None,
        commission_per_lot_side=0.0,
    )


def _to_model(record: AccountRecord) -> Account:
    # The values come from the database; they are checked again, so a damaged row
    # is not passed on as a valid test account.
    return Account.model_validate(
        {
            "id": record.id,
            "is_default": record.id == DEFAULT_ACCOUNT_ID,
            "name": record.name,
            "initial_capital": record.initial_capital,
            "currency": record.currency,
            "leverage": record.leverage,
            "spread_mode": record.spread_mode,
            "spread_points": record.spread_points,
            "commission_per_lot_side": record.commission_per_lot_side,
        }
    )


def _apply(record: AccountRecord, data: AccountInput) -> None:
    record.name = data.name
    record.initial_capital = data.initial_capital
    record.currency = data.currency
    record.leverage = data.leverage
    record.spread_mode = data.spread_mode
    record.spread_points = data.spread_points
    record.commission_per_lot_side = data.commission_per_lot_side


class AccountService:
    """Create, read, change and delete test accounts; ensure the default one."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def ensure_default_account(self) -> bool:
        """Create the default test account if there is none with its identifier.

        Returns whether it was created. Two processes that start at the same time
        create it once: the one that loses on the primary key does nothing.
        """
        with self._session_factory() as session:
            if session.get(AccountRecord, DEFAULT_ACCOUNT_ID) is not None:
                return False
            record = AccountRecord(id=DEFAULT_ACCOUNT_ID)
            _apply(record, default_account_input())
            session.add(record)
            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                return False
            return True

    def list_accounts(self) -> list[Account]:
        """All test accounts, sorted by name (without regard to case), then by identifier."""
        with self._session_factory() as session:
            records = session.scalars(select(AccountRecord)).all()
            accounts = [_to_model(record) for record in records]
        return sorted(accounts, key=lambda item: (item.name.casefold(), item.id))

    def get_account(self, account_id: str) -> Account:
        with self._session_factory() as session:
            record = session.get(AccountRecord, account_id)
            if record is None:
                raise AccountNotFoundError
            return _to_model(record)

    def create_account(self, data: AccountInput) -> Account:
        """Create a test account under a new identifier."""
        record = AccountRecord(id=str(uuid.uuid4()))
        _apply(record, data)
        with self._session_factory() as session:
            session.add(record)
            session.commit()
            return _to_model(record)

    def update_account(self, account_id: str, data: AccountInput) -> Account:
        """Replace the values of a test account. Never creates one."""
        with self._session_factory() as session:
            record = session.get(AccountRecord, account_id)
            if record is None:
                raise AccountNotFoundError
            _apply(record, data)
            session.commit()
            return _to_model(record)

    def delete_account(self, account_id: str) -> None:
        with self._session_factory() as session:
            record = session.get(AccountRecord, account_id)
            if record is None:
                raise AccountNotFoundError
            session.delete(record)
            session.commit()
