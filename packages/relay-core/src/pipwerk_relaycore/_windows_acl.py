"""Check of the access rights of a file or directory on Windows.

A file or directory counts as private if

- its owner is the current user or the group Administrators,
- it has an access list (a missing access list gives everyone access and is refused) and
- every entry that allows access names the owner, the current user, the system account or the
  group Administrators.

Entries that deny access are ignored. An entry of a kind not known here makes the check fail.
The module is loaded on Windows only; on other systems ``check_private`` does not exist.
"""

import sys

if sys.platform == "win32":  # pragma: no cover - runs on Windows only
    import ctypes
    from ctypes import wintypes
    from pathlib import Path

    from pipwerk_relaycore.errors import SecretsAccessError

    _advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    _kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    _SE_FILE_OBJECT = 1
    _OWNER_SECURITY_INFORMATION = 0x1
    _DACL_SECURITY_INFORMATION = 0x4
    _ACL_SIZE_INFORMATION = 2
    _TOKEN_QUERY = 0x8
    _TOKEN_USER = 1
    _ACCESS_ALLOWED_ACE_TYPE = 0
    _DENY_ACE_TYPES = frozenset({1, 6, 10, 12})
    _SID_SYSTEM = "S-1-5-18"
    _SID_ADMINISTRATORS = "S-1-5-32-544"

    class _AclSizeInformation(ctypes.Structure):
        _fields_ = (
            ("AceCount", wintypes.DWORD),
            ("AclBytesInUse", wintypes.DWORD),
            ("AclBytesFree", wintypes.DWORD),
        )

    class _AceHeader(ctypes.Structure):
        _fields_ = (
            ("AceType", ctypes.c_ubyte),
            ("AceFlags", ctypes.c_ubyte),
            ("AceSize", wintypes.WORD),
        )

    _pointer = ctypes.c_void_p
    _advapi32.GetNamedSecurityInfoW.argtypes = (
        wintypes.LPCWSTR,
        ctypes.c_int,
        wintypes.DWORD,
        ctypes.POINTER(_pointer),
        ctypes.POINTER(_pointer),
        ctypes.POINTER(_pointer),
        ctypes.POINTER(_pointer),
        ctypes.POINTER(_pointer),
    )
    _advapi32.GetNamedSecurityInfoW.restype = wintypes.DWORD
    _advapi32.GetAclInformation.argtypes = (
        _pointer,
        ctypes.c_void_p,
        wintypes.DWORD,
        ctypes.c_int,
    )
    _advapi32.GetAclInformation.restype = wintypes.BOOL
    _advapi32.GetAce.argtypes = (_pointer, wintypes.DWORD, ctypes.POINTER(_pointer))
    _advapi32.GetAce.restype = wintypes.BOOL
    _advapi32.ConvertSidToStringSidW.argtypes = (_pointer, ctypes.POINTER(_pointer))
    _advapi32.ConvertSidToStringSidW.restype = wintypes.BOOL
    _advapi32.OpenProcessToken.argtypes = (
        wintypes.HANDLE,
        wintypes.DWORD,
        ctypes.POINTER(wintypes.HANDLE),
    )
    _advapi32.OpenProcessToken.restype = wintypes.BOOL
    _advapi32.GetTokenInformation.argtypes = (
        wintypes.HANDLE,
        ctypes.c_int,
        ctypes.c_void_p,
        wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD),
    )
    _advapi32.GetTokenInformation.restype = wintypes.BOOL
    _kernel32.GetCurrentProcess.restype = wintypes.HANDLE
    _kernel32.LocalFree.argtypes = (_pointer,)
    _kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)

    def _fail(text: str) -> SecretsAccessError:
        return SecretsAccessError(text)

    def _sid_text(sid: int | None) -> str:
        if not sid:
            raise _fail("access rights cannot be read: no SID")
        text = _pointer()
        if not _advapi32.ConvertSidToStringSidW(_pointer(sid), ctypes.byref(text)):
            raise _fail("access rights cannot be read: SID not convertible")
        try:
            return ctypes.wstring_at(text.value)
        finally:
            _kernel32.LocalFree(text)

    def _current_user_sid() -> str:
        token = wintypes.HANDLE()
        if not _advapi32.OpenProcessToken(
            _kernel32.GetCurrentProcess(), _TOKEN_QUERY, ctypes.byref(token)
        ):
            raise _fail("access rights cannot be read: no process token")
        try:
            size = wintypes.DWORD()
            _advapi32.GetTokenInformation(token, _TOKEN_USER, None, 0, ctypes.byref(size))
            buffer = ctypes.create_string_buffer(size.value)
            if not _advapi32.GetTokenInformation(
                token, _TOKEN_USER, buffer, size, ctypes.byref(size)
            ):
                raise _fail("access rights cannot be read: no user of the process")
            # TOKEN_USER starts with SID_AND_ATTRIBUTES, whose first member is the pointer.
            return _sid_text(ctypes.c_void_p.from_buffer(buffer).value)
        finally:
            _kernel32.CloseHandle(token)

    def check_private(path: Path, *, directory: bool) -> None:
        """Raise ``SecretsAccessError`` unless only the owner (and the system) can access."""
        del directory  # the same rule applies to files and directories
        owner = _pointer()
        acl = _pointer()
        descriptor = _pointer()
        error = _advapi32.GetNamedSecurityInfoW(
            str(path),
            _SE_FILE_OBJECT,
            _OWNER_SECURITY_INFORMATION | _DACL_SECURITY_INFORMATION,
            ctypes.byref(owner),
            None,
            ctypes.byref(acl),
            None,
            ctypes.byref(descriptor),
        )
        if error != 0:
            raise _fail("access rights cannot be read")
        try:
            user = _current_user_sid()
            owner_text = _sid_text(owner.value)
            if owner_text not in {user, _SID_ADMINISTRATORS}:
                raise _fail("the owner is neither the current user nor the administrators")
            if not acl.value:
                raise _fail("the access list is missing, everyone has access")
            allowed = {owner_text, user, _SID_SYSTEM, _SID_ADMINISTRATORS}
            information = _AclSizeInformation()
            if not _advapi32.GetAclInformation(
                acl, ctypes.byref(information), ctypes.sizeof(information), _ACL_SIZE_INFORMATION
            ):
                raise _fail("access rights cannot be read: access list")
            for index in range(information.AceCount):
                entry = _pointer()
                if not _advapi32.GetAce(acl, index, ctypes.byref(entry)):
                    raise _fail("access rights cannot be read: entry")
                header = _AceHeader.from_address(entry.value or 0)
                if header.AceType in _DENY_ACE_TYPES:
                    continue
                if header.AceType != _ACCESS_ALLOWED_ACE_TYPE:
                    raise _fail("the access list has an entry of an unknown kind")
                # ACCESS_ALLOWED_ACE: header (4 bytes), access mask (4 bytes), then the SID.
                if _sid_text((entry.value or 0) + 8) not in allowed:
                    raise _fail("the access list allows access to others")
        finally:
            _kernel32.LocalFree(descriptor)
