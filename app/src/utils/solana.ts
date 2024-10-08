import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction, 
  Keypair 
} from '@solana/web3.js';

// Tip tanımlamaları
interface MessageSchema {
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  [key: string]: any;
}

interface DeviceSchema {
  id: string;
  type: string;
  status: string;
  lastUpdate: number;
  [key: string]: any;
}

interface ConnectionConfig {
  endpoint: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

// Özel hata sınıfı
class SolanaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolanaError';
  }
}

// Global değişkenler
let connection: Connection;
let programId: PublicKey;
let payer: Keypair;

// Bağlantı yapılandırması
const defaultConfig: ConnectionConfig = {
  endpoint: 'https://api.devnet.solana.com',
  commitment: 'confirmed'
};

/**
 * Solana ağına bağlantıyı kurar
 * @param config Bağlantı yapılandırması (opsiyonel)
 */
export const baglantiyiKur = (config: ConnectionConfig = defaultConfig): void => {
  try {
    connection = new Connection(config.endpoint, {
      commitment: config.commitment
    });
    console.log('Solana ağına bağlantı kuruldu');
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Bağlantı hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir bağlantı hatası oluştu');
  }
};

/**
 * Mesaj göndermek için kullanılan fonksiyon
 * @param alici Alıcının public key'i
 * @param mesaj Gönderilecek mesaj
 * @returns Promise<void>
 */
export const mesajGonder = async (alici: PublicKey, mesaj: string): Promise<void> => {
  try {
    if (!connection) {
      throw new SolanaError('Bağlantı kurulmamış');
    }

    const messageData: MessageSchema = {
      sender: payer.publicKey.toString(),
      recipient: alici.toString(),
      content: mesaj,
      timestamp: Date.now()
    };

    const instruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: alici,
      lamports: 0
    });

    const transaction = new Transaction().add(instruction);
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer]
    );

    console.log('Mesaj gönderildi, imza:', signature);
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Mesaj gönderme hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir mesaj gönderme hatası oluştu');
  }
};

/**
 * Kaydedilmiş mesajları getirir
 * @returns Promise<string[]> Mesaj listesi
 */
export const mesajlariAl = async (): Promise<string[]> => {
  try {
    if (!connection) {
      throw new SolanaError('Bağlantı kurulmamış');
    }

    const messages: string[] = [];
    const accountInfo = await connection.getProgramAccounts(programId);
    
    for (const account of accountInfo) {
      const messageData = account.account.data;
      if (messageData) {
        messages.push(messageData.toString());
      }
    }

    return messages;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Mesajları alma hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir mesaj alma hatası oluştu');
  }
};

/**
 * Yeni bir IoT cihazı kaydeder
 * @param cihazTipi Kaydedilecek cihazın tipi
 * @returns Promise<void>
 */
export const cihazKaydet = async (cihazTipi: string): Promise<void> => {
  try {
    if (!connection) {
      throw new SolanaError('Bağlantı kurulmamış');
    }

    const deviceData: DeviceSchema = {
      id: Keypair.generate().publicKey.toString(),
      type: cihazTipi,
      status: 'active',
      lastUpdate: Date.now()
    };

    const instruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: programId,
      lamports: 0
    });

    const transaction = new Transaction().add(instruction);
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer]
    );

    console.log('Cihaz kaydedildi, imza:', signature);
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Cihaz kaydetme hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir cihaz kaydetme hatası oluştu');
  }
};

/**
 * Kayıtlı cihazları getirir
 * @returns Promise<DeviceSchema[]> Cihaz listesi
 */
export const cihazlariGetir = async (): Promise<DeviceSchema[]> => {
  try {
    if (!connection) {
      throw new SolanaError('Bağlantı kurulmamış');
    }

    const devices: DeviceSchema[] = [];
    const accountInfo = await connection.getProgramAccounts(programId);
    
    for (const account of accountInfo) {
      const deviceData = account.account.data;
      if (deviceData) {
        const device: DeviceSchema = JSON.parse(deviceData.toString());
        devices.push(device);
      }
    }

    return devices;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Cihazları getirme hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir cihaz getirme hatası oluştu');
  }
};

/**
 * Program ID'sini ayarlar
 * @param id Program ID'si
 */
export const setProgramId = (id: string): void => {
  try {
    programId = new PublicKey(id);
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new SolanaError(`Program ID ayarlama hatası: ${error.message}`);
    }
    throw new SolanaError('Bilinmeyen bir Program ID ayarlama hatası oluştu');
  }
};

/**
 * Ödeme yapacak hesabı ayarlar
 * @param keypair Ödeme yapacak hesabın keypair'i
 */
export const setPayerAccount = (keypair: Keypair): void => {
  payer = keypair;
};

export async function cihazlariAl(): Promise<string[]> {
  // Örnek olarak bazı cihaz isimleri döndürüyoruz
  return ['Sensor 1', 'Sensor 2', 'Sensor 3'];
}