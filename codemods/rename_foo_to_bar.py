import libcst as cst
from libcst import Module
from typing import Any


class RenameFooToBar(cst.CSTTransformer):
    def leave_Name(self, original_node: cst.Name, updated_node: cst.Name) -> cst.CSTNode:
        if original_node.value == "foo":
            return updated_node.with_changes(value="bar")
        return updated_node

def codemod(module: Module, **kwargs: Any) -> Module:
    return module.visit(RenameFooToBar())
