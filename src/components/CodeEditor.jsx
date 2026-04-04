import { useRef, useState, useEffect } from "react";
import { Box, HStack, Button, Input, VStack, Text } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";

const CodeEditor = () => {
  const editorRef = useRef();
  const outputRef = useRef();
  const intervalRef = useRef(null);
  const replayIndexRef = useRef(0);
  const replayCodeRef = useRef("");

  const [language, setLanguage] = useState("javascript");
  const [value, setValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [savedFiles, setSavedFiles] = useState([]);
  const [speed, setSpeed] = useState(1);

  // Load saved files from localStorage
  useEffect(() => {
    const files = JSON.parse(localStorage.getItem("saved-files")) || [];
    setSavedFiles(files);
  }, []);

  // Load code on language change
  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${language}`);
    setValue(savedCode || CODE_SNIPPETS[language]);
  }, [language]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // Ctrl + Enter keyboard shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        if (!editorRef.current || !outputRef.current) return;
        outputRef.current.runCode();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    // Ctrl + Enter in editor
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        outputRef.current?.runCode();
      }
    );
  };

  const onSelect = (lang) => setLanguage(lang);

  const handleChange = (val) => {
    setValue(val);
    localStorage.setItem(`code-${language}`, val);
  };

  // Save file
  const saveFile = () => {
    if (!fileName.trim()) return;

    const newFile = { name: fileName, language, code: value };
    const updated = [...savedFiles, newFile];
    localStorage.setItem("saved-files", JSON.stringify(updated));
    setSavedFiles(updated);
    setFileName("");
  };

  // Load file
  const loadFile = (file) => {
    setLanguage(file.language);
    setValue(file.code);
  };

  // Delete file
  const deleteFile = (index) => {
    const updated = savedFiles.filter((_, i) => i !== index);
    localStorage.setItem("saved-files", JSON.stringify(updated));
    setSavedFiles(updated);
  };

  // Replay System
  const startReplay = () => {
    const code = editorRef.current.getValue();
    replayCodeRef.current = code;
    replayIndexRef.current = 0;
    clearInterval(intervalRef.current);
    editorRef.current.setValue("");

    const intervalTime = 50 / speed;

    intervalRef.current = setInterval(() => {
      const nextChar = replayCodeRef.current[replayIndexRef.current];

      if (nextChar !== undefined) {
        editorRef.current.executeEdits("", [
          {
            range: editorRef.current.getModel().getFullModelRange(),
            text: editorRef.current.getValue() + nextChar,
          },
        ]);
        replayIndexRef.current++;
      }

      if (replayIndexRef.current >= replayCodeRef.current.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, intervalTime);
  };

  const pauseReplay = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resumeReplay = () => {
    if (intervalRef.current) return;

    const intervalTime = 50 / speed;

    intervalRef.current = setInterval(() => {
      const nextChar = replayCodeRef.current[replayIndexRef.current];

      if (nextChar !== undefined) {
        editorRef.current.executeEdits("", [
          {
            range: editorRef.current.getModel().getFullModelRange(),
            text: editorRef.current.getValue() + nextChar,
          },
        ]);
        replayIndexRef.current++;
      }

      if (replayIndexRef.current >= replayCodeRef.current.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, intervalTime);
  };

  // Upload file
  const uploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const name = file.name.toLowerCase();

      if (name.endsWith(".py")) setLanguage("python");
      else if (name.endsWith(".js")) setLanguage("javascript");
      else if (name.endsWith(".html") || name.endsWith(".htm")) setLanguage("html");
      else if (name.endsWith(".css")) setLanguage("css");

      setValue(content);
      setFileName(file.name);
      localStorage.setItem(`code-${language}`, content);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  // Export file
  const exportFile = () => {
    const code = editorRef.current.getValue();
    const data = {
      language,
      code,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <HStack spacing={4} h="100%" align="stretch">
      {/* LEFT */}
      <Box
        flex="2"
        display="flex"
        flexDirection="column"
        border="1px solid #00ffcc"
        borderRadius="6px"
        boxShadow="0 0 10px #00ffcc"
        p={2}
      >
        <LanguageSelector language={language} onSelect={onSelect} />

        {/* TOOLBAR */}
        <HStack
          mb={3}
          spacing={3}
          p={2}
          border="1px solid #00ffcc"
          borderRadius="8px"
          boxShadow="0 0 15px #00ffcc"
          bg="rgba(0,0,0,0.3)"
        >
          <Button size="sm" colorScheme="teal" onClick={exportFile}>
            ⬇ Export
          </Button>
          <Button size="sm" colorScheme="yellow" onClick={startReplay}>
            🔁 Replay
          </Button>
          <Button size="sm" colorScheme="orange" onClick={pauseReplay}>
            ⏸ Pause
          </Button>
          <Button size="sm" colorScheme="green" onClick={resumeReplay}>
            ▶ Resume
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
          >
            ⚡ {speed}x
          </Button>
          <Button
            size="sm"
            bg="#00ffcc"
            color="black"
            onClick={() => outputRef.current?.runCode()}
          >
            ▶ Run
          </Button>
        </HStack>

        {/* SAVE + UPLOAD */}
        <HStack mb={2}>
          <Input
            placeholder="Enter file name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            size="sm"
          />
          <Button size="sm" colorScheme="green" onClick={saveFile}>
            Save
          </Button>
          <Button
            size="sm"
            bg="#00ffcc"
            color="black"
            onClick={() => document.getElementById("fileInput").click()}
          >
            {fileName ? `🔄 ${fileName}` : "📂 Upload"}
          </Button>
          <input
            id="fileInput"
            type="file"
            accept=".js,.py,.html,.htm,.css,.txt"
            style={{ display: "none" }}
            onChange={uploadFile}
          />
        </HStack>

        {/* EDITOR */}
        <Box flex="1">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={value}
            onMount={onMount}
            onChange={handleChange}
            options={{ minimap: { enabled: false } }}
          />
        </Box>
      </Box>

      {/* RIGHT */}
      <Box flex="1" display="flex" flexDirection="column" gap={4}>
        {/* SAVED FILES */}
        <Box
          p={3}
          border="1px solid #00ffcc"
          borderRadius="6px"
          boxShadow="0 0 10px #00ffcc"
          maxH="250px"
          overflowY="auto"
        >
          <Text mb={2} fontWeight="bold" color="#00ffcc">
            📂 Saved Files
          </Text>
          <VStack align="stretch" spacing={1}>
            {savedFiles.length === 0 && <Text>No files saved</Text>}
            {savedFiles.map((file, index) => (
              <HStack key={index} justify="space-between">
                <Text cursor="pointer" onClick={() => loadFile(file)}>
                  {file.name} ({file.language})
                </Text>
                <Button
                  size="xs"
                  colorScheme="red"
                  onClick={() => deleteFile(index)}
                >
                  X
                </Button>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* OUTPUT */}
        <Output ref={outputRef} editorRef={editorRef} language={language} />
      </Box>
    </HStack>
  );
};

export default CodeEditor;