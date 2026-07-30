# Shibashi Mobile

Shibashi’nin bağımsız Expo/React Native App’i. Expo Router, TypeScript, Expo
Camera, MediaPipe Pose Landmarker, Apple Vision 3D, Haptics ve AsyncStorage
kullanır.

Proje, App Store’daki Expo Go ile fiziksel iPhone uyumluluğu için Expo SDK 54
kullanır.

İlk açılışta referans web uygulamasındaki `intro-gate.mp4` tam ekran ve sessiz
video olarak oynar; aktif Shen müziği arkadan devam eder. Video kapısından sonra
ad, 5 Shen modu, kamera rehberi, günlük alanı ve yol haritasından oluşan beş
adımlı onboarding açılır. Akış Profil > Giriş ve rehberi yeniden aç üzerinden
tekrar başlatılabilir.

## Çalıştırma

```bash
npm install
npx expo start
npx expo start --android
```

Fiziksel cihazda kamera akışını test etmek için Expo Go ile QR kodunu okutun. Kamera izni reddedildiğinde uygulama açıklayıcı izin ekranını gösterir.

Web senkronizasyon sunucusunu App ile aynı ağda çalıştırın:

```bash
cd /Users/cinarengin/Documents/Codex
npm run dev:3005
```

Development build aynı ağdaki sunucuyu otomatik bulur. Production App için
`EXPO_PUBLIC_SHIBASHI_SYNC_URL=https://alan-adiniz.example` değişkenini
tanımlayın. Profil ekranındaki `XXXX-XXXX-XXXX` eşleştirme kodu Web ve App’te
aynı girildiğinde geçmiş, seri, postür raporları ve yolculuk kayıtları birleşir.

### Fiziksel iPhone

1. App Store’dan Expo Go’yu güncelleyin.
2. iPhone ve bilgisayarı aynı Wi-Fi ağına bağlayın.
3. Açık eski Metro süreçlerini kapatın ve `npx expo start --clear` çalıştırın.
4. QR kodunu iPhone kamerasıyla okutun ve Expo Go’da açın.

## Android APK

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

`preview` profili APK, `production` profili Google Play için AAB üretir.

Yerel geliştirme derlemesi için Android Studio/JDK kurulu bir ortamda:

```bash
npx expo prebuild --platform android
npx expo run:android
```

## Mimari

- `app/`: Expo Router ekranları ve alt tab navigasyonu
- `components/`: tasarım sistemi bileşenleri
- `data/`: 18 hareket, rutinler ve 8 Bagua kapısı
- `data/fiveShen.ts`: Hun, Shen, Yi, Po ve Zhi profilleri; element, organ,
  günlük görev ve pratik eşlemeleri
- `services/pose/`: MediaPipe 33 noktalı analiz, postür metrikleri ve Apple Vision 3D adaptörü
- `modules/shibashi-vision/`: iOS 17+ `VNDetectHumanBodyPose3DRequest` Expo native modülü
- `services/sync/`: çevrimdışı kuyruklu App/Web senkronizasyon istemcisi
- `store/`: AsyncStorage kalıcılığı ve otomatik backend eşitlemesi olan uygulama durumu
- `types/`, `constants/`: veri modelleri ve merkezi tasarım tokenları

Canlı pratik ve üç açılı postür taraması gerçek MediaPipe 33 nokta çıktısından
puan üretir; sabit demo skor geri dönüşü yoktur. Apple Vision 3D yalnızca iOS
17+ development/production build’de yüklenir. Expo Go, Android ve Web aynı
ekranda otomatik olarak MediaPipe 33’e geri döner.

## 5 Shen

Aktif 5 Shen modu Profil ekranından seçilir ve cihazda saklanır. Seçim; Bugün
ekranındaki görsel tonu, günlük mikro görevi, önerilen pratiği, günlük kayıtlarını
ve pratik sonu koç yorumunu kişiselleştirir. Her Shen kartı element, organ, beden
haritası ve içsel dünya açıklamalarının bulunduğu mobil detay ekranına açılır.

Her mod referans web uygulamasındaki kendi yerel arka plan görselini ve müzik
parçasını kullanır. Shen değiştirildiğinde müzik, ekran arka planı, ana aksiyon
butonları ve aktif tab rengi birlikte değişir. Müzik Bugün ekranındaki nota
düğmesinden veya Profil > Tercihler > Shen müziği anahtarından kapatılabilir.
