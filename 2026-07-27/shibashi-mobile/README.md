# Shibashi Mobile

Shibashi’nin Android odaklı, bağımsız Expo/React Native uygulaması. WebView içermez. Expo Router, TypeScript, Expo Camera, Haptics ve AsyncStorage kullanır.

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
- `services/pose/`: gerçek MediaPipe/TFLite adaptörünün yerine takılabileceği `PoseAnalyzer` arayüzü ve mock servis
- `store/`: AsyncStorage kalıcılığı olan uygulama durumu
- `types/`, `constants/`: veri modelleri ve merkezi tasarım tokenları

Mock pose servisi geliştirme amaçlı olarak servis katmanında açıkça işaretlenmiştir. UI gerçek zamanlı skor akışını simüle eder; gerçek görüntü işleme eklenmeden build’i engellemez.

## 5 Shen

Aktif 5 Shen modu Profil ekranından seçilir ve cihazda saklanır. Seçim; Bugün
ekranındaki görsel tonu, günlük mikro görevi, önerilen pratiği, günlük kayıtlarını
ve pratik sonu koç yorumunu kişiselleştirir. Her Shen kartı element, organ, beden
haritası ve içsel dünya açıklamalarının bulunduğu mobil detay ekranına açılır.

Her mod referans web uygulamasındaki kendi yerel arka plan görselini ve müzik
parçasını kullanır. Shen değiştirildiğinde müzik, ekran arka planı, ana aksiyon
butonları ve aktif tab rengi birlikte değişir. Müzik Bugün ekranındaki nota
düğmesinden veya Profil > Tercihler > Shen müziği anahtarından kapatılabilir.
