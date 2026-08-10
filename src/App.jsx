import React, { useState, useEffect } from 'react';

// Webhook oficial de Produção
const WEBHOOK_URL = "https://webhook.lynkapay.com.br/webhook/receber-laudo";

export default function App() {
  const [locationText, setLocationText] = useState("Obtendo GPS...");
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nivelOleo: 'No Nível',
    nivelAgua: 'No Nível',
    obsAgua: '',
    usoEstepe: 'Não',
  });

  const [photos, setPhotos] = useState({});
  const [video360, setVideo360] = useState(null);

  // Mapeamento dos 12 itens visuais da vistoria
  const photoFields = [
    { key: 'frente', label: 'Frente do Veículo', icon: '🚘' },
    { key: 'traseira', label: 'Traseira do Veículo', icon: '🚗' },
    { key: 'lateralEsquerda', label: 'Lateral Esquerda', icon: '🚙' },
    { key: 'pneu', label: 'Pneus e Rodas', icon: '🛞' },
    { key: 'estepe', label: 'Estepe', icon: '🛞' },
    { key: 'internaDianteira', label: 'Interna Dianteira', icon: '🪑' },
    { key: 'internaTraseira', label: 'Interna Traseira', icon: '🪑' },
    { key: 'painelLigado', label: 'Painel (Hodômetro)', icon: '⏱️' },
    { key: 'motorGeral', label: 'Motor Geral', icon: '⚙️' },
    { key: 'nivelOleo', label: 'Nível do Óleo', icon: '🛢️' },
    { key: 'reservatorioAgua', label: 'Reservatório de Água', icon: '💧' },
    { key: 'selfie', label: 'Selfie com o Veículo', icon: '🤳' },
  ];

  // Captura localização GPS em tempo real ao abrir o app
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          setGpsCoords(coords);
          setLocationText(`GPS Ativo: ${coords}`);
          setGpsActive(true);
        },
        () => {
          setLocationText("GPS: Não autorizado");
          setGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationText("GPS: Indisponível");
    }
  }, []);

  // Processa a foto e aplica o Carimbo de Data, Hora e GPS via Canvas
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

          // Configurações da tarja e texto do carimbo
          const bannerHeight = Math.max(60, img.height * 0.08);
          const fontSize = Math.max(18, Math.floor(bannerHeight * 0.35));

          // Tarja preta semitransparente no rodapé
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

          // Texto do carimbo
          ctx.fillStyle = "#38BDF8"; // Azul celeste
          ctx.font = `bold ${fontSize}px sans-serif`;

          const now = new Date().toLocaleString("pt-BR");
          const line1 = `ORIONSAT VISTORIA | ${now}`;
          const line2 = gpsCoords ? `LAT/LONG: ${gpsCoords}` : `LOCAL: ${locationText}`;

          ctx.fillText(line1, 24, img.height - bannerHeight + fontSize + 6);
          
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(line2, 24, img.height - (bannerHeight / 2) + (fontSize / 2));

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

  const totalPhotos = photoFields.length;
  const completedPhotos = Object.keys(photos).length;
  const progressPercentage = Math.round((completedPhotos / totalPhotos) * 100);

  // Envio dos dados para o n8n
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (completedPhotos < totalPhotos) {
      if (!confirm(`Você capturou ${completedPhotos} de ${totalPhotos} fotos. Deseja enviar mesmo assim?`)) {
        return;
      }
    }

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
        alert("✅ Vistoria registrada e enviada com sucesso!");
      } else {
        alert("⚠️ Ocorreu um erro no servidor ao receber os dados.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-12 font-sans text-slate-100">
      {/* Header Estilizado */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 px-4 py-4 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">OrionSat</span> Vistoria
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Checklist Digital de Veículo</p>
          </div>
          
          {/* Badge de GPS */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            gpsActive ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-amber-950/80 border-amber-500 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {gpsActive ? 'GPS Ativo' : 'Buscando GPS'}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Barra de Progresso Visível */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-slate-300">Progresso da Vistoria</span>
            <span className="text-blue-400 font-bold">{completedPhotos} de {totalPhotos} Fotos ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Condições Mecânicas */}
          <section className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">⚙️</span>
              Condições Mecânicas e Níveis
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nível do Óleo
                </label>
                <select 
                  value={formData.nivelOleo} 
                  onChange={(e) => setFormData({...formData, nivelOleo: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="No Nível">🟢 No Nível</option>
                  <option value="Baixo">🟡 Baixo</option>
                  <option value="Crítico">🔴 Crítico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nível de Água / Radiador
                </label>
                <select 
                  value={formData.nivelAgua} 
                  onChange={(e) => setFormData({...formData, nivelAgua: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="No Nível">🟢 No Nível</option>
                  <option value="Completado">🟡 Completado</option>
                  <option value="Vazamento">🔴 Vazamento Identificado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Observações da Água (Opcional)
                </label>
                <input 
                  type="text" 
                  value={formData.obsAgua}
                  onChange={(e) => setFormData({...formData, obsAgua: e.target.value})}
                  placeholder="Ex: Foi adicionado 500ml de aditivo"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Uso do Estepe
                </label>
                <select 
                  value={formData.usoEstepe} 
                  onChange={(e) => setFormData({...formData, usoEstepe: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Não">🟢 Não Utilizado</option>
                  <option value="Sim">🔴 Estepe em Uso no Veículo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Grid de Cards de Fotos */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">📸</span>
              Registro Fotográfico Obrigatório
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photoFields.map((field) => {
                const isDone = !!photos[field.key];
                return (
                  <div 
                    key={field.key} 
                    className={`relative p-4 rounded-xl border transition-all ${
                      isDone 
                        ? 'bg-slate-800/90 border-emerald-500/60' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{field.icon}</span> {field.label}
                      </span>
                      {isDone ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/30">
                          ✓ Ok
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>

                    {/* Preview da foto se já capturada */}
                    {isDone ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                        <img src={photos[field.key]} alt={field.label} className="w-full h-36 object-cover" />
                        <label className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 cursor-pointer shadow-md font-semibold">
                          📷 Refazer
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={(e) => handlePhotoChange(field.key, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      /* Botão de acionamento da Câmera */
                      <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition text-center p-2 group">
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📷</span>
                        <span className="text-xs font-bold text-blue-400">Abrir Câmera</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Captura em tempo real</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={(e) => handlePhotoChange(field.key, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Card: Vídeo 360° */}
          <section className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">🎥</span>
              Vídeo 360° do Veículo
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Grave um vídeo contornando toda a lataria do veículo em um único take.
            </p>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
              {video360 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                    <span>✓</span> Vídeo gravado e anexado com sucesso!
                  </div>
                  <label className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg border border-slate-600 cursor-pointer font-semibold">
                    🎥 Gravar Novamente
                    <input 
                      type="file" 
                      accept="video/*" 
                      capture="environment"
                      onChange={(e) => handleVideoChange(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-6 cursor-pointer group">
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📹</span>
                  <span className="text-sm font-bold text-blue-400">Gravar Vídeo 360°</span>
                  <span className="text-xs text-slate-500 mt-1">Aciona a câmera de vídeo do aparelho</span>
                  <input 
                    type="file" 
                    accept="video/*" 
                    capture="environment"
                    onChange={(e) => handleVideoChange(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </section>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Enviando Vistoria...
                </>
              ) : (
                <>
                  <span>🚀</span> Concluir e Enviar Laudo
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}