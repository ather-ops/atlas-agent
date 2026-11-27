import os
import re
import stat
from pathlib import Path


class WorkspaceFiles:
    def __init__(self, root: Path):
        self.root = root

    def target(self, name):
        if (
            not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 _.-]{0,74}\.(txt|md|csv)", name)
            or ".." in name
            or name.split(".")[0].rstrip(" .").upper()
            in {
                "CON",
                "PRN",
                "AUX",
                "NUL",
                *[f"{p}{n}" for p in ("LPT", "COM") for n in range(10)],
            }
        ):
            raise ValueError("Use a simple .txt, .md or .csv filename.")
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        return self.root / name

    def read(self, name):
        path = self.target(name)
        if path.is_symlink() or not path.is_file():
            raise ValueError("File not found in this workspace.")
        fd = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
        with os.fdopen(fd, "rb") as f:
            if not stat.S_ISREG(os.fstat(f.fileno()).st_mode):
                raise ValueError("Not a regular file.")
            b = f.read(32001)
        if len(b) > 32000:
            raise ValueError("File is too large.")
        return b.decode("utf-8")

    def create(self, name, text):
        path = self.target(name)
        b = text.encode("utf-8")
        if len(b) > 32000 or len(list(self.root.iterdir())) >= 32:
            raise ValueError("Workspace file limit reached.")
        try:
            fd = os.open(
                path, os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600
            )
        except FileExistsError:
            raise ValueError(
                "A file with this name already exists. Choose another name."
            ) from None
        with os.fdopen(fd, "wb") as f:
            f.write(b)
        return f"Created {name} in your private workspace."
