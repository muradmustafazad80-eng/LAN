import './load-env.mjs'
import crypto from 'node:crypto'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const services = [
  ['Klassik saç kəsimi', 25, 30, 'Hair', 'yuma + styling'],
  ['Saç + saqqal', 40, 50, 'Hair', 'ən populyar'],
  ['Saqqal formalaşdırma', 20, 25, 'Beard', 'isti dəsmal daxil'],
  ['Royal ülgüc təraş', 30, 30, 'Beard', 'ənənəvi ritual'],
  ['Uşaq kəsimi', 18, 30, 'Hair', '12 yaşa qədər'],
  ['KRAL VIP Paket', 75, 75, 'VIP', 'Premium saç kəsimi|Saqqal formalaşdırma + ülgüc|Üz maskası və qulluq|Saç yuma & massaj|Pulsuz içki və qəlyan'],
]
const barbers = [
  ['Elvin Məmmədov', 'Baş Usta / Qurucu', '12 il təcrübə', '/images/barber-1.png', 'elvin@kralbarber.local'],
  ['Rəşad Quliyev', 'Fade & Modern Kəsim Ustası', '7 il təcrübə', '/images/barber-2.png', 'resad@kralbarber.local'],
  ['Kamran Əliyev', 'Klassik Ülgüc & Saqqal Ustası', '15 il təcrübə', '/images/barber-3.png', 'kamran@kralbarber.local'],
]
const settings = [
  ['brand_name', 'KRAL BARBER'],
  ['address', 'Nizami küç. 45, Bakı, Azərbaycan'],
  ['phone', '+994 50 123 45 67'],
  ['phone_secondary', '+994 12 345 67 89'],
  ['working_hours', 'B.e – Şənbə: 10:00 – 22:00; Bazar: 11:00 – 20:00'],
  ['email', 'salam@kralbarber.az'],
  ['email_reservation', 'rezerv@kralbarber.az'],
  ['instagram_url', '#'],
  ['facebook_url', '#'],
  ['map_url', 'https://openstreetmap.org'],
  ['cancellation_window_minutes', '120'],
  ['reschedule_window_minutes', '120'],
  ['slot_interval_minutes', '30'],
]
const reviews = [
  ['Tural H.', '994501000001', 'Elvin Məmmədov', 5, 'Şəhərdə ən yaxşı barbershop. Elvin usta işini mükəmməl bilir, hər dəfə tam istədiyim görünüşü alıram.'],
  ['Nicat A.', '994501000002', 'Rəşad Quliyev', 5, 'VIP paketi aldım — ülgüc təraş və üz maskası inanılmaz idi. Atmosfer həqiqətən premium.'],
  ['Orxan M.', '994501000003', 'Kamran Əliyev', 5, 'Saqqal formalaşdırma üçün gəlirəm. Detallara diqqət və peşəkarlık başqa səviyyədədir.'],
  ['Səməd V.', '994501000004', 'Elvin Məmmədov', 5, 'Rezervasiya sistemi çox rahatdır, gözləmə yoxdur. Qiymət-keyfiyyət balansı əladır.'],
]

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(`scrypt$${salt}$${key.toString('hex')}`)))
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const businessRes = await client.query(`SELECT "id" FROM "Business" WHERE "slug"='kral-barber' LIMIT 1`)
    if (businessRes.rows.length === 0) throw new Error('Default business not found. Run npm run db:migrate first.')
    const businessId = businessRes.rows[0].id

    for (const [name, price, duration, category, description] of services) {
      await client.query(`INSERT INTO "Service" ("id", "businessId", "name", "price", "duration", "category", "description", "status") VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT ("businessId","name") DO UPDATE SET "price"=EXCLUDED."price", "duration"=EXCLUDED."duration", "category"=EXCLUDED."category", "description"=EXCLUDED."description", "status"='active'`, [crypto.randomUUID(), businessId, name, price, duration, category, description])
    }

    const demoPassword = process.env.DEMO_PASSWORD || 'KralDemo123!'
    const adminHash = await hashPassword(process.env.DEMO_ADMIN_PASSWORD || demoPassword)
    const customerHash = await hashPassword(process.env.DEMO_CUSTOMER_PASSWORD || demoPassword)

    const adminUser = await client.query(`INSERT INTO "User" ("id", "businessId","email","passwordHash","role") VALUES ($1,$2,'admin@kralbarber.local',$3,'admin') ON CONFLICT ("businessId","email") DO UPDATE SET "passwordHash"=EXCLUDED."passwordHash", "role"='admin' RETURNING "id"`, [crypto.randomUUID(), businessId, adminHash])

    for (const [name, specialty, experience, image, email] of barbers) {
      const passwordHash = await hashPassword(demoPassword)
      const user = await client.query(`INSERT INTO "User" ("id", "businessId","email","passwordHash","role") VALUES ($1,$2,$3,'barber') ON CONFLICT ("businessId","email") DO UPDATE SET "passwordHash"=EXCLUDED."passwordHash", "role"='barber' RETURNING "id"`, [crypto.randomUUID(), businessId, email, passwordHash])
      await client.query(`INSERT INTO "Barber" ("id", "businessId","userId","name","specialty","experience","image","status") VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT ("businessId","name") DO UPDATE SET "userId"=EXCLUDED."userId", "specialty"=EXCLUDED."specialty", "experience"=EXCLUDED."experience", "image"=EXCLUDED."image", "status"='active'`, [crypto.randomUUID(), businessId, user.rows[0].id, name, specialty, experience, image])
    }

    await client.query(`
      INSERT INTO "BarberSchedule" ("barberId","weekday","startTime","endTime","isWorking")
      SELECT "id", d.weekday,
             CASE WHEN d.weekday = 0 THEN '11:00'::time ELSE '10:00'::time END,
             CASE WHEN d.weekday = 0 THEN '20:00'::time ELSE '22:00'::time END,
             true
      FROM "Barber"
      CROSS JOIN (SELECT generate_series(0,6) AS weekday) d
      WHERE "businessId" = $1 AND "status" = 'active'
      ON CONFLICT ("barberId","weekday") DO NOTHING
    `, [businessId])

    for (const [key, value] of settings) {
      await client.query(`INSERT INTO "BusinessSetting" ("id", "businessId","key","value") VALUES ($1,$2,$3,$4) ON CONFLICT ("businessId","key") DO UPDATE SET "value"=EXCLUDED."value", "updatedAt"=now()`, [crypto.randomUUID(), businessId, key, value])
    }

    const customersByPhone = new Map()
    for (const [customerName, phone, barberName, rating, comment] of reviews) {
      const customer = await client.query(`INSERT INTO "Customer" ("id", "businessId","name","phone") VALUES ($1,$2,$3,$4) ON CONFLICT ("businessId","phone") DO UPDATE SET "name"=EXCLUDED."name" RETURNING "id"`, [crypto.randomUUID(), businessId, customerName, phone])
      customersByPhone.set(phone, customer.rows[0].id)
      const barber = await client.query(`SELECT "id" FROM "Barber" WHERE "businessId"=$1 AND "name"=$2 LIMIT 1`, [businessId, barberName])
      
      // Bütün rows[0].id massiv parçalanmaları tam bərabərləşdirildi (6 sütun = 6 dəqiq parametr)
      await client.query(`INSERT INTO "Review" ("id", "businessId","customerId","barberId","rating","comment") VALUES ($1,$2,$3,$4,$5,$6)`, [crypto.randomUUID(), businessId, customer.rows[0].id, barber.rows[0].id, rating, comment])
    }

    const demoCustomer = await client.query(`INSERT INTO "User" ("id", "businessId","email","passwordHash","role") VALUES ($1,$2,'customer@kralbarber.local',$3,'customer') ON CONFLICT ("businessId","email") DO UPDATE SET "passwordHash"=EXCLUDED."passwordHash", "role"='customer' RETURNING "id"`, [crypto.randomUUID(), businessId, customerHash])
    await client.query(`INSERT INTO "Customer" ("id", "businessId","userId","name","phone") VALUES ($1,$2,$3,$4) ON CONFLICT ("businessId","phone") DO UPDATE SET "userId"=EXCLUDED."userId", "name"=EXCLUDED."name"`, [crypto.randomUUID(), businessId, demoCustomer.rows[0].id, 'Demo Müştəri', '994501234567'])

    await client.query(`INSERT INTO "Loyalty" ("id", "businessId","customerId","points") SELECT gen_random_uuid(), $1,"id",0 FROM "Customer" WHERE "businessId"=$1 AND "phone"='994501234567' ON CONFLICT ("businessId","customerId") DO NOTHING`, [businessId])

    await client.query('COMMIT')
    console.log(`\n✅ Stage 2 seed uğurla tamamlandı!`)
    console.log(`Demo şifrə: ${demoPassword}`)
    console.log('Admin: admin@kralbarber.local')
    console.log('Customer: customer@kralbarber.local')
    console.log('Barber: elvin@kralbarber.local / resad@kralbarber.local / kamran@kralbarber.local')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => { console.error(error); process.exit(1) })