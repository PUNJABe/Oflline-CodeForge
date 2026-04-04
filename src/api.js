/**
 * Returns the HTML source ready to be injected into an iframe srcDoc.
 * If the code already contains a full HTML document it is used as-is;
 * otherwise it is wrapped in a minimal document.
 */
export const runHtml = (code) => {
  if (/<!doctype\s+html/i.test(code)) {
    return code;
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body>${code}</body></html>`;
};

/**
 * Wraps raw CSS in a minimal HTML document so it can be previewed in an iframe.
 */
export const runCss = (code) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>${code}</style>
</head>
<body>
  <h1>CSS Preview</h1>
  <p>Your styles are applied to this page.</p>
  <ul>
    <li>List item one</li>
    <li>List item two</li>
    <li>List item three</li>
  </ul>
  <button>Sample Button</button>
</body>
</html>`;
};

export const runJavaScript = (code, inputs = []) => {
  const output = [];
  let inputIndex = 0;
  const originalLog = console.log;

  try {
    console.log = (...args) => {
      output.push(args.join(" "));
    };

    const prompt = () => {
      const value = inputs[inputIndex];
      inputIndex += 1;
      return value ?? "";
    };

    new Function("console", "prompt", code)({ log: console.log }, prompt);
    return output.join("\n") || "> (no output)";
  } catch (error) {
    return "❌ Error: " + error.message;
  } finally {
    console.log = originalLog;
  }
};

let pyodide = null;

export const loadPyodideInstance = async () => {
  if (pyodide) return pyodide;

  if (!window.loadPyodide) {
    throw new Error("Pyodide loader missing. Ensure /pyodide/pyodide.js is available.");
  }

  pyodide = await window.loadPyodide({
    indexURL: "/pyodide/",
  });

  return pyodide;
};

export const runPython = async (code, input = []) => {
  try {
    const py = await loadPyodideInstance();
    const inputValues = Array.isArray(input) ? input : [];

    py.globals.set("__js_input_values", inputValues);

    py.runPython(`
import sys
from io import StringIO

sys.stdout = StringIO()
sys.stderr = StringIO()

input_data = [str(v) for v in __js_input_values]
input_index = 0

def input(prompt=""):
    global input_index
    if input_index < len(input_data):
        value = input_data[input_index]
        input_index += 1
        return value
    return ""
`);

    try {
      py.runPython(code);
    } catch (err) {
      const cleanError = err.message.split("\n").slice(-1)[0];
      return "❌ Error: " + cleanError;
    } finally {
      py.globals.delete("__js_input_values");
    }

    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");
    const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
    return combined || "> (no output)";
  } catch (error) {
    return "❌ Error: " + error.message;
  }
};