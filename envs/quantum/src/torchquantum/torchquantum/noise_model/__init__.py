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

if os.getenv("TORCHQUANTUM_USE_QISKIT", "0") == "1":
    from .noise_models import *  # type: ignore
else:
    class _BaseNoiseModel:
        """Fallback noise model that performs no-op adjustments."""

        is_add_noise = False

        def __init__(self, *args, **kwargs):
            pass

        def add_noise(self, params):
            return params

        def sample_noise_op(self, op):
            return []


    class NoiseModelTQ(_BaseNoiseModel):
        pass


    class NoiseModelTQActivation(_BaseNoiseModel):
        pass


    class NoiseModelTQPhase(_BaseNoiseModel):
        pass


    class NoiseModelTQReadoutOnly(_BaseNoiseModel):
        pass


    class NoiseModelTQActivationReadout(_BaseNoiseModel):
        pass


    class NoiseModelTQPhaseReadout(_BaseNoiseModel):
        pass


    class NoiseModelTQQErrorOnly(_BaseNoiseModel):
        pass


    __all__ = [
        "NoiseModelTQ",
        "NoiseModelTQActivation",
        "NoiseModelTQPhase",
        "NoiseModelTQReadoutOnly",
        "NoiseModelTQActivationReadout",
        "NoiseModelTQPhaseReadout",
        "NoiseModelTQQErrorOnly",
    ]
