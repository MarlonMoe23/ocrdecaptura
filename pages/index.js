import { useEffect, useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [canPasteFromClipboard, setCanPasteFromClipboard] = useState(false);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Verificar si el navegador soporta la API del portapapeles
    if (navigator.clipboard && navigator.clipboard.read) {
      setCanPasteFromClipboard(true);
    }

    const handlePaste = async (event) => {
      const items = event.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          processImageBlob(blob);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImageBlob = (blob) => {
    const src = URL.createObjectURL(blob);
    setImageSrc(src);
    setOcrText('');
    runOCR(src);
  };

  const runOCR = async (image) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(image, 'eng+spa', {
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

  const pasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            processImageBlob(blob);
            return;
          }
        }
      }
      alert('No se encontró ninguna imagen en el portapapeles');
    } catch (error) {
      console.error('Error al acceder al portapapeles:', error);
      alert('No se pudo acceder al portapapeles. Intenta usar Ctrl+V o seleccionar un archivo.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageBlob(file);
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(ocrText);
      } else {
        // Fallback para navegadores más antiguos
        if (textAreaRef.current) {
          textAreaRef.current.select();
          document.execCommand('copy');
        }
      }
    } catch (error) {
      // Fallback si falla la API moderna
      if (textAreaRef.current) {
        textAreaRef.current.select();
        document.execCommand('copy');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
          🧠 OCR del portapapeles App 
        </h1>
        
        <div className="border-4 border-dashed border-gray-300 rounded-xl p-4 md:p-6 bg-gray-50 text-center">
          <p className="text-gray-600 text-base md:text-lg mb-4">
            Pega una imagen con <span className="font-bold">Ctrl + V</span> o usa los botones
          </p>
          
          {/* Botones para móviles */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {canPasteFromClipboard && (
              <button
                onClick={pasteFromClipboard}
                className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-green-700 transition duration-200 text-sm md:text-base"
              >
                📋 Pegar del portapapeles
              </button>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-orange-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-orange-700 transition duration-200 text-sm md:text-base"
            >
              📁 Seleccionar archivo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Pasted"
              className="mx-auto mt-4 max-h-[300px] rounded-xl shadow max-w-full"
            />
          ) : (
            <p className="italic text-gray-400 mt-4">No hay imagen aún</p>
          )}
        </div>

        {isProcessing && (
          <p className="text-blue-600 mt-4 font-medium text-center">
            Procesando imagen con OCR...
          </p>
        )}

        {ocrText && (
          <div className="mt-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
              Texto reconocido:
            </h2>
            <textarea
              ref={textAreaRef}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full h-48 p-4 border border-gray-300 rounded-xl bg-white text-black shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <button
              onClick={copyToClipboard}
              className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200"
            >
              📋 Copiar texto al portapapeles
            </button>
          </div>
        )}
      </div>
      
      <p className="text-center text-gray-500 mt-6 text-xs md:text-sm">
        Desarrollado por Marlon Ortiz usando Next.js + Tesseract.js
      </p>
    </div>
  );
}