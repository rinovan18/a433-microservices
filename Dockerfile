# Gunakan Node.js versi 18 berbasis Alpine Linux (image ringan ~40MB)
FROM node:18-alpine

# Set working directory di dalam container menjadi /app
WORKDIR /app

# Copy hanya file package.json dan package-lock.json terlebih dahulu
# (agar layer cache Docker tidak perlu npm install ulang jika kode source saja yang berubah)
COPY package*.json ./

# Install semua dependencies yang terdaftar di package.json
RUN npm install

# Copy seluruh source code aplikasi ke dalam container
COPY . .

# Jalankan aplikasi dengan perintah "npm start" saat container dijalankan
CMD ["npm", "start"]
