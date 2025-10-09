"""Streamlit app for the BlackRoad Prism Generator with GPT and voice input."""

import io
import os
import tempfile
from datetime import datetime

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

# Initialize terminal output log
if "terminal_log" not in st.session_state:
    st.session_state.terminal_log = []
    st.session_state.terminal_log.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] System initialized"
    )
    st.session_state.terminal_log.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] BlackRoad Prism Console ready"
    )


def log_to_terminal(message: str) -> None:
    """Add a timestamped message to the terminal log."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state.terminal_log.append(f"[{timestamp}] {message}")
    # Keep only the last 50 messages
    if len(st.session_state.terminal_log) > 50:
        st.session_state.terminal_log = st.session_state.terminal_log[-50:]

st.markdown(
    "#### Speak or type an idea, formula, or question. The AI will respond and project a hologram:"
)

# Terminal Output Section
st.markdown("---")
st.markdown("### 💻 Terminal Output")
terminal_container = st.container()
with terminal_container:
    terminal_text = "\n".join(st.session_state.terminal_log)
    st.code(terminal_text, language="bash")

st.markdown("---")

audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
if audio_file is not None:
    log_to_terminal(f"Audio file uploaded: {audio_file.name}")
    user_input = transcribe_audio(audio_file)
    log_to_terminal(f"Transcription complete: {len(user_input)} characters")
    st.markdown(f"**You said:** {user_input}")
else:
    user_input = st.text_input("Or type here")

if user_input:
    if not client:
        st.error("OpenAI API key not set.")
        log_to_terminal("ERROR: OpenAI API key not configured")
    else:
        log_to_terminal(f"User input: {user_input[:50]}...")
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        log_to_terminal("Sending request to GPT-4o-mini...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=st.session_state.chat_history,
        )
        assistant_reply = response.choices[0].message.content
        log_to_terminal(f"Received response: {len(assistant_reply)} characters")
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_reply})
        st.markdown(f"**Venture Console AI:** {assistant_reply}")

        magnitude = parse_numeric_prefix(user_input)
        log_to_terminal(f"Generating hologram with magnitude: {magnitude}")
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
        log_to_terminal("Hologram projection complete")

st.markdown("---")
st.markdown("**BlackRoad Prism Console** | Live UI Simulation")
st.image("72BF9767-A2EE-4CB6-93F4-4D738108BC4B.png", caption="Live Console Interface")
