"""Local model runtime adapters for BlackRoad agents."""


def load_model(model_path: str):
    """Load a local AI model for inference."""
    raise NotImplementedError("Model loading not yet implemented")


def infer(prompt: str):
    """Run inference against the loaded model."""
    raise NotImplementedError("Inference not yet implemented")
