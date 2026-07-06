-- Users table 
CREATE TABLE users ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT NOT NULL, 
  email TEXT UNIQUE NOT NULL, 
  phone TEXT, 
  password TEXT NOT NULL, 
  role TEXT CHECK(role IN ('admin', 'manufacturer', 'wholesaler', 'distributor', 'pharmacy', 'patient')) NOT NULL, 
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending', 
  license TEXT, 
  business TEXT, 
  security_question TEXT, 
  security_answer TEXT, 
  warehouse TEXT, 
  storage_capacity TEXT, 
  region TEXT, 
  fleet_size TEXT, 
  wallet_address TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
); 
