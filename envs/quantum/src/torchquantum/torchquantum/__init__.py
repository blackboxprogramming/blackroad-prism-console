"""
MIT License

Copyright (c) 2020-present TorchQuantum Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

import os

__version__ = "0.2.0"
__author__ = "TorchQuantum Authors"

_USE_QISKIT = os.getenv("TORCHQUANTUM_USE_QISKIT", "0") == "1"

from .macro import *
from .device import *
from .module import *
from .operator import *
from .measurement import *
from .functional import *
from .graph import *
from .layer import *
from .util import *
from .algorithm import *
from .dataset import *

if _USE_QISKIT:
    from .encoding import *
    from .noise_model import *
    from .pulse import *

    # here we check whether the Qiskit parameterization bug is fixed, if not, a
    # warning message will be printed
    import qiskit

    path = os.path.abspath(qiskit.__file__)
    # path for aer provider
    path_provider = path.replace("__init__.py", "providers/aer/backends/aerbackend.py")

    # with open(path_provider, 'r') as fid:
    #     for line in fid.readlines():
    #         if 'FIXED' in line:
    #             break
    #         else:
    #             print(f'\n\n WARNING: The qiskit parameterization bug is not '
    #                   f'fixed!\n\n'
    #                   f'run python fix_qiskit_parameterization.py to fix it!'
    #                   )
    #             break
