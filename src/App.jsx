import React, { useState, useEffect } from 'react';

// Webhook oficial de Produção
const WEBHOOK_URL = "https://webhook.lynkapay.com.br/webhook/receber-laudo";

export default function App() {
  const [locationText, setLocationText] = useState("Obtendo GPS...");
  const [gpsCoords, setGpsCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nivelOleo: 'No Nível',
    nivelAgua: 'No Nível',
    obsAgua: '',
    usoEstepe: 'Não',
  });

  const [photos, setPhotos] = useState({});
  const [video360, setVideo360] = useState(null);

  // Mapeamento dos itens de vistoria
  const photoFields = [
    { key: 'frente', label: 'Frente do Veículo' },
    { key: 'traseira', label: 'Traseira do Veículo' },
    { key: 'lateralEsquerda', label: 'Lateral Esquerda' },
    { key: 'pneu', label: 'Pneus e Rodas' },
    { key: 'estepe', label: 'Estepe' },
    { key: 'internaDianteira', label: 'Interna Dianteira' },
    { key: 'internaTraseira', label: 'Interna Traseira' },
    { key: 'painelLigado', label: 'Painel Ligado (Hodômetro)' },
    { key: 'motorGeral', label: 'Motor Geral' },
    { key: 'nivelOleo', label: 'Foto Nível do Óleo' },
    { key: 'reservatorioAgua', label: 'Reservatório de Água' },
    { key: 'selfie', label: 'Selfie com o Veículo' },
  ];

  // Captura localização GPS ao carregar
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          setGpsCoords(coords);
          setLocationText(`GPS: ${coords}`);
        },
        () => setLocationText("GPS: Não autorizado/Indisponível"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationText("GPS: Não suportado no dispositivo");
    }
  }, []);

  // Função para carimbar foto com Data, Hora e GPS (Watermark)
  const processImageWithWatermark = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Desenha imagem original
          ctx.drawImage(img, 0, 0);

          // Configurações da tarja e texto
          const bannerHeight = Math.max(50, img.height * 0.08);
          const fontSize = Math.max(16, Math.floor(bannerHeight * 0.35));

          // Tarja preta semitransparente no rodapé
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

          // Texto do carimbo
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold ${fontSize}px sans-serif`;

          const now = new Date().toLocaleString("pt-BR");
          const line1 = `VISTORIA ORIONSAT - ${now}`;
          const line2 = gpsCoords ? `LOCAL: GPS (${gpsCoords})` : `LOCAL: ${locationText}`;

          ctx.fillText(line1, 20, img.height - bannerHeight + fontSize + 5);
          ctx.fillText(line2, 20, img.height - (bannerHeight / 2) + (fontSize / 2));

          // Retorna a foto carimbada em JPEG
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
      };
    });
  };

  // Handler para captura de foto
  const handlePhotoChange = async (key, file) => {
    if (!file) return;
    const watermarkedImage = await processImageWithWatermark(file);
    setPhotos((prev) => ({ ...prev, [key]: watermarkedImage }));
  };

  // Handler para captura de vídeo
  const handleVideoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setVideo360(reader.result);
    };
  };

  // Envio final dos dados
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      gps: gpsCoords || locationText,
      dataHoraEnvio: new Date().toLocaleString("pt-BR"),
      fotos: photos,
      video360: video360,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("✅ Vistoria enviada com sucesso!");
      } else {
        alert("⚠️ Erro ao enviar para o servidor. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-2">Checklist Vistoria</h1>
        <p className="text-xs text-center text-gray-500 mb-6">{locationText}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção Mecânica */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Item Mecânico</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Nível de Óleo</label>
                <select 
                  value={formData.nivelOleo} 
                  onChange={(e) => setFormData({...formData, nivelOleo: e.target.value})}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="No Nível">No Nível</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Nível de Água</label>
                <select 
                  value={formData.nivelAgua} 
                  onChange={(e) => setFormData({...formData, nivelAgua: e.target.value})}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="No Nível">No Nível</option>
                  <option value="Completado">Completado</option>
                  <option value="Vazamento">Vazamento Identificado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Observação da Água</label>
                <input 
                  type="text" 
                  value={formData.obsAgua}
                  onChange={(e) => setFormData({...formData, obsAgua: e.target.value})}
                  placeholder="Ex: Foi adicionado 500ml"
                  className="w-full border p-2 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Captura de Fotos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Fotos Obrigatórias (Câmera)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photoFields.map((field) => (
                <div key={field.key} className="border p-3 rounded-lg text-center">
                  <label className="block text-xs font-bold mb-2">{field.label}</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={(e) => handlePhotoChange(field.key, e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {photos[field.key] && (
                    <img src={photos[field.key]} alt="Preview" className="mt-2 h-24 mx-auto rounded border" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campo de Vídeo 360° */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Vídeo 360° do Veículo</h2>
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <label className="block text-xs font-bold mb-2">Grave um vídeo contornando o veículo</label>
              <input 
                type="file" 
                accept="video/*" 
                capture="environment"
                onChange={(e) => handleVideoChange(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {video360 && <p className="text-xs text-green-600 font-bold mt-2">✓ Vídeo anexado com sucesso!</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            {loading ? "Processando e Enviando..." : "Enviar Vistoria"}
          </button>
        </form>
      </div>
    </div>
  );
}