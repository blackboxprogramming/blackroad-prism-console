import { get, set } from 'idb-keyval';

export interface Manifest {
  name: string;
  version: string;
  capabilities: string[];
}

interface Agent {
  name: string;
  manifest: Manifest;
  instance: WebAssembly.Instance;
  memory: WebAssembly.Memory;
  inbox: string[];
  outbox: string[];
  log: string;
}

export class PrismKernel {
  private fs: Record<string, string> = {};
  private agents: Map<string, Agent> = new Map();

  async init() {
    const stored = await get<Record<string, string>>('fs');
    if (stored) {
      this.fs = stored;
      // respawn agents from manifest entries
      for (const path of Object.keys(this.fs)) {
        if (path.startsWith('/prism/agents/') && this.fs[path]) {
          const manifest = JSON.parse(this.fs[path]) as Manifest;
          await this.spawn(manifest.name);
        }
      }
    } else {
      // initialize base directories
      this.fs['/prism/agents/'] = '';
      this.fs['/prism/logs/'] = '';
      this.fs['/prism/contradictions/'] = '';
      
      // Add main.py to the virtual filesystem
      this.fs['main.py'] = `"""Streamlit app for the BlackRoad Prism Generator with GPT and voice input."""

import io
import os
import tempfile

import matplotlib.pyplot as plt
import numpy as np
import streamlit as st
import whisper
from openai import OpenAI
from streamlit.runtime.uploaded_file_manager import UploadedFile

from prism_utils import parse_numeric_prefix

st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

# Configure OpenAI client
_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=_api_key) if _api_key else None
if client is None:
    st.warning("OpenAI API key not set. Set OPENAI_API_KEY to enable responses.")


@st.cache_resource
def get_whisper_model():
    """Load and cache the Whisper model."""
    return whisper.load_model("base")


def transcribe_audio(uploaded_file: UploadedFile) -> str:
    """Transcribe an uploaded audio file using Whisper."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(uploaded_file.read())
        tmp_path = tmp.name
    try:
        model = get_whisper_model()
        result = model.transcribe(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
    return result["text"]


# Initialize chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {
            "role": "system",
            "content": (
                "You are the BlackRoad Venture Console AI, a holographic assistant that replies "
                "with scientific and symbolic insights."
            ),
        }
    ]

st.markdown(
    "#### Speak or type an idea, formula, or question. The AI will respond and project a hologram:"
)

audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
if audio_file is not None:
    user_input = transcribe_audio(audio_file)
    st.markdown(f"**You said:** {user_input}")
else:
    user_input = st.text_input("Or type here")

if user_input:
    if not client:
        st.error("OpenAI API key not set.")
    else:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=st.session_state.chat_history,
        )
        assistant_reply = response.choices[0].message.content
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_reply})
        st.markdown(f"**Venture Console AI:** {assistant_reply}")

        magnitude = parse_numeric_prefix(user_input)
        fig = plt.figure(figsize=(6, 4))
        ax = fig.add_subplot(111, projection="3d")
        x = np.linspace(-5, 5, 100)
        y = np.linspace(-5, 5, 100)
        x, y = np.meshgrid(x, y)
        z = np.sin(np.sqrt(x**2 + y**2)) * magnitude
        ax.plot_surface(x, y, z, cmap="plasma")
        ax.axis("off")

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        st.image(buf)
        plt.close(fig)

st.markdown("---")
st.markdown("**BlackRoad Prism Console** | Live UI Simulation")
st.image("72BF9767-A2EE-4CB6-93F4-4D738108BC4B.png", caption="Live Console Interface")
`;
      
      await this.persist();
    }
  }

  listAgents() {
    return Array.from(this.agents.keys());
  }

  async spawn(name: string) {
    if (this.agents.has(name)) return;
    const manifest: Manifest = { name, version: '0.1', capabilities: ['ipc'] };
    // For now only built-in echo agent
    const wasm = await WebAssembly.instantiate(await this.getEchoWasm());
    const memory = (wasm.instance.exports.memory as WebAssembly.Memory);
    const agent: Agent = {
      name,
      manifest,
      instance: wasm.instance,
      memory,
      inbox: [],
      outbox: [],
      log: ''
    };
    this.agents.set(name, agent);
    this.fs[`/prism/agents/${name}`] = JSON.stringify(manifest);
    this.fs[`/prism/logs/${name}`] = '';
    await this.persist();
  }

  send(name: string, msg: string) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error('agent not found');
    agent.inbox.push(msg);
    this.process(agent);
  }

  recv(name: string): string | null {
    const agent = this.agents.get(name);
    if (!agent) throw new Error('agent not found');
    return agent.outbox.shift() ?? null;
  }

  ls(path: string): string[] {
    const normalized = path.endsWith('/') ? path : path + '/';
    const entries = new Set<string>();
    for (const p of Object.keys(this.fs)) {
      if (p.startsWith(normalized)) {
        const rest = p.slice(normalized.length);
        if (rest === '') continue;
        const next = rest.split('/')[0];
        entries.add(next + (rest.includes('/') ? '/' : ''));
      }
    }
    return Array.from(entries).sort();
  }

  cat(path: string): string | null {
    return this.fs[path] ?? null;
  }

  private async process(agent: Agent) {
    while (agent.inbox.length) {
      const msg = agent.inbox.shift()!;
      const encoder = new TextEncoder();
      const view = new Uint8Array(agent.memory.buffer);
      const data = encoder.encode(msg);
      view.set(data, 0);
      const handle = agent.instance.exports.handle as Function;
      const ptr = handle(0, data.length) as number;
      const out = new TextDecoder().decode(view.slice(ptr, ptr + data.length));
      agent.outbox.push(out);
      agent.log += out + '\n';
      this.fs[`/prism/logs/${agent.name}`] = agent.log;
      await this.persist();
    }
  }

  private async persist() {
    await set('fs', this.fs);
  }

  private async getEchoWasm(): Promise<ArrayBuffer> {
    const base64 = ECHO_WASM_BASE64;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Minimal echo wasm compiled from WAT
const ECHO_WASM_BASE64 =
  'AGFzbQEAAAABBwFgAn9/AX8DAgEABQMBAAEHEwIGbWVtb3J5AgAGaGFuZGxlAAAKBgEEACAACw==' ;
