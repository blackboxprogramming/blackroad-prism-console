"""Streamlit app for BlackRoad Prism Generator with GPT and voice input."""

import os
import tempfile

import streamlit as st
import whisper
from openai import OpenAI

st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=_api_key) if _api_key else None
if not _api_key:
    st.warning("OpenAI API key not set; responses will be unavailable.")


@st.cache_resource
def load_whisper_model():
    """Load the Whisper model once and reuse across reruns."""
    return whisper.load_model("base")

def _transcribe_audio(uploaded_file) -> str:
    """Transcribe an uploaded audio file using Whisper and clean up temp file."""
    suffix = os.path.splitext(uploaded_file.name)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        temp_audio.write(uploaded_file.read())
        temp_path = temp_audio.name
    model = load_whisper_model()
    result = model.transcribe(temp_path)
    os.remove(temp_path)
    return result["text"]


st.markdown(
    "#### Speak or type an idea, formula, or question. The AI will respond and project a hologram:"
)

audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
if audio_file is not None:
    user_input = _transcribe_audio(audio_file)
    st.markdown(f"**You said:** {user_input}")
else:
    user_input = st.text_input("Or type here")

if user_input:
    if not client:
        st.error("OpenAI API key not set.")
    else:
        st.session_state.setdefault(
            "chat_history",
            [
                {
                    "role": "system",
                    "content": (
                        "You are the BlackRoad Venture Console AI, a holographic assistant "
                        "that replies with scientific and symbolic insights."
                    ),
                }
            ],
        )
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        placeholder = st.empty()
        placeholder.write("Processing request...")
        response = client.chat.completions.create(
            model="gpt-4o-mini", messages=st.session_state.chat_history
        )
        reply = response.choices[0].message["content"]
        st.session_state.chat_history.append({"role": "assistant", "content": reply})
        placeholder.markdown(f"**AI:** {reply}")
