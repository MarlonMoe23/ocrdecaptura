import { useEffect, useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textAreaRef = useRef(null);

  useEffect(() => {
    const handlePaste = async (event) => {
      const items = event.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const src = URL.createObjectURL(blob);
          setImageSrc(src);
          setOcrText('');
          runOCR(src);
        }
      }
    };

    const runOCR = async (image) => {
      setIsProcessing(true);
      try {
        const result = await Tesseract.recognize(image, 'eng', {
          logger: (m) => console.log(m),
        });
        setOcrText(result.data.text);
      } catch (error) {
        setOcrText('Error al procesar imagen');
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const copyToClipboard = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      alert('Texto copiado al portapapeles 👍');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">OCR App – Pega tu captura (Ctrl+V)</h1>

      <div className="border-dashed border-4 border-gray-400 p-8 rounded-lg bg-white text-center">
        <p className="text-gray-600 mb-2">Pega una imagen con <strong>Ctrl + V</strong></p>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Pasted"
            className="mx-auto max-h-[400px] mt-4 rounded shadow"
          />
        ) : (
          <p className="italic text-gray-400">No hay imagen aún</p>
        )}
      </div>

      {isProcessing && (
        <p className="text-blue-600 mt-4 font-medium">Procesando texto con OCR...</p>
      )}

      {ocrText && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Texto reconocido:</h2>
          <textarea
            ref={textAreaRef}
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            className="w-full h-48 p-4 border border-gray-700 rounded shadow bg-white text-black"
          />
          <button
            onClick={copyToClipboard}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            type="button"
          >
            Copiar texto
          </button>
        </div>
      )}
    </div>
  );
}
