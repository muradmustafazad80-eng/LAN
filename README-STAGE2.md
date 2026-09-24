# KRAL BARBER — Stage 2

Stage 2 adds hesab, giriş, sessiya, rol yoxlaması, çox-biznes məlumat ayrılığı və həqiqi rezervasiya qaydaları.

## Qurulum

1. Layihənin kökündə `.env` faylı olsun və içində öz Neon `DATABASE_URL` bağlantın yazılsın.
2. İstəyə görə yerli yoxlama şifrələrini də həmin faylda verə bilərsən: `DEMO_PASSWORD`, `DEMO_ADMIN_PASSWORD`, `DEMO_CUSTOMER_PASSWORD`.
3. `npm run db:migrate`
4. `npm run db:seed`
5. `npm run dev`

`db:migrate` əvvəlki mərhələni tanıyır və yalnız çatışmayan dəyişiklikləri tətbiq edir.

## Demo hesablar

Seed zamanı dəyişənlər verilməyibsə, yerli yoxlama üçün skript özü demo şifrə yaradır və terminalda göstərir.

- İdarəçi: `admin@kralbarber.local`
- Müştəri: `customer@kralbarber.local`
- Ustalar: `elvin@kralbarber.local`, `resad@kralbarber.local`, `kamran@kralbarber.local`

## Əsas imkanlar

- Müştəri, usta və idarəçi hesabları
- Təhlükəsiz şifrə saxlama və server sessiyası
- Rol və sahiblik yoxlamaları
- `Business` əsasında məlumat ayrılığı
- Xidmət + usta + tarix + həqiqi boş vaxt seçimi
- Ustanın və biznesin iş saatlarının server yoxlaması
- Xidmət müddətinin serverdən götürülməsi
- Dolu vaxta qarşı server və verilənlər bazası qoruması
- Ləğv etmə və vaxtı dəyişmə
- Sadə giriş və sifariş cəhd məhdudiyyəti
- Müştərinin şəxsi sifariş tarixçəsi
- Ustanın yalnız öz biznesinə və öz görüşlərinə çıxışı

## Əhatə olunmayan hissələr

İdarəçi panelinin tam analitik görünüşü Stage 3-dədir. CRM, sədaqət sistemi, rəylərin idarəsi, kampaniyalar, ödənişlər, mesajlaşma və süni zəka da sonrakı mərhələlərdədir.

## Google giriş

Google hesabı ilə giriş üçün mövcud `.env` faylınıza yalnız bu iki server dəyişənini əlavə edin; mövcud başqa dəyişənlərə toxunmayın:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Redirect ünvanını ayrıca env dəyişəninə salmaq məcburi deyil: sistem cari domeninizdən `/api/auth/google/callback` ünvanını avtomatik qurur. Google Cloud OAuth client-da isə istifadə etdiyiniz domenlər üçün bu callback URI-lərini Authorized redirect URIs bölməsinə əlavə edin. Məsələn lokalda `http://localhost:3000/api/auth/google/callback`, Vercel production-da isə `https://SENIN-DOMENIN/api/auth/google/callback`.

## Vercel deploy

Vercel now runs `npm run db:migrate` before the production build through `vercel.json`. Keep `DATABASE_URL` available in the Vercel Environment Variables used by the deployment.

Google login requires these Vercel Environment Variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (recommended for a custom domain; otherwise the callback origin is derived automatically)

The Google callback must be authorized in Google Cloud as `/api/auth/google/callback` on the deployed domain.
