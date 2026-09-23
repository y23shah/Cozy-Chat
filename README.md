# Cozy Chat Web v4

A browser-local fictional character chat. No OpenAI API, no Gemini API, no Ollama, and no payment system.

## Recommended setup
- Chrome on Apple Silicon
- GitHub Pages / HTTPS
- **Better replies (Qwen2.5-1.5B-Instruct)** is the default because the 0.5B model is extremely small and can produce repetitive roleplay text.
- The model is downloaded once and cached by the browser; generation runs locally in the browser.

If you already have the site on GitHub Pages, replace the existing files with the files in this folder. Your model cache may remain, but v4 defaults to the larger model for better conversation quality.


### v5 compatibility note
This version uses the q4 WebGPU quantization for Qwen2.5 instead of q4f16. Some browser/GPU combinations fail during q4f16 initialization because that path depends on WebGPU shader-f16 support.
