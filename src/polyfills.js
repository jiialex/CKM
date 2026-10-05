import { Buffer } from "buffer";

// must be global-safe for browser libs
window.global = window;
window.Buffer = Buffer;