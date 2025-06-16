import { useEffect, useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState(''); // 'copying', 'success', 'error'
  const [buttonPressed, setButtonPressed] = useState(false);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageBlob(file);
    }
  };

  const copyToClipboard = async () => {
    if (!ocrText.trim()) return;
    
    // Efecto visual de presionar el botón
    setButtonPressed(true);
    setCopyStatus('copying');
    
    setTimeout(() => setButtonPressed(false), 150);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(ocrText);
        setCopyStatus('success');
      } else {
        // Fallback para navegadores más antiguos
        if (textAreaRef.current) {
          textAreaRef.current.select();
          const successful = document.execCommand('copy');
          setCopyStatus(successful ? 'success' : 'error');
        }
      }
    } catch (error) {
      // Segundo intento con el método antiguo
      try {
        if (textAreaRef.current) {
          textAreaRef.current.select();
          const successful = document.execCommand('copy');
          setCopyStatus(successful ? 'success' : 'error');
        }
      } catch (fallbackError) {
        setCopyStatus('error');
      }
    }

    // Limpiar el estado después de 2 segundos
    setTimeout(() => {
      setCopyStatus('');
    }, 2000);
  };

  const getCopyButtonContent = () => {
    switch (copyStatus) {
      case 'copying':
        return '⏳ Copiando...';
      case 'success':
        return '✅ ¡Copiado!';
      case 'error':
        return '❌ Error al copiar';
      default:
        return '📋 Copiar texto al portapapeles';
    }
  };

  const getCopyButtonClass = () => {
    const baseClass = `mt-4 w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform ${
      buttonPressed ? 'scale-95' : 'scale-100'
    }`;
    
    switch (copyStatus) {
      case 'copying':
        return `${baseClass} bg-yellow-500 text-white cursor-wait`;
      case 'success':
        return `${baseClass} bg-green-600 text-white`;
      case 'error':
        return `${baseClass} bg-red-600 text-white`;
      default:
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
          🧠 OCR del portapapeles App 
        </h1>
        <p className="text-gray-600 text-base md:text-lg mb-4">
            Pega una imagen con <span className="font-bold">Ctrl + V</span> o usa el botón:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-700 active:scale-95 transition-all duration-200 text-sm md:text-base transform"
            >
              📁 Seleccionar archivo
            </button>
          </div>
        <div className="border-4 border-dashed border-gray-300 rounded-xl p-4 md:p-6 bg-gray-50 text-center">
          

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
          <div className="text-center mt-4">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-600 font-medium">
                Procesando imagen con OCR...
              </p>
            </div>
          </div>
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
              placeholder="El texto extraído aparecerá aquí..."
            />
            <button
              onClick={copyToClipboard}
              disabled={!ocrText.trim() || copyStatus === 'copying'}
              className={getCopyButtonClass()}
            >
              {getCopyButtonContent()}
            </button>
            
            {copyStatus === 'success' && (
              <p className="text-center text-green-600 text-sm mt-2 animate-fade-in">
                El texto se ha copiado exitosamente al portapapeles
              </p>
            )}
            
            {copyStatus === 'error' && (
              <p className="text-center text-red-600 text-sm mt-2 animate-fade-in">
                No se pudo copiar. Intenta seleccionar el texto manualmente
              </p>
            )}
          </div>
        )}
      </div>
      
      <p className="text-center text-gray-500 mt-6 text-xs md:text-sm">
        Desarrollado por Marlon Ortiz usando Next.js + Tesseract.js
      </p>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}