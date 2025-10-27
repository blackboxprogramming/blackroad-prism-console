<<<<<<< main
"""Streamlit app for the BlackRoad Prism Generator with GPT and voice input."""
=======
"""Streamlit app for BlackRoad Prism Generator with GPT and voice input."""
>>>>>>> origin/codex/fix-comments-54tl1o

import os
import tempfile
from typing import Optional

<<<<<<< main
import matplotlib.pyplot as plt
import numpy as np
=======
>>>>>>> origin/codex/fix-comments-54tl1o
import streamlit as st
import whisper
from openai import OpenAI
from streamlit.runtime.uploaded_file_manager import UploadedFile

<<<<<<< main
from prism_utils import parse_numeric_prefix

# Configure the Streamlit layout early to avoid repeated warnings.
st.set_page_config(layout="wide")
st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

# Only create an OpenAI client when OPENAI_API_KEY is provided
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key) if openai_api_key else None
if client is None:
    st.warning("OpenAI API key not set. Set OPENAI_API_KEY to enable responses.")


@st.cache_resource
def load_whisper_model():
    """Load the Whisper model once and reuse it across reruns."""

    return whisper.load_model("base")


def get_openai_client() -> Optional[OpenAI]:
    """Return an OpenAI client when an API key is available."""
=======
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
>>>>>>> origin/codex/fix-comments-54tl1o

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

<<<<<<< main

def transcribe_audio(uploaded_file: UploadedFile) -> str:
    """Transcribe an uploaded audio file using Whisper."""

    suffix = os.path.splitext(uploaded_file.name)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.read())
        temp_path = tmp.name

    try:
        model = load_whisper_model()
        result = model.transcribe(temp_path)
        return result.get("text", "").strip()
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


def render_hologram(scale: float) -> None:
    """Render a simple hologram-inspired surface plot scaled by ``scale``."""

    x = np.linspace(-5, 5, 100)
    y = np.linspace(-5, 5, 100)
    x_grid, y_grid = np.meshgrid(x, y)
    z_grid = np.sin(np.sqrt(x_grid**2 + y_grid**2)) * scale

    fig = plt.figure(figsize=(6, 4))
    ax = fig.add_subplot(111, projection="3d")
    ax.plot_surface(x_grid, y_grid, z_grid, cmap="plasma")
    ax.axis("off")

    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    st.image(buffer)
    plt.close(fig)


def main() -> None:
    """Run the Streamlit interface."""

    st.title("BlackRoad Prism Generator with GPT + Voice Console")

    client = get_openai_client()
    if client is None:
        st.warning("OpenAI API key not set. Set OPENAI_API_KEY to enable responses.")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {
                "role": "system",
                "content": (
                    "You are the BlackRoad Venture Console AI, a holographic assistant "
                    "that replies with scientific and symbolic insights."
                ),
            }
        ]

    st.markdown(
        "#### Speak or type an idea, formula, or question. The AI will respond and "
        "project a hologram:"
    )

    user_input = ""
    audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
    if audio_file is not None:
        user_input = transcribe_audio(audio_file)
        if user_input:
            st.markdown(f"**You said:** {user_input}")

    typed_input = st.text_input("Or type here")
    if not user_input:
        user_input = typed_input.strip()

    if user_input:
        if client is None:
            st.error("OpenAI API key not configured.")
        else:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            try:
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=st.session_state.chat_history,
                )
            except Exception as exc:  # pragma: no cover - streamlit runtime feedback
                st.error(f"Failed to generate response: {exc}")
            else:
                choices = getattr(completion, "choices", None) or []
                if not choices:
                    st.error("OpenAI did not return any completion choices.")
                else:
                    assistant_reply = choices[0].message.content.strip()
                    st.session_state.chat_history.append(
                        {"role": "assistant", "content": assistant_reply}
                    )
                    st.markdown(f"**Venture Console AI:** {assistant_reply}")
                    render_hologram(parse_numeric_prefix(user_input))

    st.markdown("---")
    st.markdown("**BlackRoad Prism Console** | Live UI Simulation")
    st.image(
        "72BF9767-A2EE-4CB6-93F4-4D738108BC4B.png",
        caption="Live Console Interface",
    )


if __name__ == "__main__":
    main()
=======
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
>>>>>>> origin/codex/fix-comments-54tl1o
