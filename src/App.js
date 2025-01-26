import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js"; // Updated path
import "./App.css";

// Set up the PDF.js worker globally
GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const extractText = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      if (file.type === "application/pdf") {
        const pdf = await getDocument(URL.createObjectURL(file)).promise;
        let pdfText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          pdfText += pageText + "\n";
        }

        setText(pdfText);
        speakText(pdfText);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = async () => {
          const { data } = await Tesseract.recognize(reader.result, "eng", {
            logger: (info) => console.log(info),
          });
          const extractedText = data.text || "";
          setText(extractedText);
          speakText(extractedText);
        };

        reader.readAsDataURL(file);
      } else if (file.type === "text/plain") {
        const reader = new FileReader();

        reader.onload = () => {
          setText(reader.result);
          speakText(reader.result);
        };

        reader.readAsText(file);
      } else {
        setText("Unsupported file type.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setText("Error processing file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (textToSpeak) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    window.speechSynthesis.speak(utterance);
  };

  const handleTextSelection = () => {
    const selectedText = window.getSelection().toString();
    setHighlightedText(selectedText);
  };

  const handleReadSelectedText = () => {
    if (highlightedText) {
      speakText(highlightedText);
    } else {
      alert("Please select some text first!");
    }
  };

  return (
    <div className="App flex flex-col items-center gap-4 p-4">
      <header className="App-header">
        <h1>File Text Reader</h1>
        <input
          type="file"
          accept="image/*,application/pdf,text/plain"
          onChange={handleFileUpload}
        />
        <button onClick={extractText} disabled={!file || isProcessing}>
          {isProcessing ? "Processing..." : "Extract Text"}
        </button>

        {text && (
          <div className="w-full max-w-lg mt-4">
            <h2>Extracted Text:</h2>
            <p
              className="whitespace-pre-line mt-2"
              onMouseUp={handleTextSelection} // Trigger text selection handling
              style={{ cursor: "pointer" }}
            >
              {text}
            </p>
          </div>
        )}

        {highlightedText && (
          <button onClick={handleReadSelectedText} className="mt-4">
            Read Selected Text
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
