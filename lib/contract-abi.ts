export const PharmaChainABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_batchNo", "type": "string" },
      { "internalType": "uint256", "name": "_expiryDate", "type": "uint256" },
      { "internalType": "uint256", "name": "_price", "type": "uint256" }
    ],
    "name": "createMedicine",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_medicineId", "type": "uint256" }
    ],
    "name": "verifyMedicine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_medicineId", "type": "uint256" },
      { "internalType": "string", "name": "_patientName", "type": "string" }
    ],
    "name": "dispenseMedicine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_medicineId", "type": "uint256" }],
    "name": "getMedicine",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "batchNo", "type": "string" },
      { "internalType": "uint256", "name": "expiryDate", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "address", "name": "manufacturer", "type": "address" },
      { "internalType": "string", "name": "status", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "medicineCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "batchNo", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "MedicineCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "medicineId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "MedicineVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "medicineId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "dispenser", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "patientName", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "MedicineDispensed",
    "type": "event"
  }
] as const;