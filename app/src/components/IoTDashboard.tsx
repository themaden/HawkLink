import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { mesajGonder, cihazKaydet, baglantiyiKur, mesajlariAl, cihazlariAl } from '../utils/solana';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
  }[];
}

export default function IoTDashboard() {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: 'Sensor Data',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });

  useEffect(() => {
    baglantiyiKur();
    fetchMessages();
    fetchDevices();
  }, []);

  const fetchMessages = async () => {
    try {
      const receivedMessages = await mesajlariAl();
      setMessages(receivedMessages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus(`Error: Messages could not be retrieved - ${error.message}`);
      } else {
        setStatus('Error: Messages could not be retrieved - unknown error');
      }
    }
  };

  const fetchDevices = async () => {
    try {
      const fetchedDevices = await cihazlariAl();
      setDevices(fetchedDevices);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus(`Error: Devices could not be retrieved - ${error.message}`);
      } else {
        setStatus('Error: Devices could not be retrieved - unknown error');
      }
    }
  };

  const handleSendMessage = async () => {
    try {
      await mesajGonder(new PublicKey(recipient), message);
      setStatus('Message sent successfully.');
      setMessage('');
      setRecipient('');
      fetchMessages();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Error: unknown error occurred');
      }
    }
  };

  const handleRegisterDevice = async () => {
    try {
      await cihazKaydet(deviceType);
      setStatus('Device registered successfully.');
      setDeviceType('');
      fetchDevices();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Error: unknown error occurred');
      }
    }
  };

  const handleDeviceSelect = (device: string) => {
    setSelectedDevice(device);
    // Simulating sensor data for the selected device
    const labels = Array.from({ length: 10 }, (_, i) => i.toString());
    const data = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
    setChartData({
      labels,
      datasets: [
        {
          label: `${device} Data`,
          data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">IoT Control Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Send Message</h2>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            className="w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient Public Key"
            className="w-full p-2 mb-2 border rounded"
          />
          <button
            onClick={handleSendMessage}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200"
          >
            Send Message
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Register Device</h2>
          <input
            type="text"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            placeholder="Device Type"
            className="w-full p-2 mb-2 border rounded"
          />
          <button
            onClick={handleRegisterDevice}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-200"
          >
            Register Device
          </button>
        </div>
      </div>

      {status && (
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          {status}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
          {messages.length > 0 ? (
            <ul className="list-disc pl-5">
              {messages.map((msg, index) => (
                <li key={index} className="mb-2">{msg}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No messages yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Devices</h2>
          <ul className="list-disc pl-5">
            {devices.map((device) => (
              <li
                key={device}
                className="mb-2 cursor-pointer text-blue-500 hover:underline"
                onClick={() => handleDeviceSelect(device)}
              >
                {device}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Sensor Data</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}
