import { useRef } from "react"
import Editor from "@monaco-editor/react"

const LANGUAGE_MAP = {
  python: "python",
  java: "java",
  cpp: "cpp",
}

export default function CodeEditor({ value, onChange, language = "python", readOnly = false }) {
  const monacoRef = useRef(null)

  function handleMount(editor) {
    monacoRef.current = editor
  }

  function handleChange(newValue) {
    if (onChange) onChange(newValue)
  }

  const monacoLanguage = LANGUAGE_MAP[language] || "python"

  return (
    <div className="w-full h-full">
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguage}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-code)",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          tabSize: 2,
          automaticLayout: true,
          readOnly: readOnly,
          bracketPairColorization: { enabled: true },
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  )
}
