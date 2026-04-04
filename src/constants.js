export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  python: "3.10.0",
  html: "5",
  css: "3",
};

export const CODE_SNIPPETS = {
  javascript: `function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("Alex");`,

  python: `def greet(name):
    print("Hello, " + name + "!")

greet("Alex")`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello World</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0f0a19, #1a0f2e);
      color: #00ffcc;
    }
    h1 { text-shadow: 0 0 12px #00ffcc; }
  </style>
</head>
<body>
  <h1>⚡ Hello from HTML!</h1>
</body>
</html>`,

  css: `/* CSS is previewed inside a simple HTML wrapper */
body {
  font-family: system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #0f0a19, #1a0f2e);
  color: #00ffcc;
}

h1 {
  text-shadow: 0 0 12px #00ffcc;
  font-size: 2rem;
}`,
};