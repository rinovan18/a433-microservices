// Memuat konfigurasi environment variable dari file .env (PORT, AMQP_URL)
require('dotenv').config()

// Import framework Express.js untuk membuat REST API server
const express = require("express");
const app = express();

// Import body-parser agar Express bisa membaca data JSON dari request body
const bp = require("body-parser");
app.use(bp.json());

// Import library amqplib untuk berkomunikasi dengan RabbitMQ (message broker)
const amqp = require("amqplib");
// Ambil URL koneksi RabbitMQ dari environment variable
const amqpServer = process.env.AMQP_URL;
// Variabel global untuk menyimpan channel dan koneksi RabbitMQ
var channel, connection;

// Panggil fungsi untuk koneksi ke RabbitMQ saat aplikasi pertama kali dijalankan
connectToQueue();

/**
 * Fungsi untuk membuat koneksi ke RabbitMQ dan membuka channel
 * Assert queue "order" agar queue tersedia untuk menerima pesan
 */
async function connectToQueue() {
    // Buat koneksi ke RabbitMQ server
    connection = await amqp.connect(amqpServer);
    // Buat channel komunikasi di dalam koneksi yang sudah terbuka
    channel = await connection.createChannel();
    try {
        // Nama antrian (queue) yang akan digunakan
        const queue = "order";
        // Assert queue: jika belum ada, akan dibuat; jika sudah ada, tidak akan diduplikasi
        await channel.assertQueue(queue);
        console.log("Connected to the queue!")
    } catch (ex) {
        console.error(ex);
    }
}

// Endpoint POST /order untuk menerima pesanan baru dari client
app.post("/order", (req, res) => {
    // Ambil data order dari body request
    const { order } = req.body;
    // Panggil fungsi createOrder untuk mengirim order ke antrian RabbitMQ
    createOrder(order);
    // Kirim balik data order sebagai response ke client
    res.send(order);
});

/**
 * Fungsi untuk mengirim data order ke antrian "order" di RabbitMQ
 * Shipping-service nantinya akan membaca (consume) dari antrian ini
 */
const createOrder = async order => {
    // Nama antrian yang dituju
    const queue = "order";
    // Kirim order ke antrian dalam bentuk Buffer (JSON string)
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(order)));
    console.log("Order succesfully created!")
    // Tangani sinyal SIGINT (Ctrl+C) untuk menutup koneksi dengan rapi
    process.once('SIGINT', async () => { 
        console.log('got sigint, closing connection');
        await channel.close();
        await connection.close(); 
        process.exit(0);
    });
};

// Jalankan server Express di port yang ditentukan di environment variable
app.listen(process.env.PORT, () => {
    console.log(`Server running at ${process.env.PORT}`);
});
