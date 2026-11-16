// Installs whisper.cpp and the English base model into ./whisper.cpp (only needed once).
import path from "node:path";
import { downloadWhisperModel, installWhisperCpp } from "@remotion/install-whisper-cpp";

const to = path.resolve("whisper.cpp");
await installWhisperCpp({ to, version: "1.5.5" });
await downloadWhisperModel({ model: "base.en", folder: to });
console.log("Whisper ready in", to);
