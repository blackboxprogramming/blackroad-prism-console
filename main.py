import streamlit as st
import openai
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import io
import os
import base64
import tempfile
import whisper

openai.api_key = os.getenv("OPENAI_API_KEY")

st.set_page_config(layout="wide")
st.title("BlackRoad Prism Generator with GPT + Voice Console")

if 'chat_history' not in st.session_state:
    st.session_state.chat_history = [
        {"role": "system", "content": "You are the BlackRoad Venture Console AI, a holographic assistant that replies with scientific and symbolic insights."}
    ]

st.markdown("""
#### Speak or type an idea, formula, or question. The AI will respond and project a hologram:
""")

# Audio input
audio_file = st.file_uploader("Upload your voice (mp3 or wav)", type=["mp3", "wav"])
if audio_file is not None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(audio_file.read())
        temp_audio_path = temp_audio.name
    model = whisper.load_model("base")
    result = model.transcribe(temp_audio_path)
    user_input = result["text"]
    st.markdown(f"**You said:** {user_input}")
else:
    user_input = st.text_input("Or type here")

if user_input:
    try:
        st.session_state.chat_history.append({"role": "user", "content": user_input})

        # GPT response with full history
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=st.session_state.chat_history
        )
        assistant_reply = response["choices"][0]["message"]["content"]
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_reply})

        st.markdown(f"**Venture Console AI:** {assistant_reply}")

        try:
            result = eval(user_input.split(',')[0])
        except:
            result = 1

        fig = plt.figure(figsize=(6, 4))
        ax = fig.add_subplot(111, projection='3d')
        X = np.linspace(-5, 5, 100)
        Y = np.linspace(-5, 5, 100)
        X, Y = np.meshgrid(X, Y)
        Z = np.sin(np.sqrt(X**2 + Y**2)) * result

        ax.plot_surface(X, Y, Z, cmap='plasma')
        ax.axis('off')

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        st.image(buf)

    except Exception as e:
        st.error(f"Error: {e}")

st.markdown("---")
st.markdown("**BlackRoad Prism Console** | Live UI Simulation")
st.image("72BF9767-A2EE-4CB6-93F4-4D738108BC4B.png", caption="Live Console Interface")