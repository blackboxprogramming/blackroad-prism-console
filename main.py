"""Streamlit app for BlackRoad Prism Generator with GPT and voice input."""

import io
import os
import tempfile

import matplotlib.pyplot as plt
import numpy as np
import streamlit as st
import whisper
from openai import OpenAI

# Configure OpenAI client
_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    st.warning("OPENAI_API_KEY not set; responses will be unavailable.")
    client = None
else:
    client = OpenAI(api_key=_api_key)

st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

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
    """#### Speak or type an idea, formula, or question. The AI will respond and project a hologram:"""
)


def _transcribe_audio(uploaded_file: st.runtime.uploaded_file_manager.UploadedFile) -> str:
    """Transcribe an uploaded audio file using Whisper and clean up the temp file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(uploaded_file.read())
        temp_audio_path = temp_audio.name
    model = whisper.load_model("base")
    result = model.transcribe(temp_audio_path)
    os.remove(temp_audio_path)
    return result["text"]


audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
if audio_file is not None:
    user_input = _transcribe_audio(audio_file)
    st.markdown(f"**You said:** {user_input}")
else:
    user_input = st.text_input("Or type here")

if user_input:
    try:
        st.session_state.chat_history.append({"role": "user", "content": user_input})

        if client:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=st.session_state.chat_history,
            )
            assistant_reply = response.choices[0].message.content
        else:
            assistant_reply = "OpenAI API key not provided."

        st.session_state.chat_history.append({"role": "assistant", "content": assistant_reply})
        st.markdown(f"**Venture Console AI:** {assistant_reply}")

        try:
            result = float(user_input.split(",")[0])
        except ValueError:
            result = 1.0

        fig = plt.figure(figsize=(6, 4))
        ax = fig.add_subplot(111, projection="3d")
        X = np.linspace(-5, 5, 100)
        Y = np.linspace(-5, 5, 100)
        X, Y = np.meshgrid(X, Y)
        Z = np.sin(np.sqrt(X**2 + Y**2)) * result

        ax.plot_surface(X, Y, Z, cmap="plasma")
        ax.axis("off")

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        st.image(buf)
        plt.close(fig)

    except Exception as e:  # pragma: no cover - Streamlit handles runtime errors
        st.error(f"Error: {e}")

st.markdown("---")
st.markdown("**BlackRoad Prism Console** | Live UI Simulation")
st.image(
    "72BF9767-A2EE-4CB6-93F4-4D738108BC4B.png",
    caption="Live Console Interface",
)
