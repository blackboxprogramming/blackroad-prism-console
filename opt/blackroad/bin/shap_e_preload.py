import os, torch
from shap_e.models.download import load_model, load_config
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config

os.environ.setdefault("SHAP_E_CACHE", "/var/blackroad/shap-e/cache")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

print("Preloading Shap-E weights to cache:", os.environ["SHAP_E_CACHE"])
_ = load_model('transmitter', device=device)
_ = load_model('text300M', device=device)
_ = load_model('image300M', device=device)
_ = diffusion_from_config(load_config('diffusion'))
print("Done.")
