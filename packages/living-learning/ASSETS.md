# Yaşayarak Öğrenme — üretim varlıkları

İlk sürüm, lisanssız içerik indirmeden mevcut sinematik görselleri ve gerçek MediaPipe poz ölçümünü kullanır. Aşağıdaki dosyalar eklendiğinde veri modeli değişmeden video/karakter/ses katmanları açılabilir:

- `teacher-bedroom-transparent.webm` ve `teacher-bedroom-transparent.mp4`: şeffaf arka planlı gerçek eğitmen kaydı.
- `front-back-push.pose.json`: motion-capture veya doğrulanmış 33 noktalı referans dizisi.
- `front-back-push.glb`: isteğe bağlı üretim seviyesi karakter; gerçek mocap animasyonu olmadan kullanılmamalı.
- `bedroom-roomtone.m4a`, `distant-birds.m4a`, `fabric-lift.m4a`: lisans kaydı tutulmuş ortam katmanları.
- `breath-tr.m4a`: profesyonel Türkçe nefes yönlendirmesi.

Bu varlıklar yokken arayüz “3D öğretmen” iddiasında bulunmaz; kaliteli sahne görseli, zaman çizgisi, sade referans pozu ve canlı kamera ölçümü gösterir.
