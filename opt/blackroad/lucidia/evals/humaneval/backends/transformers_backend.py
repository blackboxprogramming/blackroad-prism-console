from typing import List, Optional
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

class TransformersBackend:
    def __init__(self, model_name_or_path: str, device: str="auto",
                 max_tokens: int=256, temperature: float=0.2, top_p: float=0.95,
                 stop: Optional[List[str]]=None):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name_or_path, local_files_only=True)
        self.model = AutoModelForCausalLM.from_pretrained(model_name_or_path, local_files_only=True)
        self.pipe = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer, device_map=device)
        self.stop = stop or []
        self.def_max_tokens = max_tokens
        self.def_temp = temperature
        self.def_top_p = top_p

    def _apply_stops(self, text: str) -> str:
        for s in self.stop:
            idx = text.find(s)
            if idx != -1:
                text = text[:idx]
        return text

    def generate(self, prompt: str, max_tokens: int, temperature: float, top_p: float, stop, timeout_s: int) -> str:
        gen = self.pipe(prompt, do_sample=(temperature>0), temperature=temperature, top_p=top_p,
                        max_new_tokens=max_tokens, num_return_sequences=1)[0]["generated_text"]
        # strip the prompt prefix
        if gen.startswith(prompt):
            gen = gen[len(prompt):]
        return self._apply_stops(gen)
