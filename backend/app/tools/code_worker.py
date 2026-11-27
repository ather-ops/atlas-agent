"""Isolated subprocess interpreter: numeric assignments and print only."""

import ast
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from arithmetic import numeric


def run(source):
    tree = ast.parse(source)
    if len(list(ast.walk(tree))) > 180:
        raise ValueError()
    names, output = {}, []
    for stmt in tree.body:
        if (
            isinstance(stmt, ast.Assign)
            and len(stmt.targets) == 1
            and isinstance(stmt.targets[0], ast.Name)
        ):
            names[stmt.targets[0].id] = numeric(stmt.value, names)
        elif (
            isinstance(stmt, ast.Expr)
            and isinstance(stmt.value, ast.Call)
            and isinstance(stmt.value.func, ast.Name)
            and stmt.value.func.id == "print"
            and len(stmt.value.args) == 1
            and not stmt.value.keywords
        ):
            arg = stmt.value.args[0]
            output.append(
                str(
                    arg.value
                    if isinstance(arg, ast.Constant) and isinstance(arg.value, str)
                    else numeric(arg, names)
                )
            )
        else:
            raise ValueError()
    return "\n".join(output) or "Completed without output."


if __name__ == "__main__":
    try:
        if sys.platform != "win32":
            import resource

            resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
            resource.setrlimit(resource.RLIMIT_AS, (96 * 1024**2, 96 * 1024**2))
        print(run(sys.stdin.read(2001))[:4000])
    except (ValueError, SyntaxError, ArithmeticError, RecursionError, MemoryError):
        sys.exit(2)
