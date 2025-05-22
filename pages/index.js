import { useEffect, useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('eng'); // idioma por defecto: inglés
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

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [language]);

  const runOCR = async (image) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(image, language, {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setImageSrc(src);
      setOcrText('');
      runOCR(src);
    }
  };

  const copyToClipboard = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      alert('Texto copiado al portapapeles 👍');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          🧠 OCR desde imagen (pega o sube)
        </h1>

        {/* Selector de idioma */}
        <div className="mb-4 text-center">
          <label className="font-medium text-gray-700 mr-2">Idioma del texto:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="eng">Inglés</option>
            <option value="spa">Español</option>
            <option value="eng+spa">Inglés + Español</option>
            <option value="fra">Francés</option>
            <option value="deu">Alemán</option>
            <option value="por">Portugués</option>
          </select>
        </div>

        {/* Entrada de imagen para móviles */}
        <div className="text-center mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block mx-auto text-gray-700"
          />
        </div>

        {/* Zona de pegado y preview de imagen */}
        <div className="border-4 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 text-center">
          <p className="text-gray-600 text-lg">
            Pega una imagen con <span className="font-bold">Ctrl + V</span> o súbela arriba
          </p>

          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Imagen pegada o subida"
              className="mx-auto mt-4 max-h-[300px] rounded-xl shadow"
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
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Texto reconocido:</h2>
            <textarea
              ref={textAreaRef}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full h-48 p-4 border border-gray-300 rounded-xl bg-white text-black shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <p className="text-center text-gray-500 mt-6 text-sm">
        Desarrollado por Marlon Ortiz usando Next.js + Tesseract.js
      </p>
    </div>
  );
}
