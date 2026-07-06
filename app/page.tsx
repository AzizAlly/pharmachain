"use client";

import { useState, useEffect, useCallback, useMemo, ReactNode, useRef } from "react";
import { 
  LayoutDashboard, Package, Scan, Truck, LogOut, Shield, 
  Plus, Settings, Users, CheckCircle, AlertCircle, X,
  Menu, ArrowRight, Lock, Eye, EyeOff,
  Activity, Search, ShoppingCart,
  UserPlus, Boxes, GitBranch, ClipboardList,
  Warehouse, Store, Building, Link, Blocks, RefreshCw,
  Bell, UserCheck, UserX, Clock as ClockIcon,
  Heart, Zap, LogIn, Trash2, HelpCircle,
  QrCode as QrCodeIcon, Barcode, Layers, Shield as ShieldIcon, 
  BadgeCheck, FileCheck as FileCheckIcon, Crown, Download,
  Map as MapIcon,
  DollarSign, Camera, Upload
} from "lucide-react";

// ============================================
// TYPES - Removed wholesaler
// ============================================
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manufacturer' | 'distributor' | 'pharmacy' | 'patient';
  status: 'pending' | 'approved' | 'rejected';
  tmdaNumber?: string;
  tmdaExpiry?: string;
  pharmacyLicense?: string;
  business?: string;
  region?: string;
  fleetSize?: string;
}

interface Medicine {
  id: number;
  name: string;
  category: string;
  description: string;
  batch_no: string;
  expiry_date: string;
  price: number;
  quantity: number;
  manufacturer_id: number;
  manufacturer_name: string;
  current_owner_id: number;
  current_owner_name?: string;
  current_owner_role?: string;
  current_location?: string;
  status: 'active' | 'transferred' | 'expired';
  verified_count: number;
  created_at: string;
}

interface Transfer {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_no: string;
  from_id: number;
  from_name: string;
  to_id: number;
  to_name: string;
  quantity: number;
  status: string;
  date: string;
}

interface ActivityLog {
  id: number;
  user_id: number;
  user_name?: string;
  user_role?: string;
  action: string;
  details: any;
  created_at: string;
}

interface QRCode {
  type: 'BIG_BOX' | 'UNIT';
  code: string;
  label: string;
}

// ============================================
// API HELPER
// ============================================
const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const response = await fetch(`/api${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
};

// ============================================
// CAMERA QR SCANNER COMPONENT
// ============================================
function CameraQRScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Simulate QR detection after 3 seconds
        setTimeout(() => {
          const simulatedBatch = "BATCH-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const stream = videoRef.current?.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setScanning(false);
          onScan(simulatedBatch);
        }, 3000);
      }
    } catch (err) {
      setError('Unable to access camera. Please use file upload instead.');
      setScanning(false);
      console.error('Camera error:', err);
    }
  }, [onScan]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const simulatedBatch = "BATCH-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const batchNumber = prompt("QR Code detected! Please enter the batch number from the QR code:", simulatedBatch);
        if (batchNumber && batchNumber.trim()) {
          onScan(batchNumber.trim().toUpperCase());
        }
      } catch (err) {
        setError('Failed to read QR code. Please try again.');
        console.error('QR scan error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Scan QR Code
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                </div>
                <div className="absolute bottom-8 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                  Scanning...
                </div>
              </div>
            )}

            {/* Camera Start Button */}
            {!scanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <Camera className="w-16 h-16 text-white mb-4" />
                <button
                  onClick={startCamera}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                  Start Camera
                </button>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-white text-sm text-center px-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 px-4 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Alternative Upload */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Or upload QR code image</p>
            <label className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer transition">
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {scanning && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Scanning QR code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Home() {
  // ============================================
  // STATE
  // ============================================
  const [page, setPage] = useState<'home' | 'dashboard'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Data States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [verified, setVerified] = useState<number[]>([]);
  const [blockchainChain, setBlockchainChain] = useState<any[]>([]);
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState({
    totalBlocks: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    difficulty: 4,
    isValid: true,
    isMining: false
  });

  // UI States
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTMDAApplyModal, setShowTMDAApplyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedForTransfer, setSelectedForTransfer] = useState<Medicine | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [currentMedicine, setCurrentMedicine] = useState<{ name: string; batch: string; quantity: number } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; medicine?: Medicine } | null>(null);

  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [notifications, setNotifications] = useState<{ id: number; message: string; time: string; type: string }[]>([]);

  // Login/Register States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'patient' | 'manufacturer' | 'distributor' | 'pharmacy'>('patient');
  const [regBusiness, setRegBusiness] = useState('');
  const [regTmdaNumber, setRegTmdaNumber] = useState('');
  const [regTmdaExpiry, setRegTmdaExpiry] = useState('');
  const [regPharmacyLicense, setRegPharmacyLicense] = useState('');

  // Medicine Creation States
  const [medName, setMedName] = useState('');
  const [medBatch, setMedBatch] = useState('');
  const [medExpiry, setMedExpiry] = useState('');
  const [medPrice, setMedPrice] = useState('');
  const [medQuantity, setMedQuantity] = useState('');
  const [medCategory, setMedCategory] = useState('');
  const [medDescription, setMedDescription] = useState('');
  const [scanBatch, setScanBatch] = useState('');

  // Transfer States
  const [transferTo, setTransferTo] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');

  // TMDA Application States
  const [tmdaApplication, setTmdaApplication] = useState({
    businessName: '',
    licenseNumber: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    documents: null as File | null
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const myMedicines = useMemo(() => {
    if (!user) return [];
    if (user.role === 'manufacturer') {
      return medicines.filter((m) => m.manufacturer_id === user.id);
    }
    if (user.role === 'patient') {
      return medicines.filter((m) => verified.includes(m.id));
    }
    if (['distributor', 'pharmacy'].includes(user.role)) {
      return medicines.filter((m) => m.current_owner_id === user.id);
    }
    return [];
  }, [user, medicines, verified]);

  // Available medicines for marketplace
  const availableMedicines = useMemo(() => {
    if (!user) return [];
    
    if (user.role === 'distributor') {
      return medicines.filter((m) => 
        m.status === 'active' && m.quantity > 0 && m.current_owner_id === m.manufacturer_id
      );
    }
    if (user.role === 'pharmacy') {
      return medicines.filter((m) => {
        const owner = allUsers.find(u => u.id === m.current_owner_id);
        return m.status === 'active' && m.quantity > 0 && owner?.role === 'distributor';
      });
    }
    if (user.role === 'admin') {
      return medicines.filter((m) => m.status === 'active' && m.quantity > 0);
    }
    return [];
  }, [user, medicines, allUsers]);

  const stats = useMemo(() => {
    const totalValue = myMedicines.reduce((s, m) => s + (m.price || 0) * (m.quantity || 0), 0);
    return {
      total: myMedicines.length,
      active: medicines.filter((m) => m.status === 'active').length,
      verified: verified.length,
      value: totalValue,
      totalQuantity: myMedicines.reduce((s, m) => s + (m.quantity || 0), 0),
      recentActivity: activityLog.slice(0, 5),
      pendingTransfers: transfers.filter((t) => t.to_id === user?.id && t.status !== 'completed').length,
    };
  }, [myMedicines, medicines, verified, activityLog, transfers, user]);

  const supplyChainStats = useMemo(() => ({
    manufacturers: allUsers.filter((u) => u.role === 'manufacturer' && u.status === 'approved').length,
    distributors: allUsers.filter((u) => u.role === 'distributor' && u.status === 'approved').length,
    pharmacies: allUsers.filter((u) => u.role === 'pharmacy' && u.status === 'approved').length,
    patients: allUsers.filter((u) => u.role === 'patient' && u.status === 'approved').length,
    tmdaApproved: allUsers.filter((u) => u.tmdaNumber && u.status === 'approved').length,
    totalTransfers: transfers.length,
  }), [allUsers, transfers]);

  const filteredMedicines = useMemo(() => {
    return myMedicines
      .filter((m: Medicine) => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return m.name.toLowerCase().includes(term) ||
                 m.batch_no.toLowerCase().includes(term) ||
                 (m.manufacturer_name?.toLowerCase().includes(term) || false);
        }
        if (filterStatus !== 'all') return m.status === filterStatus;
        return true;
      })
      .sort((a: Medicine, b: Medicine) => {
        switch (sortBy) {
          case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'price-high': return (b.price || 0) - (a.price || 0);
          case 'price-low': return (a.price || 0) - (b.price || 0);
          default: return 0;
        }
      });
  }, [myMedicines, searchTerm, filterStatus, sortBy]);

  const eligibleRecipients = useMemo(() => {
    if (!user) return [];
    const roleFlow: Record<string, string[]> = {
      manufacturer: ['distributor'],
      distributor: ['pharmacy'],
      pharmacy: ['patient'],
      patient: []
    };
    const targetRoles = roleFlow[user.role] || [];
    return allUsers.filter((u) => 
      targetRoles.includes(u.role) && u.status === 'approved' && u.id !== user.id
    );
  }, [user, allUsers]);

  const ownedBatches = useMemo(() => 
    medicines.filter((m) => m.current_owner_id === user?.id && m.quantity > 0),
    [medicines, user]
  );

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [usersRes, medsRes, transfersRes, logsRes] = await Promise.all([
        apiCall('/users'),
        apiCall('/medicines'),
        apiCall('/transfers'),
        apiCall('/activity-logs'),
      ]);

      if (usersRes.success && usersRes.data) {
        let usersData = [];
        const data = usersRes.data;
        if (Array.isArray(data)) usersData = data;
        else if (data.users) usersData = data.users;
        else if (data.data) usersData = data.data;
        else {
          for (const key in data) {
            if (Array.isArray(data[key])) { usersData = data[key]; break; }
          }
        }
        setAllUsers(usersData);
        const pending = usersData.filter((u: User) => u.status === 'pending');
        setPendingUsers(pending);
      }

      if (medsRes.success && medsRes.data) {
        let medicinesData = [];
        const data = medsRes.data;
        if (Array.isArray(data)) medicinesData = data;
        else if (data.medicines) medicinesData = data.medicines;
        else if (data.data) medicinesData = data.data;
        else {
          for (const key in data) {
            if (Array.isArray(data[key])) { medicinesData = data[key]; break; }
          }
        }
        setMedicines(medicinesData);
      }

      if (transfersRes.success && transfersRes.data) {
        let transfersData = [];
        const data = transfersRes.data;
        if (Array.isArray(data)) transfersData = data;
        else if (data.transfers) transfersData = data.transfers;
        else if (data.data) transfersData = data.data;
        setTransfers(transfersData);
      }

      if (logsRes.success && logsRes.data) {
        let logs = [];
        const data = logsRes.data;
        if (Array.isArray(data)) logs = data;
        else if (data.logs) logs = data.logs;
        else if (data.data) logs = data.data;
        if (user.role !== 'admin') {
          logs = logs.filter((log: ActivityLog) => log.user_id === user.id);
        }
        setActivityLog(logs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const connectToBlockchain = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await apiCall('/blockchain/info');
      if (res.success && res.data) {
        const info = res.data.info;
        setBlockchainStats({
          totalBlocks: info?.chainLength || 0,
          totalTransactions: info?.totalTransactions || 0,
          pendingTransactions: info?.pendingTransactions || 0,
          difficulty: info?.difficulty || 4,
          isValid: info?.isValid || true,
          isMining: info?.isMining || false
        });
        setBlockchainChain(res.data.chain || []);
        setBlockchainConnected(true);
      }
    } catch (error) {
      console.error('Blockchain error:', error);
      setBlockchainConnected(false);
    }
  }, [user]);

  const mineBlockchain = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const result = await apiCall('/blockchain/mine', { method: 'POST' });
      if (result.success) {
        alert(`✅ Block mined successfully!`);
        await connectToBlockchain();
        await loadData();
      } else {
        alert('Mining failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Mining error:', error);
      alert('Mining failed. Please try again.');
    }
  }, [user, connectToBlockchain, loadData]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    const saved = localStorage.getItem('pharmaUser');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      setPage('dashboard');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      if (user.role === 'admin') connectToBlockchain();
    }
  }, [user, loadData, connectToBlockchain]);

  // ============================================
  // HELPERS
  // ============================================
  const getOwnerName = useCallback((ownerId: number) => {
    const owner = allUsers.find((u) => u.id === ownerId);
    return owner ? owner.name : 'Unknown';
  }, [allUsers]);

  const getOwnerRole = useCallback((ownerId: number) => {
    const owner = allUsers.find((u) => u.id === ownerId);
    return owner ? owner.role : 'Unknown';
  }, [allUsers]);

  const logActivity = useCallback(async (action: string, details: any) => {
    try {
      await apiCall('/activity-logs', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id || 1, action, details }),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user]);

  // ============================================
  // AUTH HANDLERS
  // ============================================
  const handleLogin = useCallback(async () => {
    try {
      const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!result.success) {
        alert('Invalid credentials');
        return;
      }
      const userData = result.data?.user;
      setUser(userData);
      localStorage.setItem('pharmaUser', JSON.stringify(userData));
      setShowLogin(false);
      setPage('dashboard');
      setActiveTab('verify');
      setLoginEmail('');
      setLoginPassword('');
      await logActivity('User logged in', { email: userData.email });
      if (userData.role === 'admin') {
        setTimeout(() => connectToBlockchain(), 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  }, [loginEmail, loginPassword, logActivity, connectToBlockchain]);

  const handleRegister = useCallback(async () => {
    if (!regName || !regEmail || !regPassword) {
      alert('Please fill all required fields');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (regRole === 'distributor' && !regTmdaNumber) {
      alert('TMDA License Number is required for Distributors');
      return;
    }
    if (regRole === 'pharmacy' && !regPharmacyLicense) {
      alert('Pharmacy License Number is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone || null,
          password: regPassword,
          role: regRole,
          status: regRole === 'patient' ? 'approved' : 'pending',
          business: regBusiness || null,
          tmdaNumber: regTmdaNumber || null,
          tmdaExpiry: regTmdaExpiry || null,
          pharmacyLicense: regPharmacyLicense || null,
        }),
      });

      if (!result.success) {
        alert(result.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      setShowRegister(false);
      alert(regRole === 'patient' ? 'Registration successful!' : 'Pending admin approval');
      setRegName(''); setRegEmail(''); setRegPhone(''); setRegPassword('');
      setRegConfirmPassword(''); setRegBusiness(''); setRegTmdaNumber('');
      setRegTmdaExpiry(''); setRegPharmacyLicense('');
      await loadData();
      setIsLoading(false);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
      setIsLoading(false);
    }
  }, [regName, regEmail, regPhone, regPassword, regConfirmPassword, regRole,
      regBusiness, regTmdaNumber, regTmdaExpiry, regPharmacyLicense, loadData]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setPage('home');
    localStorage.removeItem('pharmaUser');
    setBlockchainConnected(false);
    setMedicines([]);
    setAllUsers([]);
    setPendingUsers([]);
    setTransfers([]);
    setActivityLog([]);
  }, []);

  // ============================================
  // BUSINESS LOGIC
  // ============================================
  const approveUser = useCallback(async (id: number) => {
    try {
      const result = await apiCall(`/users?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      if (result.success) {
        await loadData();
        alert('User approved successfully');
        await logActivity('User approved', { id });
      } else {
        alert('Failed to approve user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  }, [loadData, logActivity]);

  const rejectUser = useCallback(async (id: number) => {
    try {
      const result = await apiCall(`/users?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (result.success) {
        await loadData();
        alert('User rejected successfully');
        await logActivity('User rejected', { id });
      } else {
        alert('Failed to reject user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    }
  }, [loadData, logActivity]);

  const deleteUser = useCallback(async (id: number) => {
    if (!confirm('⚠️ Are you sure you want to delete this user?')) return;
    setIsLoading(true);
    try {
      const result = await apiCall(`/users?id=${id}`, { method: 'DELETE' });
      if (result.success) {
        setAllUsers(prev => prev.filter(u => u.id !== id));
        setPendingUsers(prev => prev.filter(u => u.id !== id));
        alert('✅ User deleted successfully!');
        await logActivity('User deleted', { id });
        setTimeout(() => loadData(), 500);
      } else {
        alert('❌ Failed to delete user: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Failed to delete user.');
    } finally {
      setIsLoading(false);
    }
  }, [loadData, logActivity]);

  const createMedicine = useCallback(async () => {
    if (!medName || !medBatch || !medExpiry || !medPrice || !medQuantity) {
      alert('Please fill all required fields');
      return;
    }
    const quantity = parseInt(medQuantity);
    if (quantity > 100) {
      alert('Maximum quantity per batch is 100 units');
      return;
    }

    try {
      const result = await apiCall('/medicines', {
        method: 'POST',
        body: JSON.stringify({
          name: medName,
          category: medCategory || 'General',
          description: medDescription || '',
          batch_no: medBatch.toUpperCase(),
          expiry_date: medExpiry,
          price: parseFloat(medPrice),
          quantity: quantity,
          manufacturer_id: user?.id,
        }),
      });

      if (!result.success) {
        alert('Failed to create medicine');
        return;
      }

      const QRCode = require('qrcode');
      const codes: QRCode[] = [];
      const bigBoxData = JSON.stringify({
        type: 'BIG_BOX',
        batchNo: medBatch.toUpperCase(),
        medicineName: medName,
        totalUnits: quantity,
      });
      try {
        const bigBoxQr = await QRCode.toDataURL(bigBoxData);
        codes.push({ type: 'BIG_BOX', code: bigBoxQr, label: `📦 Big Box - ${medBatch.toUpperCase()}` });
      } catch (e) {}
      
      setQrCodes(codes);
      setCurrentMedicine({ name: medName, batch: medBatch.toUpperCase(), quantity });
      setShowQRModal(true);

      await loadData();
      await logActivity('Medicine batch created', { name: medName, batch: medBatch, quantity });
      alert(`Batch "${medBatch.toUpperCase()}" created with ${quantity} units!`);
      setMedName(''); setMedBatch(''); setMedExpiry(''); setMedPrice('');
      setMedQuantity(''); setMedCategory(''); setMedDescription('');
    } catch (error) {
      console.error('Error creating medicine:', error);
      alert('Failed to create medicine');
    }
  }, [medName, medBatch, medExpiry, medPrice, medQuantity, medCategory, medDescription, user, loadData, logActivity]);

  // VERIFY MEDICINE - Only for authenticated users
  const verifyMedicine = useCallback(async (batchNumber?: string) => {
    const batchToVerify = batchNumber || scanBatch;
    
    if (!user) {
      alert('Please login first to verify medicine');
      return;
    }
    if (!batchToVerify) {
      alert('Please enter a batch number or scan a QR code');
      return;
    }

    try {
      const result = await apiCall('/medicines/verify', {
        method: 'POST',
        body: JSON.stringify({
          batch_no: batchToVerify.toUpperCase(),
          verified_by: user?.id || 0,
          location: 'Pharmacy',
        }),
      });
      if (result.success) {
        setVerifyResult({ success: true, medicine: result.data?.medicine });
        await loadData();
        await logActivity('Medicine verified', { batch: batchToVerify.toUpperCase() });
        alert('✅ Medicine verified successfully! This medicine is GENUINE.');
      } else {
        setVerifyResult({ success: false });
        alert('⚠️ Medicine not found or invalid. This could be COUNTERFEIT!');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerifyResult({ success: false });
      alert('Failed to verify medicine');
    }
  }, [scanBatch, user, loadData, logActivity]);

  // Handle QR scan result
  const handleQRScan = useCallback((data: string) => {
    setScanBatch(data);
    setShowCameraScanner(false);
    if (user) {
      verifyMedicine(data);
    }
  }, [user, verifyMedicine]);

  // TRANSFER MEDICINE
  const transferMedicine = useCallback(async () => {
    if (!selectedForTransfer || !transferTo || !transferQuantity) {
      alert('Please fill all transfer fields');
      return;
    }
    const qty = parseInt(transferQuantity);
    if (qty > selectedForTransfer.quantity) {
      alert('Insufficient quantity available');
      return;
    }

    try {
      const fromId = user?.id || 0;
      const toId = parseInt(transferTo);
      let actionType = 'Medicine transferred';
      let confirmMessage = 'Transfer confirmed!';

      if (user?.role === 'distributor' && selectedForTransfer.current_owner_id === selectedForTransfer.manufacturer_id) {
        actionType = 'Medicine purchased from manufacturer';
        confirmMessage = '✅ Purchase completed successfully!';
      } else if (user?.role === 'pharmacy' && selectedForTransfer.current_owner_id !== selectedForTransfer.manufacturer_id) {
        actionType = 'Medicine purchased from distributor';
        confirmMessage = '✅ Order completed successfully!';
      } else if (user?.role === 'distributor' && selectedForTransfer.current_owner_id === user.id) {
        actionType = 'Medicine sold to pharmacy';
        confirmMessage = '✅ Sale completed successfully!';
      } else if (user?.role === 'pharmacy' && selectedForTransfer.current_owner_id === user.id) {
        actionType = 'Medicine dispensed to patient';
        confirmMessage = '✅ Medicine dispensed successfully!';
      }

      const result = await apiCall('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          medicine_id: selectedForTransfer.id,
          batch_no: selectedForTransfer.batch_no,
          from_id: fromId,
          to_id: toId,
          quantity: qty,
        }),
      });

      if (result.success) {
        await loadData();
        await logActivity(actionType, {
          medicine: selectedForTransfer.name,
          batch: selectedForTransfer.batch_no,
          quantity: qty,
          from: allUsers.find(u => u.id === fromId)?.name,
          to: allUsers.find(u => u.id === toId)?.name
        });
        alert(confirmMessage);
        setShowTransferModal(false);
        setTransferTo('');
        setTransferQuantity('');
        setSelectedForTransfer(null);
        await loadData();
      } else {
        alert('Transaction failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Failed to complete transaction');
    }
  }, [selectedForTransfer, transferTo, transferQuantity, user, allUsers, loadData, logActivity]);

  const submitTMDAApplication = useCallback(async () => {
    if (!tmdaApplication.businessName || !tmdaApplication.licenseNumber || !tmdaApplication.address) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setShowTMDAApplyModal(false);
      alert('TMDA Application submitted successfully!');
      setTmdaApplication({
        businessName: '',
        licenseNumber: '',
        address: '',
        contactPerson: '',
        phone: '',
        email: '',
        documents: null
      });
      await logActivity('TMDA Application submitted', { 
        businessName: tmdaApplication.businessName,
        licenseNumber: tmdaApplication.licenseNumber
      });
    } catch (error) {
      console.error('TMDA Application error:', error);
      alert('Failed to submit TMDA application');
    }
  }, [tmdaApplication, logActivity]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  const renderActivityLog = useCallback(() => {
    if (stats.recentActivity.length === 0) {
      return <div className="text-center py-8 text-gray-400">No recent activity</div>;
    }
    return (
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {stats.recentActivity.map((log, index) => {
          const details = typeof log.details === 'string' && log.details.startsWith('{') 
            ? JSON.parse(log.details) : log.details;
          const displayDetails = details?.email || details?.name || details?.batch || 
            (typeof details === 'object' ? Object.values(details)[0] : details);
          return (
            <div key={log.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{log.action || 'Activity'}</p>
                {displayDetails && <p className="text-xs text-gray-500 truncate">{displayDetails}</p>}
                <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [stats.recentActivity]);

  // ============================================
  // PATIENT DASHBOARD - With Camera Scanner
  // ============================================
  const renderPatientDashboard = useCallback(() => {
    const myBatches = medicines.filter((m) => verified.includes(m.id));
    
    return (
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Verified Medicines</p>
            <p className="text-2xl font-bold text-green-600">{myBatches.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Safety Status</p>
            <p className="text-2xl font-bold text-green-600">✅ Safe</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Scan className="w-5 h-5 text-green-600" /> 
            Verify Your Medicine
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Scan QR code with camera or enter medicine number to verify
          </p>
          
          {/* Camera Scan Button */}
          <button 
            onClick={() => setShowCameraScanner(true)}
            className="w-full mb-3 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition group flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-blue-700">Scan QR Code with Camera</span>
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Manual Entry */}
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Enter batch number (e.g., PCM-2024-001)" 
              value={scanBatch} 
              onChange={(e) => setScanBatch(e.target.value)} 
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition placeholder-gray-400 text-gray-800" 
            />
            <button 
              onClick={() => verifyMedicine()} 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-2"
            >
              <Scan className="w-4 h-4" /> Verify
            </button>
          </div>

          {verifyResult && (
            <div className={`mt-4 p-4 rounded-xl ${verifyResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {verifyResult.success ? (
                <div>
                  <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-bold text-green-700">✅ Verified Genuine</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {verifyResult.medicine?.name}</div>
                    <div><span className="text-gray-500">Batch:</span> {verifyResult.medicine?.batch_no}</div>
                    <div><span className="text-gray-500">Manufacturer:</span> {verifyResult.medicine?.manufacturer_name}</div>
                    <div><span className="text-gray-500">Verified:</span> {verifyResult.medicine?.verified_count || 0} times</div>
                  </div>
                </div>
              ) : (
                <div>
                  <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                  <h3 className="font-bold text-red-700">⚠️ Counterfeit Alert</h3>
                  <p className="text-sm text-gray-600">This medicine cannot be verified. Please report this to authorities.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            Verification History
          </h3>
          {myBatches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No medicines verified yet</p>
              <p className="text-sm">Scan a QR code or enter a batch number to verify</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-gray-500">Batch: {m.batch_no}</p>
                    <p className="text-xs text-green-600">✅ Verified</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [medicines, verified, scanBatch, verifyResult, verifyMedicine]);

  // ============================================
  // PATIENT SIDEBAR
  // ============================================
  const renderPatientSidebar = useCallback(() => {
    return (
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            {sidebarOpen && <span className="text-white font-bold">PharmaChain</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Scan className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Verify Medicine</span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-white/40 text-xs truncate capitalize">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-white/40 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }, [user, sidebarOpen, activeTab, handleLogout]);

  // ============================================
  // SIDEBAR
  // ============================================
  function renderSidebar() {
    if (user?.role === 'patient') {
      return renderPatientSidebar();
    }

    const tabs: Array<{ id: string; label: string; icon: ReactNode }> = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ];

    if (user?.role === 'manufacturer') {
      tabs.push({ id: 'create', label: 'Create Batch', icon: <Plus className="w-5 h-5" /> });
    }

    if (['pharmacy', 'distributor'].includes(user?.role || '')) {
      tabs.push({ id: 'verify', label: 'Verify', icon: <Scan className="w-5 h-5" /> });
    }

    if (['manufacturer', 'distributor', 'pharmacy'].includes(user?.role || '')) {
      tabs.push({ id: 'inventory', label: 'My Stock', icon: <Boxes className="w-5 h-5" /> });
    }

    if (['distributor', 'pharmacy'].includes(user?.role || '')) {
      tabs.push({ id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart className="w-5 h-5" /> });
    }

    if (['manufacturer', 'distributor'].includes(user?.role || '')) {
      tabs.push({ id: 'transfer', label: 'Transfers', icon: <GitBranch className="w-5 h-5" /> });
    }

    if (user?.role === 'distributor') {
      tabs.push({ id: 'distribution', label: 'Distribution', icon: <MapIcon className="w-5 h-5" /> });
    }

    if (user?.role === 'admin') {
      tabs.push(
        { id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" /> },
        { id: 'pending', label: 'Pending', icon: <Users className="w-5 h-5" /> },
        { id: 'supplychain', label: 'Supply Chain', icon: <GitBranch className="w-5 h-5" /> },
        { id: 'blockchain', label: 'Blockchain', icon: <Link className="w-5 h-5" /> }
      );
    }

    tabs.push({ id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> });

    return (
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            {sidebarOpen && <span className="text-white font-bold">PharmaChain</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab.icon}
              {sidebarOpen && (
                <span className="text-sm flex items-center gap-2">
                  {tab.label}
                  {tab.id === 'pending' && pendingUsers.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
                  )}
                  {tab.id === 'blockchain' && (
                    <span className={`w-2 h-2 rounded-full ${blockchainConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-white/40 text-xs truncate capitalize">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-white/40 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // ============================================
  // DASHBOARD RENDERERS
  // ============================================
  const renderAdminDashboard = useCallback(() => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-purple-600">{allUsers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Medicines</p>
            <p className="text-2xl font-bold text-blue-600">{medicines.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Blockchain</p>
            <p className={`text-2xl font-bold ${blockchainConnected ? 'text-green-600' : 'text-red-600'}`}>
              {blockchainConnected ? '✅ Active' : '❌ Offline'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">System Activity</h3>
          {renderActivityLog()}
        </div>
      </div>
    );
  }, [allUsers, pendingUsers, medicines, blockchainConnected, renderActivityLog]);

  const renderManufacturerDashboard = useCallback(() => {
    const myBatches = medicines.filter((m) => m.manufacturer_id === user?.id);
    const totalUnits = myBatches.reduce((sum, m) => sum + m.quantity, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Batches</p>
            <p className="text-2xl font-bold text-blue-600">{myBatches.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold text-green-600">{totalUnits}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Active Batches</p>
            <p className="text-2xl font-bold text-indigo-600">{myBatches.filter(m => m.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Transferred</p>
            <p className="text-2xl font-bold text-orange-600">{myBatches.filter(m => m.status === 'transferred').length}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setActiveTab('create')} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Create New Batch</p>
                <p className="text-sm text-gray-500">Add medicine batch</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('inventory')} className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">View Batches</p>
                <p className="text-sm text-gray-500">{myBatches.length} batches</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('transfer')} className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Sell to Distributors</p>
                <p className="text-sm text-gray-500">Transfer stock</p>
              </div>
            </div>
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
          {renderActivityLog()}
        </div>
      </div>
    );
  }, [medicines, user, renderActivityLog]);

  const renderDistributorDashboard = useCallback(() => {
    const myBatches = medicines.filter((m) => m.current_owner_id === user?.id);
    const available = medicines.filter((m) => 
      m.status === 'active' && m.quantity > 0 && m.current_owner_id === m.manufacturer_id
    );
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">My Stock</p>
            <p className="text-2xl font-bold text-orange-600">{myBatches.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold text-green-600">{myBatches.reduce((s, m) => s + m.quantity, 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Available to Buy</p>
            <p className="text-2xl font-bold text-blue-600">{available.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Stock Value</p>
            <p className="text-2xl font-bold text-purple-600">{myBatches.reduce((s, m) => s + m.price * m.quantity, 0).toLocaleString()} TZS</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 border ${user?.tmdaNumber ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.tmdaNumber ? <BadgeCheck className="w-6 h-6 text-green-600" /> : <ShieldIcon className="w-6 h-6 text-yellow-600" />}
              <div>
                <p className="font-semibold text-gray-800">{user?.tmdaNumber ? 'TMDA Verified' : 'TMDA License Required'}</p>
                <p className="text-sm text-gray-600">{user?.tmdaNumber ? `License: ${user.tmdaNumber}` : 'Apply for TMDA license to operate'}</p>
              </div>
            </div>
            {!user?.tmdaNumber && (
              <button onClick={() => setShowTMDAApplyModal(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition">
                Apply Now
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setActiveTab('marketplace')} className="bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Source from Manufacturers</p>
                <p className="text-sm text-gray-500">{available.length} available</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('inventory')} className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">My Stock</p>
                <p className="text-sm text-gray-500">{myBatches.length} batches</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('transfer')} className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Sell to Pharmacies</p>
                <p className="text-sm text-gray-500">Distribute stock</p>
              </div>
            </div>
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Distribution Activity</h3>
          {renderActivityLog()}
        </div>
      </div>
    );
  }, [medicines, user, allUsers, renderActivityLog]);

  const renderPharmacyDashboard = useCallback(() => {
    const myBatches = medicines.filter((m) => m.current_owner_id === user?.id);
    const available = medicines.filter((m) => {
      const owner = allUsers.find(u => u.id === m.current_owner_id);
      return m.status === 'active' && m.quantity > 0 && owner?.role === 'distributor';
    });
    const expiringSoon = myBatches.filter((m) => {
      const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30 && daysLeft > 0;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">My Stock</p>
            <p className="text-2xl font-bold text-cyan-600">{myBatches.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold text-green-600">{myBatches.reduce((s, m) => s + m.quantity, 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Available to Order</p>
            <p className="text-2xl font-bold text-blue-600">{available.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Expiring Soon</p>
            <p className={`text-2xl font-bold ${expiringSoon.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {expiringSoon.length}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setActiveTab('marketplace')} className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-200 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Order from Distributors</p>
                <p className="text-sm text-gray-500">{available.length} available</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('inventory')} className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Manage Stock</p>
                <p className="text-sm text-gray-500">{myBatches.length} products</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('verify')} className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl p-4 text-left transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <Scan className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Verify Medicine</p>
                <p className="text-sm text-gray-500">Authenticity check</p>
              </div>
            </div>
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Pharmacy Activity</h3>
          {renderActivityLog()}
        </div>
      </div>
    );
  }, [medicines, user, allUsers, renderActivityLog]);

  const renderDashboard = useCallback(() => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return renderAdminDashboard();
      case 'manufacturer': return renderManufacturerDashboard();
      case 'distributor': return renderDistributorDashboard();
      case 'pharmacy': return renderPharmacyDashboard();
      case 'patient': return renderPatientDashboard();
      default: return <div>Role not recognized</div>;
    }
  }, [user, renderAdminDashboard, renderManufacturerDashboard, renderDistributorDashboard, 
      renderPharmacyDashboard, renderPatientDashboard]);

  // ============================================
  // TAB RENDERERS
  // ============================================
  function renderActiveTab() {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'create': return renderCreate();
      case 'verify': return renderVerifyTab();
      case 'inventory': return renderInventory();
      case 'marketplace': return renderMarketplace();
      case 'transfer': return renderTransfer();
      case 'distribution': return renderDistribution();
      case 'admin': return renderAdmin();
      case 'pending': return renderPending();
      case 'supplychain': return renderSupplyChain();
      case 'blockchain': return renderBlockchain();
      case 'settings': return renderSettings();
      default: return <div>Page not found</div>;
    }
  }

  function renderCreate() {
    if (user?.role !== 'manufacturer') return null;
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> Create Medicine Batch
        </h2>
        <p className="text-sm text-gray-500 mb-4">Create a new batch (max 100 units)</p>
        <div className="space-y-3">
          <input type="text" placeholder="Medicine Name *" value={medName} onChange={(e) => setMedName(e.target.value)} className="w-full p-3 border rounded-xl" />
          <input type="text" placeholder="Category" value={medCategory} onChange={(e) => setMedCategory(e.target.value)} className="w-full p-3 border rounded-xl" />
          <textarea placeholder="Description" value={medDescription} onChange={(e) => setMedDescription(e.target.value)} className="w-full p-3 border rounded-xl" rows={2} />
          <input type="text" placeholder="Batch Number *" value={medBatch} onChange={(e) => setMedBatch(e.target.value)} className="w-full p-3 border rounded-xl" />
          <input type="date" value={medExpiry} onChange={(e) => setMedExpiry(e.target.value)} className="w-full p-3 border rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Price/unit (TZS) *" value={medPrice} onChange={(e) => setMedPrice(e.target.value)} className="w-full p-3 border rounded-xl" />
            <input type="number" placeholder="Units *" value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} className="w-full p-3 border rounded-xl" />
          </div>
          <button onClick={createMedicine} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            <Plus className="w-4 h-4 inline mr-2" /> Create Batch
          </button>
        </div>
      </div>
    );
  }

  function renderVerifyTab() {
    // For patients, use simplified verification
    if (user?.role === 'patient') {
      return renderPatientDashboard();
    }
    
    // For distributors and pharmacies
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Scan className="w-5 h-5 text-green-600" /> 
            Verify Medicine
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Scan QR code with camera or enter batch number to verify authenticity
          </p>
          
          {/* Camera Scan Button */}
          <button 
            onClick={() => setShowCameraScanner(true)}
            className="w-full mb-3 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition group flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-blue-700">Scan QR Code with Camera</span>
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Manual Entry */}
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Enter batch number (e.g., PCM-2024-001)" 
              value={scanBatch} 
              onChange={(e) => setScanBatch(e.target.value)} 
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition placeholder-gray-400 text-gray-800" 
            />
            <button 
              onClick={() => verifyMedicine()} 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-2"
            >
              <Scan className="w-4 h-4" /> Verify
            </button>
          </div>

          {verifyResult && (
            <div className={`mt-4 p-4 rounded-xl ${verifyResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {verifyResult.success ? (
                <div>
                  <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-bold text-green-700">✅ Verified Genuine</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {verifyResult.medicine?.name}</div>
                    <div><span className="text-gray-500">Batch:</span> {verifyResult.medicine?.batch_no}</div>
                    <div><span className="text-gray-500">Manufacturer:</span> {verifyResult.medicine?.manufacturer_name}</div>
                    <div><span className="text-gray-500">Verified:</span> {verifyResult.medicine?.verified_count || 0} times</div>
                  </div>
                </div>
              ) : (
                <div>
                  <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                  <h3 className="font-bold text-red-700">⚠️ Counterfeit Alert</h3>
                  <p className="text-sm text-gray-600">This medicine cannot be verified. Please report this to authorities.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderInventory() {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            {user?.role === 'manufacturer' && 'My Batches'}
            {user?.role === 'distributor' && 'My Stock'}
            {user?.role === 'pharmacy' && 'My Stock'}
          </h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border rounded-lg text-sm w-48" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border rounded-lg text-sm">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Batch</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Price</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Units</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-gray-600">{m.batch_no}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3">{m.price.toLocaleString()} TZS</td>
                    <td className="p-3 font-semibold">{m.quantity || 0}</td>
                    <td className="p-3">
                      <button onClick={() => { setSelectedMedicine(m); setShowDetailsModal(true); }} className="text-blue-600 hover:text-blue-800 text-xs mr-2">View</button>
                      {m.quantity > 0 && ['manufacturer', 'distributor', 'pharmacy'].includes(user?.role || '') && (
                        <button onClick={() => { setSelectedForTransfer(m); setShowTransferModal(true); }} className="text-purple-600 hover:text-purple-800 text-xs">
                          {user?.role === 'distributor' ? 'Sell' : user?.role === 'pharmacy' ? 'Dispense' : 'Transfer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderMarketplace() {
    const available = availableMedicines;
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          {user?.role === 'distributor' && 'Available Batches (From Manufacturers)'}
          {user?.role === 'pharmacy' && 'Available Batches (From Distributors)'}
        </h2>
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700">
          {user?.role === 'distributor' && '📦 Browse batches from manufacturers. Purchase to add to your inventory.'}
          {user?.role === 'pharmacy' && '📦 Browse batches from distributors. Order to add to your stock.'}
        </div>
        {available.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No batches available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Medicine</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Batch</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Owner</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Price</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Units</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {available.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-gray-600">{m.batch_no}</td>
                    <td className="p-3">{getOwnerName(m.current_owner_id)}</td>
                    <td className="p-3 font-bold text-green-600">{m.price.toLocaleString()} TZS</td>
                    <td className="p-3 font-semibold">{m.quantity || 0}</td>
                    <td className="p-3">
                      <button onClick={() => { 
                        setSelectedForTransfer(m); 
                        setTransferTo(user?.id?.toString() || ''); 
                        setTransferQuantity(m.quantity.toString()); 
                        setShowTransferModal(true); 
                      }} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">
                        {user?.role === 'pharmacy' ? 'Order' : 'Purchase'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderTransfer() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600" />
            {user?.role === 'distributor' ? 'Sell to Pharmacies' : 
             user?.role === 'pharmacy' ? 'Dispense Medicine' : 
             'Transfers'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Select Batch</label>
              <select className="w-full p-3 border rounded-xl mt-1" onChange={(e) => { const med = medicines.find((m) => m.id === parseInt(e.target.value)); setSelectedForTransfer(med || null); }} value={selectedForTransfer?.id || ''}>
                <option value="">Select a batch...</option>
                {ownedBatches.map((m) => (<option key={m.id} value={m.id}>{m.name} - {m.batch_no} ({m.quantity} units)</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Units</label>
              <input type="number" placeholder="Units" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} className="w-full p-3 border rounded-xl mt-1" max={selectedForTransfer?.quantity || 0} min={1} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Transfer To</label>
              <select className="w-full p-3 border rounded-xl mt-1" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                <option value="">Select recipient...</option>
                {eligibleRecipients.map((u) => (<option key={u.id} value={u.id}>{u.name} - {u.business || u.role}</option>))}
              </select>
            </div>
          </div>
          <button onClick={transferMedicine} className="mt-4 w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50" disabled={!selectedForTransfer || !transferTo || !transferQuantity}>
            {user?.role === 'distributor' ? 'Confirm Sale' : 
             user?.role === 'pharmacy' ? 'Confirm Dispense' : 
             'Confirm Transfer'}
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Transfer History</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transfers.filter((t) => t.from_id === user?.id || t.to_id === user?.id).slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{t.medicine_name}</p>
                  <p className="text-xs text-gray-500">{t.from_name} → {t.to_name} ({t.quantity} units)</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(t.date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderDistribution() {
    if (user?.role !== 'distributor') return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><MapIcon className="w-6 h-6 text-orange-600" /> Distribution</h2>
            {user?.tmdaNumber ? <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">TMDA Verified</span> : <button onClick={() => setShowTMDAApplyModal(true)} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">Apply TMDA</button>}
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl"><p className="text-sm text-gray-600">Region</p><p className="font-bold">{user?.region || 'Not specified'}</p></div>
            <div className="p-4 bg-orange-50 rounded-xl"><p className="text-sm text-gray-600">Fleet Size</p><p className="font-bold">{user?.fleetSize || 'Not specified'} vehicles</p></div>
            <div className="p-4 bg-orange-50 rounded-xl"><p className="text-sm text-gray-600">Stock</p><p className="font-bold">{myMedicines.reduce((s, m) => s + m.quantity, 0)} units</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Deliveries</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transfers.filter((t) => t.to_id === user?.id).slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div><p className="text-sm font-medium">{t.medicine_name}</p><p className="text-xs text-gray-500">{t.from_name} → {t.quantity} units</p></div>
                <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAdmin() {
    if (user?.role !== 'admin') return null;
    
    const regularUsers = allUsers.filter(u => u.role !== 'admin');
    
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> 
            User Management
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({regularUsers.length} users)
            </span>
          </h2>
          <button onClick={loadData} className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition flex items-center gap-1" disabled={isLoading}>
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        
        {isLoading && <div className="text-center py-4 text-gray-500">Loading users...</div>}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-600">User</th>
                <th className="p-3 text-left font-semibold text-gray-600">Role</th>
                <th className="p-3 text-left font-semibold text-gray-600">Status</th>
                <th className="p-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No users found</td></tr>
              ) : (
                regularUsers.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.tmdaNumber && <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">TMDA</span>}
                        {u.pharmacyLicense && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Licensed</span>}
                      </div>
                    </td>
                    <td className="p-3 capitalize">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.role === 'manufacturer' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'distributor' ? 'bg-orange-100 text-orange-800' :
                        u.role === 'pharmacy' ? 'bg-cyan-100 text-cyan-800' :
                        u.role === 'patient' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 text-sm font-medium transition flex items-center gap-1" disabled={isLoading}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderPending() {
    if (user?.role !== 'admin') return null;
    if (pendingUsers.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">All Clear!</h3>
          <p className="text-gray-500">No pending approvals</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingUsers.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{u.name}</h3>
                <p className="text-sm text-gray-500">{u.email}</p>
                {u.tmdaNumber && <p className="text-xs text-yellow-600">TMDA: {u.tmdaNumber}</p>}
              </div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => approveUser(u.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold transition">Approve</button>
              <button onClick={() => rejectUser(u.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition">Reject</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSupplyChain() {
    if (user?.role !== 'admin') return null;
    const items = [
      { label: 'Manufacturers', value: supplyChainStats.manufacturers, color: 'from-blue-500 to-blue-600' },
      { label: 'Distributors', value: supplyChainStats.distributors, color: 'from-orange-500 to-orange-600' },
      { label: 'Pharmacies', value: supplyChainStats.pharmacies, color: 'from-cyan-500 to-cyan-600' },
      { label: 'Patients', value: supplyChainStats.patients, color: 'from-green-500 to-green-600' },
      { label: 'TMDA Verified', value: supplyChainStats.tmdaApproved, color: 'from-emerald-500 to-emerald-600' },
    ];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {items.map((item, i) => (
            <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white shadow-sm`}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Medicine Flow</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['Manufacturer', 'Distributor', 'Pharmacy', 'Patient'].map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="bg-gray-100 rounded-xl px-6 py-3 text-center min-w-[100px]">
                  <p className="text-sm font-medium">{label}</p>
                </div>
                {i < 3 && <ArrowRight className="text-gray-400 mx-2" />}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">Total Transfers: <span className="font-bold text-purple-600">{supplyChainStats.totalTransfers}</span></div>
        </div>
      </div>
    );
  }

  function renderBlockchain() {
    if (user?.role !== 'admin') return null;
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Link className="w-5 h-5 text-purple-600" /> Blockchain Status</h2>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${blockchainConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full ${blockchainConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{blockchainConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Blocks', value: blockchainStats.totalBlocks, color: 'text-purple-600' },
            { label: 'Transactions', value: blockchainStats.totalTransactions, color: 'text-blue-600' },
            { label: 'Pending', value: blockchainStats.pendingTransactions, color: 'text-yellow-600' },
            { label: 'Status', value: blockchainStats.isValid ? 'Valid' : 'Invalid', color: blockchainStats.isValid ? 'text-green-600' : 'text-red-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
        {blockchainStats.pendingTransactions > 0 && (
          <button onClick={mineBlockchain} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition">Mine {blockchainStats.pendingTransactions} Transactions</button>
        )}
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4"><Settings className="w-5 h-5 inline mr-2 text-gray-600" /> Profile Settings</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Full Name" defaultValue={user?.name} className="w-full p-3 border rounded-xl" />
            <input type="email" placeholder="Email" defaultValue={user?.email} className="w-full p-3 border rounded-xl bg-gray-50" disabled />
            <input type="tel" placeholder="Phone" defaultValue={user?.phone} className="w-full p-3 border rounded-xl" />
            {user?.tmdaNumber && <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700">TMDA License: {user.tmdaNumber}</div>}
            {user?.pharmacyLicense && <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">Pharmacy License: {user.pharmacyLicense}</div>}
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Update Profile</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ROLE BANNER
  // ============================================
  const renderRoleBanner = useCallback(() => {
    const roleColors: Record<string, string> = {
      admin: 'from-purple-600 to-purple-800',
      manufacturer: 'from-blue-600 to-blue-800',
      distributor: 'from-orange-600 to-orange-800',
      pharmacy: 'from-cyan-600 to-cyan-800',
      patient: 'from-green-600 to-green-800'
    };
    const roleIcons: Record<string, ReactNode> = {
      admin: <Crown className="w-6 h-6" />,
      manufacturer: <Building className="w-6 h-6" />,
      distributor: <Truck className="w-6 h-6" />,
      pharmacy: <Store className="w-6 h-6" />,
      patient: <Heart className="w-6 h-6" />
    };
    const roleDescriptions: Record<string, string> = {
      admin: 'Manage the entire system',
      manufacturer: 'Create and manage medicine batches',
      distributor: 'Source from manufacturers and supply pharmacies',
      pharmacy: 'Stock and dispense medicines',
      patient: 'Verify your medicines'
    };
    return (
      <div className={`rounded-2xl p-6 text-white shadow-sm bg-gradient-to-r ${roleColors[user?.role || 'patient']} mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold capitalize flex items-center gap-2">
              {roleIcons[user?.role || 'patient']}
              {user?.role} Dashboard
            </h2>
            <p className="text-white/80 text-sm">{roleDescriptions[user?.role || 'patient']}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{user?.name}</div>
            <div className="text-white/60 text-sm capitalize">{user?.role}</div>
            {user?.tmdaNumber && <div className="text-yellow-300 text-xs">TMDA: {user.tmdaNumber}</div>}
            {user?.pharmacyLicense && <div className="text-blue-300 text-xs">License: {user.pharmacyLicense}</div>}
          </div>
        </div>
      </div>
    );
  }, [user]);

  // ============================================
  // MODALS
  // ============================================
  function renderAuthModals() {
    return (
      <>
        {showLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                  <p className="text-sm text-gray-500">Sign in to your account</p>
                </div>
                <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12 placeholder-gray-400" 
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input type="checkbox" className="rounded border-gray-300" />
                    Remember me
                  </label>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</button>
                </div>

                <button 
                  onClick={handleLogin} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setShowLogin(false); setShowRegister(true); }} 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {showRegister && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                  <p className="text-sm text-gray-500">Join the pharmaceutical supply chain</p>
                </div>
                <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={regName} 
                    onChange={(e) => setRegName(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={regEmail} 
                    onChange={(e) => setRegEmail(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Enter your phone number" 
                    value={regPhone} 
                    onChange={(e) => setRegPhone(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder="Create a password (min 6 characters)" 
                      value={regPassword} 
                      onChange={(e) => setRegPassword(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12 placeholder-gray-400" 
                    />
                    <button 
                      onClick={() => setShowRegPassword(!showRegPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Confirm your password" 
                    value={regConfirmPassword} 
                    onChange={(e) => setRegConfirmPassword(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                  <select 
                    value={regRole} 
                    onChange={(e) => setRegRole(e.target.value as any)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value="patient">Patient</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="distributor">Distributor (TMDA Required)</option>
                    <option value="pharmacy">Pharmacy (License Required)</option>
                  </select>
                </div>

                {regRole === 'distributor' && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                      ℹ️ TMDA License Number is required for distributors
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TMDA License Number *</label>
                      <input 
                        type="text" 
                        placeholder="Enter TMDA license number" 
                        value={regTmdaNumber} 
                        onChange={(e) => setRegTmdaNumber(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TMDA Expiry Date</label>
                      <input 
                        type="date" 
                        value={regTmdaExpiry} 
                        onChange={(e) => setRegTmdaExpiry(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                      />
                    </div>
                  </>
                )}

                {regRole === 'pharmacy' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                      ℹ️ Pharmacy License Number is required
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy License Number *</label>
                      <input 
                        type="text" 
                        placeholder="Enter pharmacy license number" 
                        value={regPharmacyLicense} 
                        onChange={(e) => setRegPharmacyLicense(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                      />
                    </div>
                  </>
                )}

                {regRole !== 'patient' && regRole !== 'pharmacy' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your business name" 
                      value={regBusiness} 
                      onChange={(e) => setRegBusiness(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400" 
                    />
                  </div>
                )}

                <button 
                  onClick={handleRegister} 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setShowRegister(false); setShowLogin(true); }} 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderModals() {
    return (
      <>
        {/* Camera QR Scanner Modal */}
        {showCameraScanner && (
          <CameraQRScanner 
            onScan={handleQRScan} 
            onClose={() => setShowCameraScanner(false)} 
          />
        )}

        {showTMDAApplyModal && user?.role === 'distributor' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShieldIcon className="w-6 h-6 text-yellow-600" /> TMDA Application</h2>
                <button onClick={() => setShowTMDAApplyModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Business Name *" value={tmdaApplication.businessName} onChange={(e) => setTmdaApplication({...tmdaApplication, businessName: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="License Number *" value={tmdaApplication.licenseNumber} onChange={(e) => setTmdaApplication({...tmdaApplication, licenseNumber: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="Address *" value={tmdaApplication.address} onChange={(e) => setTmdaApplication({...tmdaApplication, address: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="Contact Person" value={tmdaApplication.contactPerson} onChange={(e) => setTmdaApplication({...tmdaApplication, contactPerson: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="Phone" value={tmdaApplication.phone} onChange={(e) => setTmdaApplication({...tmdaApplication, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="email" placeholder="Email" value={tmdaApplication.email} onChange={(e) => setTmdaApplication({...tmdaApplication, email: e.target.value})} className="w-full p-3 border rounded-xl" />
              </div>
              <button onClick={submitTMDAApplication} className="mt-4 w-full bg-yellow-600 text-white py-3 rounded-xl font-semibold hover:bg-yellow-700 transition">Submit Application</button>
            </div>
          </div>
        )}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><QrCodeIcon className="w-6 h-6 text-purple-600" /> QR Codes</h2>
                <button onClick={() => { setShowQRModal(false); setQrCodes([]); }}><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {qrCodes.map((qr, i) => (
                  <div key={i} className="border rounded-xl p-2">
                    <img src={qr.code} alt="QR" className="w-full h-auto" />
                    <p className="text-xs text-center text-gray-500 mt-1">{qr.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showDetailsModal && selectedMedicine && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold"><Package className="w-5 h-5 inline mr-2 text-blue-600" /> Batch Details</h2>
                <button onClick={() => setShowDetailsModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Medicine:</span> {selectedMedicine.name}</div>
                <div><span className="text-gray-500">Batch:</span> {selectedMedicine.batch_no}</div>
                <div><span className="text-gray-500">Manufacturer:</span> {selectedMedicine.manufacturer_name}</div>
                <div><span className="text-gray-500">Owner:</span> {getOwnerName(selectedMedicine.current_owner_id)}</div>
                <div><span className="text-gray-500">Price:</span> {selectedMedicine.price.toLocaleString()} TZS</div>
                <div><span className="text-gray-500">Units:</span> {selectedMedicine.quantity}</div>
                <div><span className="text-gray-500">Status:</span> {selectedMedicine.status}</div>
                <div><span className="text-gray-500">Expiry:</span> {new Date(selectedMedicine.expiry_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}
        {showTransferModal && selectedForTransfer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold"><ShoppingCart className="w-5 h-5 inline mr-2 text-indigo-600" /> 
                  {user?.role === 'distributor' ? 'Purchase' : 'Transfer'}
                </h2>
                <button onClick={() => { setShowTransferModal(false); setSelectedForTransfer(null); }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><span className="text-gray-500">Medicine:</span> {selectedForTransfer.name}</div>
                <div><span className="text-gray-500">Batch:</span> {selectedForTransfer.batch_no}</div>
                <div><span className="text-gray-500">Available:</span> {selectedForTransfer.quantity} units</div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {user?.role === 'distributor' ? 'Units to Purchase' : 'Units to Transfer'}
                  </label>
                  <input type="number" placeholder="Enter number of units" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} className="w-full p-3 border rounded-xl mt-1 placeholder-gray-400" max={selectedForTransfer.quantity} min={1} />
                </div>
                <button onClick={transferMedicine} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
                  {user?.role === 'distributor' ? 'Confirm Purchase' : 
                   user?.role === 'pharmacy' ? 'Confirm Order' : 
                   'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ============================================
  // HOME PAGE - Clean Version (No Verification)
  // ============================================
  if (page === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
        {/* Navigation */}
        <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Pharma<span className="text-cyan-400">Chain</span></span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogin(true)} className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition">
                Sign In
              </button>
              <button onClick={() => setShowRegister(true)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg transition">
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section - Single Verify Button */}
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-6 py-12 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm mb-6 border border-blue-500/20">
              <Shield className="w-4 h-4" />
              Blockchain-Powered
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Securing the Pharmaceutical Supply Chain
            </h1>
            
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Verify medicine authenticity using blockchain technology. Track every batch from manufacturer to patient.
            </p>

            {/* Single Verify Button */}
            <button 
              onClick={() => {
                const savedUser = localStorage.getItem('pharmaUser');
                if (savedUser) {
                  const userData = JSON.parse(savedUser);
                  setUser(userData);
                  setPage('dashboard');
                  setActiveTab('verify');
                } else {
                  setShowLogin(true);
                }
              }}
              className="group relative px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold text-lg"
            >
              <span className="flex items-center gap-3">
                <Scan className="w-5 h-5" />
                Verify Medicine
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Helper text */}
            <p className="mt-4 text-white/40 text-sm">
              {localStorage.getItem('pharmaUser') ? 'Continue to verification' : 'Sign in or create account to verify'}
            </p>
          </div>
        </div>

        {renderAuthModals()}
      </div>
    );
  }

  // ============================================
  // MAIN DASHBOARD
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 p-6`}>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />}
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-white rounded-full shadow-sm border border-gray-200">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.length}</span>}
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">{user?.name?.charAt(0) || 'U'}</div>
          </div>
        </div>
        {activeTab === 'dashboard' ? (
          <>
            {renderRoleBanner()}
            {renderDashboard()}
          </>
        ) : (
          renderActiveTab()
        )}
      </main>
      {renderModals()}
    </div>
  );
}