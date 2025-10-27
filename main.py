"""Streamlit app for BlackRoad Prism Generator with GPT and voice input."""

import os
import tempfile

import streamlit as st
import whisper
from openai import OpenAI

st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

_api_key = os.getenv("OPENAI_API_KEY")
_base_url = os.getenv("OPENAI_BASE_URL")
_org_id = os.getenv("OPENAI_ORG_ID")

client = None
if _api_key:
    _client_kwargs = {"api_key": _api_key}
    if _base_url:
        _client_kwargs["base_url"] = _base_url
    if _org_id:
        _client_kwargs["organization"] = _org_id
    client = OpenAI(**_client_kwargs)
else:
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
        chat_history = st.session_state.setdefault(
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
        messages = chat_history + [{"role": "user", "content": user_input}]
        try:
            with st.spinner("Processing request..."):
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                )
        except Exception as exc:
            st.error(f"Failed to fetch assistant response: {exc}")
        else:
            reply = response.choices[0].message.content
            chat_history.extend(
                [
                    {"role": "user", "content": user_input},
                    {"role": "assistant", "content": reply},
                ]
            )
            st.markdown(f"**Assistant:** {reply}")
