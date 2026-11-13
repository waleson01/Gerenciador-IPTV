<script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Home, Users, UserPlus, AlertTriangle, 
  CheckCircle, XCircle, Calendar, Server, 
  Smartphone, Clock, Trash2, Edit2, Check, CloudLightning
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB-ZeIRWkCEa6WRAkjV-tQOeTUxNDWbH2M",
  authDomain: "gerenciador-iptv-b66c2.firebaseapp.com",
  projectId: "gerenciador-iptv-b66c2",
  storageBucket: "gerenciador-iptv-b66c2.firebasestorage.app",
  messagingSenderId: "698743432377",
  appId: "1:698743432377:web:2540b3e496ae98bb236768",
  measurementId: "G-NFCF4K66VS"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'iptv-manager-app';

// --- UTILITY FUNCTIONS ---
const getDaysUntil = (dateString) => {
  if (!dateString) return Infinity;
  const target = new Date(dateString + 'T00:00:00'); // Prevent timezone shift
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// --- COMPONENTS ---

const Modal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ clients }) => {
  const currentMonth = getCurrentMonthKey();
  
  const stats = useMemo(() => {
    let expiringLists = [];
    let expiringApps = [];
    let unpaid = [];
    let paid = [];

    clients.forEach(client => {
      // Check Expirations (<= 5 days)
      const listDays = getDaysUntil(client.listExpiryDate);
      if (listDays <= 5) expiringLists.push({ ...client, daysLeft: listDays });

      const appDays = getDaysUntil(client.appExpiryDate);
      if (appDays <= 5) expiringApps.push({ ...client, daysLeft: appDays });

      // Check Payments
      const hasPaidThisMonth = client.payments && client.payments[currentMonth];
      if (hasPaidThisMonth) {
        paid.push(client);
      } else {
        unpaid.push(client);
      }
    });

    return { expiringLists, expiringApps, unpaid, paid };
  }, [clients, currentMonth]);

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 px-1">Visão Geral</h2>

      {/* Alertas de Vencimento */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Atenção (5 dias ou menos)
        </h3>
        
        {stats.expiringLists.length === 0 && stats.expiringApps.length === 0 && (
          <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
            Nenhuma lista ou aplicativo vencendo nos próximos 5 dias.
          </p>
        )}

        {stats.expiringLists.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Listas Vencendo
            </h4>
            <div className="space-y-2">
              {stats.expiringLists.map(c => (
                <div key={`list-${c.id}`} className="flex justify-between items-center text-sm">
                  <span className="text-orange-900 font-medium">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.daysLeft < 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                    {c.daysLeft < 0 ? 'Venceu' : c.daysLeft === 0 ? 'Hoje' : `Faltam ${c.daysLeft} d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.expiringApps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Apps Vencendo
            </h4>
            <div className="space-y-2">
              {stats.expiringApps.map(c => (
                <div key={`app-${c.id}`} className="flex justify-between items-center text-sm">
                  <span className="text-amber-900 font-medium">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.daysLeft < 0 ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                    {c.daysLeft < 0 ? 'Venceu' : c.daysLeft === 0 ? 'Hoje' : `Faltam ${c.daysLeft} d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financeiro do Mês */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Financeiro ({new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })})
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-red-600 mb-1">{stats.unpaid.length}</span>
            <span className="text-sm font-medium text-red-800 flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Falta Pagar
            </span>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-green-600 mb-1">{stats.paid.length}</span>
            <span className="text-sm font-medium text-green-800 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Já Pagaram
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientForm = ({ onSave, clientToEdit, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    monthlyDueDate: '',
    listExpiryDate: '',
    server: '',
    appExpiryDate: '',
    appNotes: ''
  });

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        monthlyDueDate: clientToEdit.monthlyDueDate || '',
        listExpiryDate: clientToEdit.listExpiryDate || '',
        server: clientToEdit.server || '',
        appExpiryDate: clientToEdit.appExpiryDate || '',
        appNotes: clientToEdit.appNotes || ''
      });
    }
  }, [clientToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, clientToEdit?.id);
    if (!clientToEdit) {
      setFormData({ name: '', monthlyDueDate: '', listExpiryDate: '', server: '', appExpiryDate: '', appNotes: '' });
    }
  };

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-gray-800 px-1 mb-6">
        {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
          <input 
            type="text" required
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: João Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia Venc. (Mensalidade)</label>
            <input 
              type="number" min="1" max="31" required
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
              value={formData.monthlyDueDate} onChange={e => setFormData({...formData, monthlyDueDate: e.target.value})}
              placeholder="Ex: 10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servidor</label>
            <input 
              type="text" required
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
              value={formData.server} onChange={e => setFormData({...formData, server: e.target.value})}
              placeholder="Ex: P2P Master"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento da Lista (Painel)</label>
          <input 
            type="date" required
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
            value={formData.listExpiryDate} onChange={e => setFormData({...formData, listExpiryDate: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1 ml-1">Data que o crédito expira no painel.</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento do Aplicativo (Opcional)</label>
          <input 
            type="date"
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
            value={formData.appExpiryDate} onChange={e => setFormData({...formData, appExpiryDate: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Aplicativo</label>
          <textarea 
            rows="2"
            className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base resize-none"
            value={formData.appNotes} onChange={e => setFormData({...formData, appNotes: e.target.value})}
            placeholder="Ex: Login via MAC, App IBO Player..."
          />
        </div>

        <div className="pt-4 flex gap-3">
          {clientToEdit && (
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex justify-center items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {clientToEdit ? 'Atualizar' : 'Salvar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ClientList = ({ clients, onTogglePayment, onEdit, onDelete }) => {
  const currentMonth = getCurrentMonthKey();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.server.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20 space-y-4">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Meus Clientes</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{clients.length} Total</span>
      </div>

      <input 
        type="text"
        placeholder="Buscar cliente ou servidor..."
        className="w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-3 mt-4">
        {filteredClients.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum cliente encontrado.</p>
        ) : (
          filteredClients.map(client => {
            const hasPaid = client.payments && client.payments[currentMonth];
            const listDays = getDaysUntil(client.listExpiryDate);
            const listAlert = listDays <= 5;
            
            return (
              <div key={client.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                
                {/* Header: Name and Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{client.name}</h3>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-1">
                      <Server className="w-3 h-3" /> {client.server}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(client)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(client)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expiration Infos */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-0.5">Venc. Mensalidade</div>
                    <div className="font-semibold text-gray-800">Dia {client.monthlyDueDate}</div>
                  </div>
                  <div className={`rounded-lg p-2 border ${listAlert ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`text-xs mb-0.5 ${listAlert ? 'text-orange-600' : 'text-gray-500'}`}>Venc. Lista</div>
                    <div className={`font-semibold ${listAlert ? 'text-orange-800' : 'text-gray-800'}`}>
                      {new Date(client.listExpiryDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* Payment Action for Current Month */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Pagamento ({new Date().toLocaleString('pt-BR', { month: 'short' })})</span>
                  <button 
                    onClick={() => onTogglePayment(client.id, hasPaid)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      hasPaid 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {hasPaid ? (
                      <><CheckCircle className="w-4 h-4" /> Pago</>
                    ) : (
                      <><Clock className="w-4 h-4" /> Marcar como Pago</>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clientToEdit, setClientToEdit] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localDataToSync, setLocalDataToSync] = useState(null);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // 1. Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.warn("Auth Error caught, switching to local mode.", error);
        setAuthError(error.message);
        setIsLocalMode(true);
        setUser({ uid: 'local-user' }); // Mock user to allow local usage
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
        setIsLocalMode(false);
        
        // Verifica se há dados offline para sincronizar quando online
        const savedData = localStorage.getItem('iptv-clients');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.length > 0) setLocalDataToSync(parsed);
          } catch(e) {}
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isLocalMode) {
      const localData = localStorage.getItem('iptv-clients');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setClients(parsed.sort((a, b) => a.name.localeCompare(b.name)));
        } catch(e) {
          console.error("Local storage parse error", e);
        }
      }
      return;
    }

    const clientsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clientes');
    
    const unsubscribe = onSnapshot(clientsRef, (snapshot) => {
      const clientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      clientData.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientData);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [user, isLocalMode]);

  // Actions
  const handleSyncData = async () => {
    if (!user || !localDataToSync) return;
    const clientsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clientes');
    
    try {
      // Adiciona cada cliente local ao Firebase
      for (const client of localDataToSync) {
        const { id, ...clientData } = client; // Remove o ID local
        await addDoc(clientsRef, clientData);
      }
      // Limpa os dados locais
      localStorage.removeItem('iptv-clients');
      setLocalDataToSync(null);
      alert("Sincronização concluída com sucesso!");
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
      alert("Erro ao sincronizar dados. Tente novamente.");
    }
  };

  const handleSaveClient = async (formData, editId) => {
    if (!user) return;
    
    if (isLocalMode) {
      let newClients = [...clients];
      if (editId) {
        newClients = newClients.map(c => c.id === editId ? { ...c, ...formData } : c);
      } else {
        newClients.push({ ...formData, id: Date.now().toString(), payments: {} });
      }
      newClients.sort((a, b) => a.name.localeCompare(b.name));
      setClients(newClients);
      localStorage.setItem('iptv-clients', JSON.stringify(newClients));
      setClientToEdit(null);
      setActiveTab('list');
      return;
    }

    const clientsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clientes');
    
    try {
      if (editId) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clientes', editId);
        await updateDoc(docRef, formData);
        setClientToEdit(null);
      } else {
        await addDoc(clientsRef, { ...formData, payments: {} });
      }
      setActiveTab('list');
    } catch (err) {
      console.error("Error saving client:", err);
    }
  };

  const handleTogglePayment = async (clientId, currentState) => {
    if (!user) return;
    const currentMonth = getCurrentMonthKey();
    
    if (isLocalMode) {
      const newClients = clients.map(c => {
        if (c.id === clientId) {
          return { ...c, payments: { ...(c.payments || {}), [currentMonth]: !currentState } };
        }
        return c;
      });
      setClients(newClients);
      localStorage.setItem('iptv-clients', JSON.stringify(newClients));
      return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clientes', clientId);
    
    try {
      await updateDoc(docRef, {
        [`payments.${currentMonth}`]: !currentState
      });
    } catch (err) {
      console.error("Error toggling payment:", err);
    }
  };

  const confirmDelete = (client) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir Cliente',
      message: `Tem certeza que deseja excluir ${client.name}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        if (!user) return;
        
        if (isLocalMode) {
          const newClients = clients.filter(c => c.id !== client.id);
          setClients(newClients);
          localStorage.setItem('iptv-clients', JSON.stringify(newClients));
          setModalConfig({ ...modalConfig, isOpen: false });
          return;
        }

        try {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clientes', client.id);
          await deleteDoc(docRef);
          setModalConfig({ ...modalConfig, isOpen: false });
        } catch (err) {
          console.error("Error deleting:", err);
        }
      }
    });
  };

  const startEdit = (client) => {
    setClientToEdit(client);
    setActiveTab('add');
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-200">
      
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gestor IPTV Pro
        </h1>
        {!isLocalMode && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <CloudLightning className="w-3 h-3" /> Online
          </span>
        )}
      </header>

      {/* Alertas de Status da Conexão e Sincronização */}
      {isLocalMode ? (
        <div className="bg-amber-100 p-3 text-amber-900 text-xs flex items-center justify-between gap-2 border-b border-amber-200">
          <span className="font-bold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4"/> Modo Offline (Sem Nuvem)
          </span>
        </div>
      ) : localDataToSync ? (
        <div className="bg-green-100 p-3 text-green-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-green-200">
          <div>
            <p className="font-bold flex items-center gap-1">Você tem clientes salvos offline!</p>
            <p className="text-xs">Sincronize para acessá-los em qualquer aparelho.</p>
          </div>
          <button 
            onClick={handleSyncData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition-colors"
          >
            Sincronizar Agora
          </button>
        </div>
      ) : null}

      {/* Main Content Area */}
      <main className="p-4 max-w-lg mx-auto">
        {activeTab === 'dashboard' && <Dashboard clients={clients} />}
        {activeTab === 'add' && (
          <ClientForm 
            onSave={handleSaveClient} 
            clientToEdit={clientToEdit} 
            onCancelEdit={() => { setClientToEdit(null); setActiveTab('list'); }} 
          />
        )}
        {activeTab === 'list' && (
          <ClientList 
            clients={clients} 
            onTogglePayment={handleTogglePayment} 
            onEdit={startEdit}
            onDelete={confirmDelete}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 px-2 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto flex justify-between">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-1 flex flex-col items-center py-3 px-2 gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('list')} 
            className={`flex-1 flex flex-col items-center py-3 px-2 gap-1 transition-colors ${activeTab === 'list' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Users className={`w-6 h-6 ${activeTab === 'list' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-bold">Clientes</span>
          </button>
          
          <button 
            onClick={() => { setClientToEdit(null); setActiveTab('add'); }} 
            className={`flex-1 flex flex-col items-center py-3 px-2 gap-1 transition-colors ${activeTab === 'add' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <UserPlus className={`w-6 h-6 ${activeTab === 'add' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-bold">Cadastrar</span>
          </button>
        </div>
      </nav>

      {/* Global Confirmation Modal */}
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />

    </div>
  );
}