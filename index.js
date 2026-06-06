// Memuat konfigurasi environment variable dari file .env (PORT, AMQP_URL)
require('dotenv').config()

// Import framework Express.js untuk membuat REST API server
const express = require("express");
const app = express();

// Import body-parser agar Express bisa membaca data JSON dari request body
const bp = require("body-parser");

// Import library amqplib untuk berkomunikasi dengan RabbitMQ (message broker)
const amqp = require("amqplib");
// Ambil URL koneksi RabbitMQ dari environment variable
const amqpServer = process.env.AMQP_URL;
// Variabel global untuk menyimpan channel dan koneksi RabbitMQ
var channel, connection;

// Panggil fungsi untuk koneksi ke RabbitMQ saat aplikasi pertama kali dijalankan
connectToQueue();

/**
 * Fungsi untuk membuat koneksi ke RabbitMQ, membuka channel,
 * dan mulai mengonsumsi (consume) pesan dari antrian "order"
 * Setiap kali ada order baru dari order-service, shipping-service akan memprosesnya
 */
async function connectToQueue() {
    try {
        // Buat koneksi ke RabbitMQ server
        connection = await amqp.connect(amqpServer);
        // Buat channel komunikasi di dalam koneksi yang sudah terbuka
        channel = await connection.createChannel();
        // Assert queue "order" — pastikan antrian sudah ada
        await channel.assertQueue("order");
        // Mulai consume (mengambil) pesan dari antrian "order"
        channel.consume("order", data => {
            // Tampilkan isi order yang diterima dari order-service via RabbitMQ
            console.log(`Order received: ${Buffer.from(data.content)}`);
            console.log("** Will be shipped soon! **\n")
            // Kirim acknowledgment bahwa pesan sudah diterima dan diproses
            channel.ack(data);
        });
    } catch (ex) {
        console.error(ex);
    }
}

// Jalankan server Express di port yang ditentukan di environment variable
app.listen(process.env.PORT, () => {
    console.log(`Server running at ${process.env.PORT}`);
});
