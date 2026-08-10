import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO DAS FOTOS E EXEMPLOS ---
const photoCategories = [
  {
    title: 'Geral',
    items: [
      { id: 'foto_selfie', label: 'Selfie com o Veículo', instruction: 'Tire uma selfie onde seu rosto e a placa do carro apareçam.', exampleImg: '/selfie.png' }
    ]
  },
  {
    title: 'Veículo Externo',
    items: [
      { id: 'foto_frente', label: 'Frente do Veículo', instruction: 'Pegue o para-choque e a placa.', exampleImg: '/frente.png' },
      { id: 'foto_traseira', label: 'Traseira do Veículo', instruction: 'Pegue o para-choque traseiro e a placa.', exampleImg: '/traseira.png' },
      { id: 'foto_lat_esq', label: 'Lateral Esquerda', instruction: 'Vidros FECHADOS. Pegue o carro de ponta a ponta.', exampleImg: '/lateral esquerda.png' },
      { id: 'foto_lat_dir', label: 'Lateral Direita', instruction: 'Vidros FECHADOS. Pegue o carro de ponta a ponta.', exampleImg: '/lateral esquerda.png' } 
    ]
  },
  {
    title: 'Veículo Interno',
    items: [
      { id: 'foto_painel', label: 'Painel Ligado', instruction: 'Gire a chave. Mostre a quilometragem e luzes acesas.', exampleImg: '/painel ligado.png' },
      { id: 'foto_int_frente', label: 'Interior (Frente)', instruction: 'Mostre o estado dos bancos dianteiros e painel.', exampleImg: '/interna dianteira.png' },
      { id: 'foto_int_tras', label: 'Interior (Traseira)', instruction: 'Mostre o estado dos bancos traseiros.', exampleImg: '/interna traseira.png' }
    ]
  },
  {
    title: 'Mecânica (Cofre do Motor)',
    items: [
      { id: 'foto_motor', label: 'Motor Completo', instruction: 'Abra o capô e tire uma foto geral do motor.', exampleImg: '/motor geral.png' },
      { id: 'foto_oleo', label: 'Vareta de Óleo', instruction: 'Puxe a vareta, limpe, coloque e puxe de novo. Fotografe a marcação.', exampleImg: '/nivel oleo.png' },
      { id: 'foto_agua', label: 'Reservatório de Água', instruction: 'Fotografe mostrando a marcação de MIN e MAX.', exampleImg: '/reservatorio agua.png' }
    ]
  },
  {
    title: 'Pneus e Estepe',
    items: [
      { id: 'foto_pneu_de', label: 'Dianteiro Esquerdo', instruction: 'Mostre o desgaste da borracha (sulcos).', exampleImg: '/pneu.png' },
      { id: 'foto_pneu_dd', label: 'Dianteiro Direito', instruction: 'Mostre o desgaste da borracha (sulcos).', exampleImg: '/pneu.png' },
      { id: 'foto_pneu_te', label: 'Traseiro Esquerdo', instruction: 'Mostre o desgaste da borracha (sulcos).', exampleImg: '/pneu.png' },
      { id: 'foto_pneu_td', label: 'Traseiro Direito', instruction: 'Mostre o desgaste da borracha (sulcos).', exampleImg: '/pneu.png' },
      { id: 'foto_estepe_pneu', label: 'Foto do Estepe', instruction: 'Fotografe o estepe dentro do porta-malas mostrando o estado.', exampleImg: '/estepe.png' }
    ]
  }
];

const lightsChecklist = [
  { id: 'luz_farol_baixo', label: 'Farol Baixo' },
  { id: 'luz_farol_alto', label: 'Farol Alto' },
  { id: 'luz_lanterna_diant', label: 'Lanterna Dianteira' },
  { id: 'luz_milha', label: 'Farol de Milha (Se houver)' },
  { id: 'luz_lanterna_tras', label: 'Lanternas Traseiras' },
  { id: 'luz_setas', label: 'Setas (Piscas)' },
  { id: 'luz_freio', label: 'Luz de Freio' },
  { id: 'luz_re', label: 'Luz de Ré' }
];

export default function ChecklistApp() {
  const [step, setStep] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Segurança e Dispositivo
  const [deviceOS, setDeviceOS] = useState('Desconhecido');
  const [isMobileDevice, setIsMobileDevice] = useState(true);

  // Estados dos Dados Documentais
  const [docInfo, setDocInfo] = useState({ 
    empresa_nome: 'Carregando Empresa...', 
    empresa_cnpj: '',
    empresa_tel: '',
    empresa_email: '',
    motorista_nome: '', 
    motorista_tel: '',
    veiculo_placa: '',
    veiculo_modelo: '',
    data_atual: ''
  });

  const [files, setFiles] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [video360, setVideo360] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [levels, setLevels] = useState({ oleo: '', agua: '', agua_obs: '' });
  const [estepe, setEstepe] = useState({ usado: '', motivo: '', pneu_avaria: '' });
  const [lights, setLights] = useState({});
  const [obsLuzes, setObsLuzes] = useState('');
  const [obsGerais, setObsGerais] = useState('');

  // Estados de GPS
  const [locationText, setLocationText] = useState("Obtendo GPS...");
  const [gpsCoords, setGpsCoords] = useState(null);

  useEffect(() => {
    // 1. VERIFICAÇÃO DE SISTEMA OPERACIONAL (ANTIFRAUDE PC)
    const ua = navigator.userAgent;
    let os = "Desconhecido";
    if (/android/i.test(ua)) os = "Android";
    else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) os = "iOS";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/Mac OS/.test(ua)) os = "Mac OS";
    else if (/Linux/.test(ua)) os = "Linux";

    setDeviceOS(os);

    if (os === "Windows" || (os === "Mac OS" && navigator.maxTouchPoints <= 1) || (os === "Linux" && !/android/i.test(ua))) {
      setIsMobileDevice(false);
    }

    // 2. INICIALIZAÇÃO DE DADOS
    const params = new URLSearchParams(window.location.search);
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR') + ' às ' + hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' });

    setDocInfo({
      empresa_nome: params.get('empresa') || 'AGSEG Locadora',
      empresa_cnpj: params.get('cnpj') || '49.401.572/0001-71',
      empresa_tel: params.get('empresa_tel') || '(11) 94365-3061',
      empresa_email: params.get('email') || 'contato@agseg.com.br',
      motorista_nome: params.get('motorista') || 'Motorista Não Identificado',
      motorista_tel: params.get('tel') || 'Não Informado',
      veiculo_placa: params.get('placa') || 'XXX-0000',
      veiculo_modelo: params.get('modelo') || 'Veículo Padrão',
      data_atual: dataFormatada
    });
    
    const initialLights = {};
    lightsChecklist.forEach(l => initialLights[l.id] = 'OK');
    setLights(initialLights);

    // 3. BUSCA GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const coords = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          setGpsCoords(coords);
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.address) {
              const road = data.address.road || data.address.pedestrian || '';
              const suburb = data.address.suburb || data.address.city_district || '';
              const city = data.address.city || data.address.town || data.address.municipality || '';
              const state = data.address.state || '';
              const enderecoFormatado = `${road}, ${suburb} - ${city}/${state}`.replace(/^, | ,/g, '').trim();
              setLocationText(enderecoFormatado || `GPS: ${coords}`);
            } else {
              setLocationText(`GPS: ${coords}`);
            }
          } catch (error) {
            setLocationText(`GPS: ${coords}`);
          }
        },
        () => setLocationText("GPS: Não autorizado"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationText("GPS: Indisponível");
    }
  }, []);

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
  };

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

          ctx.drawImage(img, 0, 0);

          const fontSize = Math.max(16, Math.floor(img.height * 0.022));
          ctx.font = `bold ${fontSize}px sans-serif`;

          const addressWords = `ENDEREÇO: ${locationText}`.split(' ');
          let addrLine = '';
          const addrLines = [];
          for (let n = 0; n < addressWords.length; n++) {
            const testLine = addrLine + addressWords[n] + ' ';
            if (ctx.measureText(testLine).width > img.width - 40 && n > 0) {
              addrLines.push(addrLine);
              addrLine = addressWords[n] + ' ';
            } else {
              addrLine = testLine;
            }
          }
          addrLines.push(addrLine);

          const totalLines = 2 + addrLines.length; 
          const lineHeight = fontSize * 1.4;
          const bannerHeight = (totalLines * lineHeight) + (fontSize * 1.5); 

          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

          let currentY = img.height - bannerHeight + fontSize + 10;
          const now = new Date().toLocaleString("pt-BR");

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`VISTORIA: ${now} | OS: ${deviceOS}`, 20, currentY);
          currentY += lineHeight;
          
          ctx.fillStyle = "#A6E22E"; 
          ctx.fillText(`COORDENADAS: ${gpsCoords || 'Indisponível'}`, 20, currentY);
          currentY += lineHeight;

          ctx.fillStyle = "#FFFFFF";
          for (let i = 0; i < addrLines.length; i++) {
            ctx.fillText(addrLines[i], 20, currentY);
            currentY += lineHeight;
          }

          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
      };
    });
  };

  const handleFileChange = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const watermarkedDataUrl = await processImageWithWatermark(file);
      const watermarkedFile = dataURLtoFile(watermarkedDataUrl, file.name);

      setFiles(prev => ({ ...prev, [id]: watermarkedFile }));
      setFilePreviews(prev => ({ ...prev, [id]: watermarkedDataUrl }));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("O vídeo é muito grande! Grave um vídeo mais curto (até 30 segundos).");
        return;
      }
      setVideo360(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleReview = (e) => {
    e.preventDefault();
    const totalPhotos = photoCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const uploadedPhotos = Object.keys(files).length;
    
    if (uploadedPhotos < totalPhotos) {
      alert(`Atenção: Você tirou ${uploadedPhotos} de ${totalPhotos} fotos obrigatórias. Por favor, complete o checklist.`);
      return;
    }
    if (!video360) {
      alert('Por favor, grave o Vídeo 360° do veículo.');
      return;
    }
    if (!levels.oleo || !levels.agua || !estepe.usado) {
      alert('Por favor, preencha todos os campos de mecânica e estepe.');
      return;
    }
    setStep(2); 
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const dataToSend = new FormData();
    dataToSend.append('empresa', docInfo.empresa_nome);
    dataToSend.append('cnpj', docInfo.empresa_cnpj);
    dataToSend.append('motorista', docInfo.motorista_nome);
    dataToSend.append('telefone', docInfo.motorista_tel);
    dataToSend.append('placa', docInfo.veiculo_placa);
    dataToSend.append('modelo', docInfo.veiculo_modelo);
    dataToSend.append('data_vistoria', docInfo.data_atual);
    dataToSend.append('gps', gpsCoords || "Indisponível");
    dataToSend.append('endereco_local', locationText);
    dataToSend.append('sistema_operacional', deviceOS);

    dataToSend.append('nivel_oleo', levels.oleo);
    dataToSend.append('nivel_agua', levels.agua);
    dataToSend.append('obs_agua', levels.agua_obs);
    dataToSend.append('estepe_usado', estepe.usado);
    dataToSend.append('estepe_motivo', estepe.motivo);
    dataToSend.append('estepe_pneu_avaria', estepe.pneu_avaria);
    
    dataToSend.append('luzes_json', JSON.stringify(lights));
    dataToSend.append('obs_luzes', obsLuzes);
    dataToSend.append('obs_gerais', obsGerais);

    Object.keys(files).forEach(key => {
      dataToSend.append(key, files[key]);
    });
    
    if (video360) {
      dataToSend.append('video_360', video360);
    }

    try {
      const resposta = await fetch('https://webhook.lynkapay.com.br/webhook/receber-laudo', {
        method: 'POST',
        body: dataToSend,
      });

      if (resposta.ok) {
        alert('✅ Laudo enviado com sucesso! Boa viagem.');
        setStep(1);
      } else {
        alert('❌ Erro no servidor. Tente enviar novamente.');
      }
    } catch (error) {
      alert('❌ Erro de conexão. Verifique sua internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMobileDevice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md border-t-8 border-red-600">
          <div className="text-6xl mb-4">📱❌</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Acesso Negado</h1>
          <p className="text-slate-600 mb-5 font-medium leading-relaxed">
            Por medidas de segurança e antifraude, este laudo de vistoria só pode ser preenchido e assinado através de um <strong>Smartphone</strong> (Câmera).
          </p>
          <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-700 border border-slate-200">
            <p>Por favor, abra o link recebido diretamente no seu aparelho celular.</p>
          </div>
          <p className="text-xs text-slate-400 mt-6 font-mono">Dispositivo detectado: {deviceOS}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-4 font-sans text-gray-800 pb-20 relative">
      
      {fullScreenImage && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-4">
          <button 
            onClick={() => setFullScreenImage(null)} 
            className="absolute top-4 right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg"
          >
            X
          </button>
          <img src={fullScreenImage} alt="Preview em Tela Cheia" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="bg-slate-900 text-white p-6 border-b-[6px] border-blue-600">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black uppercase tracking-wider">{docInfo.empresa_nome}</h1>
            <p className="text-blue-300 font-bold uppercase tracking-widest text-sm mt-1">Laudo de Vistoria Oficial</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 text-sm bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div>
              <p className="text-slate-400 font-bold uppercase mb-1 text-xs">Dados da Locadora</p>
              <p>CNPJ: <span className="font-medium">{docInfo.empresa_cnpj}</span></p>
              <p>Email: <span className="font-medium">{docInfo.empresa_email}</span></p>
              <p>Tel: <span className="font-medium">{docInfo.empresa_tel}</span></p>
            </div>
            <div className="pt-3 border-t border-slate-700">
              <p className="text-slate-400 font-bold uppercase mb-1 text-xs">Registro de Vistoria</p>
              <p>Data: <span className="font-medium">{docInfo.data_atual}</span></p>
              <p>Local: <span className="font-medium text-blue-300">{locationText}</span></p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase">Condutor</span>
              <span className="font-bold text-slate-800 text-lg leading-tight block">{docInfo.motorista_nome}</span>
              <span className="block text-sm text-slate-600 mt-1">{docInfo.motorista_tel}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-500 uppercase">Veículo</span>
              <span className="font-bold text-slate-800 text-lg leading-tight block">{docInfo.veiculo_modelo}</span>
              <span className="inline-block mt-2"><span className="bg-slate-800 text-white font-bold px-3 py-1 rounded text-sm">{docInfo.veiculo_placa}</span></span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleReview} className="p-4 md:p-6 space-y-8">
            
            {photoCategories.map((category, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 border-b-2 pb-2 border-slate-200">{category.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                      <h3 className="font-bold text-slate-800 text-lg mb-1">{item.label}</h3>
                      <p className="text-sm text-slate-600 mb-4 flex-grow">{item.instruction}</p>
                      
                      <div className="rounded-lg overflow-hidden border-2 border-slate-200 mb-4 bg-slate-100 flex items-center justify-center h-48 relative">
                        {filePreviews[item.id] ? (
                          <img src={filePreviews[item.id]} alt="Preview" className="w-full h-full object-contain bg-black" />
                        ) : (
                          // ADICIONADO LOADING LAZY NAS FOTOS DE EXEMPLO AQUI 👇
                          <img src={item.exampleImg} alt="Exemplo" className="w-full h-full object-cover opacity-80" loading="lazy" />
                        )}
                      </div>

                      {files[item.id] ? (
                        <div className="flex gap-2 w-full">
                          <label className="flex-1 flex items-center justify-center py-3 rounded-lg border-2 bg-green-50 border-green-500 text-green-700 font-bold text-sm cursor-pointer shadow-sm hover:bg-green-100 transition">
                            ✅ Refazer
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, item.id)} />
                          </label>
                          <button 
                            type="button" 
                            onClick={() => setFullScreenImage(filePreviews[item.id])} 
                            className="flex-1 flex items-center justify-center py-3 rounded-lg border-2 bg-blue-50 border-blue-400 text-blue-700 font-bold text-sm cursor-pointer shadow-sm hover:bg-blue-100 transition"
                          >
                            🔍 Ver Foto
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center w-full py-4 rounded-lg border-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 cursor-pointer transition-all font-bold text-base shadow-sm">
                          📷 Abrir Câmera
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, item.id)} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b-2 pb-2 border-slate-200">Vídeo Externo</h2>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-1">📹 Vídeo 360° Obrigatório</h3>
                <p className="text-sm text-slate-600 mb-4">Grave um vídeo contínuo de 20 a 30 segundos dando uma volta completa ao redor do veículo para registrar a integridade da lataria.</p>
                
                {videoPreview && (
                  <video src={videoPreview} controls className="w-full h-48 object-cover rounded-lg border border-slate-300 mb-4 shadow-sm" />
                )}

                <label className={`flex items-center justify-center w-full py-4 rounded-lg border-2 cursor-pointer transition-all font-bold text-base shadow-sm ${video360 ? 'bg-green-50 border-green-500 text-green-700' : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'}`}>
                  {video360 ? '✅ Gravar Novo Vídeo' : '🎥 Gravar Vídeo 360°'}
                  <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleVideoChange} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b-2 pb-2 border-slate-200">Estepe</h2>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-3 text-lg">O estepe foi utilizado recentemente?</label>
                <div className="flex gap-3 mb-4">
                  {['Sim', 'Não'].map(opt => (
                    <label key={opt} className={`flex-1 text-center py-3 rounded-lg border-2 cursor-pointer font-bold text-base transition-colors ${estepe.usado === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" name="estepe" className="hidden" value={opt} onChange={(e) => setEstepe({...estepe, usado: e.target.value})} />
                      {opt}
                    </label>
                  ))}
                </div>

                {estepe.usado === 'Sim' && (
                  <div className="space-y-4 mt-4 p-4 bg-white border border-red-200 rounded-lg shadow-inner">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Motivo da utilização:</label>
                      <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Pneu furou no buraco, rasgou..." value={estepe.motivo} onChange={(e) => setEstepe({...estepe, motivo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Qual pneu teve avaria?</label>
                      <select className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={estepe.pneu_avaria} onChange={(e) => setEstepe({...estepe, pneu_avaria: e.target.value})}>
                        <option value="">Selecione o pneu...</option>
                        <option value="Dianteiro Esquerdo">Dianteiro Esquerdo</option>
                        <option value="Dianteiro Direito">Dianteiro Direito</option>
                        <option value="Traseiro Esquerdo">Traseiro Esquerdo</option>
                        <option value="Traseiro Direito">Traseiro Direito</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b-2 pb-2 border-slate-200">Mecânica Básica</h2>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                <div>
                  <label className="block font-bold text-slate-800 mb-3 text-lg">Nível do Óleo do Motor</label>
                  <div className="flex gap-2">
                    {['Baixo', 'No Nível', 'Alto'].map(opt => (
                      <label key={opt} className={`flex-1 text-center py-2 rounded-lg border-2 cursor-pointer font-bold text-sm transition-colors ${levels.oleo === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-600'}`}>
                        <input type="radio" name="oleo" className="hidden" value={opt} onChange={(e) => setLevels({...levels, oleo: e.target.value})} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <label className="block font-bold text-slate-800 mb-3 text-lg">Nível da Água (Arrefecimento)</label>
                  <div className="flex gap-2 mb-4">
                    {['Baixo', 'No Nível', 'Alto'].map(opt => (
                      <label key={opt} className={`flex-1 text-center py-2 rounded-lg border-2 cursor-pointer font-bold text-sm transition-colors ${levels.agua === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-600'}`}>
                        <input type="radio" name="agua" className="hidden" value={opt} onChange={(e) => setLevels({...levels, agua: e.target.value})} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Precisa completar a água com frequência?</label>
                  <textarea rows="2" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Se sim, descreva aqui (pode indicar vazamento)..." value={levels.agua_obs} onChange={(e) => setLevels({...levels, agua_obs: e.target.value})}></textarea>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b-2 pb-2 border-slate-200">Verificação de Luzes</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {lightsChecklist.map((light, index) => (
                  <div key={light.id} className={`p-4 flex items-center justify-between ${index !== lightsChecklist.length -1 ? 'border-b border-slate-100' : ''}`}>
                    <span className="font-bold text-slate-700">{light.label}</span>
                    <select className={`text-sm border-2 rounded-lg p-2 outline-none font-bold cursor-pointer ${lights[light.id] === 'OK' ? 'bg-green-50 text-green-700 border-green-200' : lights[light.id] === 'Avaria' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-200'}`} value={lights[light.id]} onChange={(e) => setLights({...lights, [light.id]: e.target.value})}>
                      <option value="OK">OK</option>
                      <option value="Avaria">Avaria / Queimada</option>
                      <option value="N/A">Não tem</option>
                    </select>
                  </div>
                ))}
              </div>
              <textarea rows="2" className="w-full p-3 border border-slate-300 rounded-lg outline-none mt-2" placeholder="Descreva se alguma luz estiver piscando rápido ou com defeito..." value={obsLuzes} onChange={(e) => setObsLuzes(e.target.value)}></textarea>
              
              <div className="pt-6">
                <label className="block text-lg font-bold text-slate-800 mb-3 border-b-2 pb-2 border-slate-200">Observações Finais do Veículo</label>
                <textarea rows="4" className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="Relate detalhadamente avarias, arranhões, barulhos estranhos ou problemas gerais no veículo..." value={obsGerais} onChange={(e) => setObsGerais(e.target.value)}></textarea>
              </div>
            </div>

            <button type="submit" className="w-full font-black text-xl p-5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-transform active:scale-95">
              Continuar para Revisão Final ➔
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="p-4 md:p-6 space-y-8 animate-fade-in">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg text-yellow-800 shadow-sm">
              <h3 className="font-black text-lg">Atenção, {docInfo.motorista_nome}!</h3>
              <p className="text-sm mt-2 font-medium">Você está prestes a enviar um documento oficial. Revise se as fotos e o vídeo estão nítidos e as informações corretas. <br/>A locadora utilizará este laudo para auditoria da frota.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-black text-xl text-slate-800 border-b-2 pb-2">Evidências Capturadas</h3>
              
              {videoPreview && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm mb-4">
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">Vídeo 360° do Veículo</p>
                  <video src={videoPreview} controls className="w-full h-32 object-cover rounded border border-slate-300" />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photoCategories.flatMap(c => c.items).map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50 shadow-sm flex flex-col">
                    <img src={filePreviews[item.id]} alt={item.label} className="w-full h-24 object-contain bg-black rounded mb-2 border border-slate-200 cursor-pointer" onClick={() => setFullScreenImage(filePreviews[item.id])} />
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-xl text-slate-800 border-b-2 pb-2">Resumo das Respostas</h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-base space-y-3 shadow-sm">
                
                <p><strong>Nível de Óleo:</strong> <span className="text-blue-700 font-bold">{levels.oleo}</span></p>
                <p><strong>Nível de Água:</strong> <span className="text-blue-700 font-bold">{levels.agua}</span></p>
                {levels.agua_obs && <p className="text-red-600 bg-red-50 p-2 rounded"><strong>Obs Água:</strong> {levels.agua_obs}</p>}
                
                <div className="pt-3 border-t border-slate-200 mt-3">
                  <p><strong>Uso do Estepe:</strong> {estepe.usado === 'Sim' ? <span className="text-red-600 font-bold">Sim</span> : <span className="text-green-600 font-bold">Não</span>}</p>
                  {estepe.usado === 'Sim' && (
                    <div className="pl-4 text-red-700 mt-2 border-l-4 border-red-400 bg-red-50 p-3 rounded">
                      <p><strong>Motivo:</strong> {estepe.motivo}</p>
                      <p className="mt-1"><strong>Pneu com avaria:</strong> {estepe.pneu_avaria}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 mt-3">
                  <p className="font-bold mb-2">Problemas de Luzes:</p>
                  <ul className="list-disc pl-6 text-red-600 font-medium">
                    {lightsChecklist.filter(l => lights[l.id] === 'Avaria').map(l => (
                       <li key={l.id}>{l.label}</li>
                    ))}
                    {lightsChecklist.filter(l => lights[l.id] === 'Avaria').length === 0 && <li className="text-green-600 list-none -ml-6 font-bold">✅ Nenhuma luz com avaria registrada.</li>}
                  </ul>
                  {obsLuzes && <p className="mt-2 text-sm text-slate-600"><strong>Obs Luzes:</strong> {obsLuzes}</p>}
                </div>
                
                {obsGerais && (
                  <div className="pt-3 border-t border-slate-200 mt-3 text-slate-800">
                    <p className="font-bold">Observações Finais:</p>
                    <p className="mt-2 italic bg-white p-3 border rounded">"{obsGerais}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-2 border-slate-200">
              <button type="button" onClick={() => setStep(1)} className="md:w-1/3 font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 p-4 rounded-xl transition-colors">
                ⬅ Voltar e Corrigir
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="md:w-2/3 font-black text-xl text-white bg-green-600 hover:bg-green-700 p-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center">
                {isSubmitting ? 'Enviando ao Servidor...' : '✅ Assinar e Emitir Laudo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}