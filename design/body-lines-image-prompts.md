# Beden Hatları — görsel üretim prompt seti

## Seri standardı

- Kullanım: `photorealistic-natural`, premium dikey Tai Chi öğretim görseli.
- Karakter: Aynı 40 yaşlarında Doğu Asyalı erkek eğitmen; sakin ifade, bağlı siyah saç.
- Kıyafet: Fildişi geleneksel Tai Chi üniforması ve yumuşak fildişi ayakkabı.
- Mekân: Koyu çağdaş Çin dojosu, kömür rengi taş zemin, arkada silik Bagua çemberi ve hafif sis.
- Kadraj: 9:16, tek kişi, baştan iki ayağa kadar eksiksiz tam beden.
- Işık: Yumuşak sıcak kontur ışığı ve ölçülü ay ışığı.
- Beden haritası: Kolları, merkezi ve bacakları izleyen ince yeşim ve sıcak altın ışık hatları; seçili eklemlerde küçük ışık noktaları.
- Kaçınılacaklar: Yazı, etiket, logo, UI, filigran, fazladan uzuv, kesilmiş ayak, iskelet/stick figure, yoga/dans pozu, saldırgan dövüş ifadesi, neon cyberpunk.

## 18 hareket pozu

1. **Açılış Formu:** Omuz genişliğinde köklü duruş; iki kol göğüs altına doğru yükselirken dirsek ve bilekler yumuşak, avuçlar aşağı.
2. **Bağrını Açmak:** Kollar göğüs önünden yatay olarak iki yana açılır; dirsekler yuvarlak, kürek kemikleri doğal kayar.
3. **Gökkuşakları ile Dans:** Ağırlık sola taşınır; sol kol baş üzerinde gökkuşağı gibi yuvarlanır, sağ kol omuz hizasında yana uzanır, bakış üst eli izler.
4. **İçten Dışa:** İki kol merkezden dışarı büyük dairesel yay çizer; biri yüksek biri alçak, bilekler yumuşak döner.
5. **Maymunu İtekle:** Üç çeyrek yay duruşu; gövde spiralde, ön avuç göğüs hizasında iterken diğer el kaburgaya çekilir.
6. **Kayıkta Kürek Çek:** Dizler yumuşak, kalçadan menteşe ve uzun omurga; iki kol alçaktan gövdeye geniş kürek yayı çizer.
7. **Balonla Oyna:** Ağırlık yana aktarılır; iki kol gövde önünde çapraz büyük görünmez küreyi tutar.
8. **Ayı Göğe Gönder:** Geniş duruş ve hafif gövde rotasyonu; iki el hayali ayı çapraz yönde yukarı taşır, baş geriye atılmaz.
9. **Karnın ile İt:** Üç çeyrek yay duruşu; iki açık avuç göğüs hizasında ileri iter, dirsekler kilitlenmez, güç merkezden gelir.
10. **Bulutlarla Dans:** At duruşu ve yana ağırlık aktarımı; bir kol göğüs önünden geçerken diğeri alt karında yuvarlanır, avuçlar zıt yönlüdür.
11. **Okyanustan Suyu Göğe Taşı:** Kalça menteşesinden yükselirken iki çukur avuç diz hizasından göğe doğru su taşır.
12. **Dalgalarla Oyna:** Üç çeyrek yay duruşu; iki avuç birlikte göğüs hizasında dalgayı iter, ağırlık öne akar.
13. **Yaban Kazı Kanatlarını Açıyor:** Önden geniş hafif duruş; iki kol kanat gibi omuz hizasının biraz altında iki yana açılır.
14. **Yumruklama:** Üç çeyrek yay duruşu; arka topuk yerde, kalça-bel sırasıyla döner, bir yumruk ileri uzanırken diğeri bele çekilir.
15. **Yaban Kazı Yükseliyor:** Yumuşak yükselişin üst noktası; iki kol kanat gibi omuz hizasına çıkar, ayak tabanları canlı kalır.
16. **Değirmeni Döndür:** Geniş üç çeyrek duruş; biri omuz üzerinde yüksek, diğeri karşı kalçada alçak iki el büyük dikey çember kurar.
17. **Topu Sektir:** Ağırlık tek bacağa alınır; karşı topuk hafif kalkarken zıt el kalça yanında görünmez topu aşağı sektirir.
18. **Kapanış Formu:** Önden merkezli duruş; dizler yumuşakça çökerken iki açık avuç alt karın önüne iner ve ağırlık iki ayağa eşit döner.

Görseller OpenAI yerleşik görsel üretim aracıyla, ilk kare seri kimliği olacak şekilde ve sonraki karelerde kimlik/ortam korunarak üretilmiştir.

## Hareketli öğretim kareleri

Her hareket için ana pozdan hemen önce gelen ikinci bir gerçek görsel üretildi. Üretim modu `identity-preserving image edit`: eğitmen, kıyafet, ışık, kamera, Bagua zemini ve dojo sabit tutulurken yalnızca ağırlık aktarımı ile kol/bacak fazı değiştirildi. Web ve mobile arayüzleri bu iki kare arasında 6.2 saniyelik `easeInOut` nefes ritminde ileri–geri geçiş yapar; yeşim-altın enerji taraması hareket yönünü güçlendirir.

- Başlangıç kareleri (web): `public/images/body-lines-motion/01.jpg`–`18.jpg`
- Başlangıç kareleri (mobile): `2026-07-27/shibashi-mobile/assets/body-lines-motion/01.jpg`–`18.jpg`
- Ana poz kareleri: ilgili platformdaki `body-lines/01.jpg`–`18.jpg`
- Hareket kapatma: Görselin sağ üstündeki `CANLI` düğmesi.
- Erişilebilirlik: İşletim sisteminde “hareketi azalt” açıksa geçiş durur ve ana poz gösterilir.

## Görsel öğretim katmanları

- On sekiz hareketin her birinde, o harekete ait beş kaynak noktası pozun bilek, avuç, baş, gövde, diz veya ayak bölgesine özel koordinatlarla yerleştirilir.
- `Beden Hatları` katmanı parlak nokta ve kod etiketlerini gösterir.
- `Derin Bağlantı` katmanı hareketin verisindeki Ren Mai, Chong Mai, Yin/Yang Wei Mai, Dai Mai, Du Mai ve Yin/Yang Qiao Mai yollarını ayrı renklerde yavaşça aydınlatır.
- Görsel koordinatların tek kaynağı: `packages/meridian-knowledge/visual-map.ts`.
- Noktalar dört saniyelik sakin bir ritimle sırayla öne çıkar; aynı anda yalnızca aktif noktanın kodu gösterilir.
- Aktif nokta gündelik bir beden komutu verir. Teknik kod ve geleneksel pinyin adı daha küçük ikinci satırda kalır.
- Web’de tıklama, mobile’da dokunma ile kullanıcı istediği noktaya doğrudan geçebilir.
