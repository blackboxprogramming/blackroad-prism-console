"""Model primitives used by the Alice & Lucidia agents."""
from .encoders import EncoderConfig, GeneratorConfig, TextEncoder, TextGenerator
from .hopfield import HopfieldConfig, ModernHopfieldHead
from .natural_grad import NaturalGradientConfig, NaturalGradientOptimizer
from .ot import BridgeConfig, schrodinger_bridge, sinkhorn_transport
from .world_model import LatentWorldModel, WorldModelConfig

__all__ = [
    "EncoderConfig",
    "TextEncoder",
    "GeneratorConfig",
    "TextGenerator",
    "HopfieldConfig",
    "ModernHopfieldHead",
    "NaturalGradientConfig",
    "NaturalGradientOptimizer",
    "BridgeConfig",
    "schrodinger_bridge",
    "sinkhorn_transport",
    "WorldModelConfig",
    "LatentWorldModel",
]
