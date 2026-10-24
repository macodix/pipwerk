"""Reading the bytes of an import file as text."""

import codecs

from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.limits import ImportLimits, format_size
from pipwerk_marketdata.records import FileErrorCode


def decode_text(data: bytes, limits: ImportLimits) -> str:
    """Check the size and decode the file.

    A byte order mark selects UTF-8 or UTF-16 (MetaTrader 5 may write either); without one the
    file is UTF-8. A file that cannot be decoded or contains a null character is refused.
    """
    if len(data) > limits.max_bytes:
        raise ImportFileError(
            FileErrorCode.TOO_LARGE,
            f"The file is larger than the limit of {format_size(limits.max_bytes)} per file.",
        )
    if data.startswith((codecs.BOM_UTF16_LE, codecs.BOM_UTF16_BE)):
        encoding = "utf-16"
    elif data.startswith(codecs.BOM_UTF8):
        encoding = "utf-8-sig"
    else:
        encoding = "utf-8"
    try:
        text = data.decode(encoding)
    except UnicodeDecodeError:
        raise ImportFileError(
            FileErrorCode.NOT_DECODABLE, "The file is not valid UTF-8 or UTF-16 text."
        ) from None
    if "\x00" in text:
        raise ImportFileError(FileErrorCode.NOT_DECODABLE, "The file contains a null character.")
    return text
