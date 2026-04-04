import {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { Box, Text } from "@chakra-ui/react";
import { runJavaScript, runPython, runHtml, runCss } from "../api";

const Output = forwardRef(({ editorRef, language }, ref) => {
  const [terminal, setTerminal] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [inputs, setInputs] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [expectedInputs, setExpectedInputs] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);

  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Reset output when language changes
  useEffect(() => {
    setTerminal([]);
    setPreviewSrc(null);
    setWaitingForInput(false);
    setInputs([]);
    setCurrentInput("");
  }, [language]);

  // auto scroll
  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [terminal]);

  // force focus
  useEffect(() => {
    if (waitingForInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [waitingForInput]);

  const appendLine = (line) => {
    setTerminal((prev) => [...prev, line]);
  };

  const extractPrompts = (code) => {
    const regex =
      language === "javascript"
        ? /prompt\(["'`](.*?)["'`]\)/g
        : /input\(["'`](.*?)["'`]\)/g;

    let matches = [];
    let match;

    while ((match = regex.exec(code)) !== null) {
      matches.push(match[1] || "Input:");
    }

    return matches;
  };

  const executeCode = async (userInputs) => {
    const code = editorRef.current.getValue();

    try {
      let result =
        language === "javascript"
          ? runJavaScript(code, userInputs)
          : await runPython(code, userInputs);

      appendLine("");
      appendLine(result || "> (no output)");
    } catch (err) {
      appendLine("❌ Error: " + err.message);
    }

    setIsRunning(false);
  };

  useImperativeHandle(ref, () => ({
    runCode: async () => {
      if (isRunning) return;

      const code = editorRef.current.getValue();

      // HTML / CSS → render in iframe, no terminal
      if (language === "html") {
        setPreviewSrc(runHtml(code));
        setTerminal([]);
        return;
      }
      if (language === "css") {
        setPreviewSrc(runCss(code));
        setTerminal([]);
        return;
      }

      // JS / Python → terminal output
      setPreviewSrc(null);
      setTerminal([]);
      setInputs([]);
      setCurrentInput("");

      const prompts = extractPrompts(code);
      setExpectedInputs(prompts.length);

      if (prompts.length > 0) {
        setWaitingForInput(true);

        appendLine("> Provide input:");

        return;
      }

      setIsRunning(true);
      await executeCode([]);
    },
  }));

  const handleInputSubmit = async () => {
    if (!waitingForInput || isRunning) return;

    if (currentInput === "/clear") {
      setTerminal([]);  
      setCurrentInput("");
      return;
    }

    appendLine("> " + currentInput);
    const newInputs = [...inputs, currentInput];
    setInputs(newInputs);
    setCurrentInput("");
    // 🔥 detect loop case
    const n = parseInt(newInputs[0]);

    // if only 1 prompt → simple case
    if (expectedInputs === 1) {
      setWaitingForInput(false);
      setIsRunning(true);
      await executeCode(newInputs);
      setInputs([]);
      return;
    }

    // 🔥 loop case (n + inputs)
    if (!isNaN(n) && newInputs.length === n + 1) {
      setWaitingForInput(false);
      setIsRunning(true);

      await executeCode(newInputs);

      setInputs([]);
    }
  };
    
     

  return (
    <Box flex="1" display="flex" flexDirection="column" p={3}>
      <Box display="flex" justifyContent="space-between">
        <Text color="#00ffcc">
          {previewSrc ? "🖼 Preview" : "🖥 Terminal"}
        </Text>
        <Text
          color="red"
          cursor="pointer"
          onClick={() => {
            setTerminal([]);
            setPreviewSrc(null);
          }}
        >
          Clear
        </Text>
      </Box>

      {previewSrc ? (
        <Box
          flex="1"
          border="1px solid #00ffcc"
          borderRadius="6px"
          overflow="hidden"
          bg="white"
        >
          <iframe
            srcDoc={previewSrc}
            title="html-css-preview"
            style={{ width: "100%", height: "100%", border: "none" }}
            sandbox="allow-scripts allow-popups allow-forms"
          />
        </Box>
      ) : (
        <Box
          ref={terminalRef}
          flex="1"
          bg="black"
          color="#00ffcc"
          p={2}
          fontFamily="monospace"
          overflowY="auto"
        >
          {terminal.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}

          {waitingForInput && (
            <Box display="flex">
              <Text>{"> "}</Text>
              <input
                ref={inputRef}
                autoFocus
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInputSubmit();
                }}
                style={{
                  background: "black",
                  color: "#00ffcc",
                  border: "none",
                  outline: "none",
                  flex: 1,
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

export default Output;