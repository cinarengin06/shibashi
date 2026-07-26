# Kolları Yükseltme / Raise the Arms MVP

## Entegrasyon

Pratik > Hazırlık ekranında `warmup` dersi seçildiğinde sağ kamera paneli `MovementCoach` bileşenini gösterir. Wuji ve Kua ekranlarındaki mevcut kamera akışı değiştirilmemiştir. Sol YouTube öğretmen videosu aynen korunmuştur.

## State machine

CAMERA_OFF -> FIND_BODY -> READY_POSITION -> RAISING -> HOLDING -> LOWERING -> COMPLETED

- FIND_BODY: 1.5 saniye boyunca gerekli 12 kritik eklemi arar.
- READY_POSITION: kollar aşağıda, omuzlar yatay ve gövde merkezdeyken 2 saniye bekler.
- RAISING: bileklerin yukarı hareketini, simetriyi, dirsek yumuşaklığını ve tempoyu ölçer.
- HOLDING: eller omuz hizasındayken 3 saniye sayar; poz bozulursa sayaç durur.
- LOWERING: kontrollü inişi ve simetriyi izler.
- COMPLETED: ağırlıklı 100 puanlık sonucu gösterir.

## Test

1. `npm install`
2. `npm run dev:3005`
3. `http://127.0.0.1:3005` aç.
4. Pratik > Hazırlık > `Isınma: Eklemleri Aç` dersini seç.
5. Sağ panelde `Kamerayı Aç` butonuna bas ve kamera izni ver.
6. Baş ve ayak bilekleri dahil tüm bedeni göster.
7. Kollar aşağıda 2 saniye bekle.
8. Sesli komutla kolları 3-6 saniyede omuz hizasına kaldır.
9. 3 saniye tut ve 3-6 saniyede indir.
10. Sonuç puanını ve alt skorları kontrol et.

Kamera HTTPS veya localhost ister. Görüntü kaydedilmez ve sunucuya gönderilmez.
