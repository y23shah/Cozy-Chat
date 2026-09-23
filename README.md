# Cozy Chat Web — Asher Montclair

A free, browser-only character chat. No OpenAI API, no Gemini API, no Ollama, no payment system.

## How it works
- The UI is a static website.
- Transformers.js loads a quantized Qwen instruct model into the browser.
- Inference runs locally through WebGPU.
- The first model download comes from Hugging Face and is cached by the browser.
- Chat history is stored locally in the browser's localStorage.

## Recommended first run
Use the **Fast** model first: Qwen2.5-0.5B-Instruct, q4f16 (~483 MB model file). The larger **Better** model is Qwen2.5-1.5B-Instruct, q4f16 (~1.22 GB).

## Important
Host this folder over HTTPS, such as GitHub Pages. Do not rely on opening `index.html` directly from a ZIP. Current Chrome on Apple Silicon is the preferred browser setup.

This is an original character implementation inspired by the user's requested personality traits. It does not copy Whispy proprietary code, assets, exact messages, or character text.
