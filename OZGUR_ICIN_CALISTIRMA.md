# RITIM KAPISI - Calistirma Rehberi

Bu proje Next.js ile hazirlanmis yerel bir demo uygulamasidir.

## Gerekenler

- Node.js 20 veya daha yeni bir surum
- npm

## Calistirma

Terminalde proje klasorune gir:

```bash
cd /Users/cinarengin/Documents/Codex
```

Bagimliliklari yukle:

```bash
npm ci --prefix apps/web
```

Uygulamayi 3005 portunda baslat:

```bash
npm run dev:web:sync
```

Tarayicida ac:

```text
http://127.0.0.1:3005
```

## Notlar

- Kamera ozellikleri icin tarayicida kamera izni vermek gerekir.
- Eger 3005 portu doluysa su komutla baska portta calistirabilirsin:

```bash
npm --prefix apps/web run dev -- --port 3006
```
