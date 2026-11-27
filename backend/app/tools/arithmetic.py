"""A small numeric language. Never evaluates Python bytecode."""

import ast
import math
import operator

OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}


def numeric(node, names=None, depth=0):
    if depth > 16:
        raise ValueError("Expression is too deeply nested.")
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        value = node.value
    elif isinstance(node, ast.Name) and names and node.id in names:
        value = names[node.id]
    elif isinstance(node, ast.UnaryOp) and type(node.op) in (ast.UAdd, ast.USub):
        value = numeric(node.operand, names, depth + 1) * (
            -1 if isinstance(node.op, ast.USub) else 1
        )
    elif isinstance(node, ast.BinOp) and type(node.op) in OPS:
        a, b = numeric(node.left, names, depth + 1), numeric(node.right, names, depth + 1)
        if isinstance(node.op, ast.Pow) and (abs(b) > 12 or (a < 0 and not float(b).is_integer())):
            raise ValueError("Power exceeds the allowed range.")
        value = OPS[type(node.op)](a, b)
    else:
        raise ValueError("Only numbers and arithmetic operators are allowed.")
    if abs(value) > 1e15 or not math.isfinite(value):
        raise ValueError("Result exceeds the numeric limit.")
    return value


def calculate(expression):
    tree = ast.parse(expression, mode="eval")
    if sum(1 for _ in ast.walk(tree)) > 70:
        raise ValueError("Expression is too long.")
    return numeric(tree.body)
