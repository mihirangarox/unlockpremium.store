const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

// --- HELPERS ---
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')     // Remove non-word characters
        .replace(/[\s_]+/g, '-')       // Replace spaces with hyphens
        .replace(/-+/g, '-');          // Remove duplicate hyphens
};

// --- MIDDLEWARE ---
const authenticate = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized. Missing or incorrect Authorization header.');
    }
    const idToken = authorization.split('Bearer ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying ID token:', error);
        res.status(401).send('Unauthorized. Invalid token.');
    }
};

// --- IMAGE UPLOAD ---
app.post('/upload-image', authenticate, (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    let uploadData = null;

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
        const filepath = path.join(os.tmpdir(), filename);
        uploadData = { filepath, mimeType, filename };
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', async () => {
        if (!uploadData) {
            return res.status(400).send('No file uploaded.');
        }

        const destination = `posts/${Date.now()}-${uploadData.filename}`;

        try {
            await bucket.upload(uploadData.filepath, {
                destination: destination,
                metadata: {
                    contentType: uploadData.mimeType,
                },
            });

            const file = bucket.file(destination);
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            fs.unlinkSync(uploadData.filepath); // Cleanup temp file
            res.status(200).send({ imageUrl: publicUrl });
        } catch (err) {
            console.error('Error uploading file:', err);
            res.status(500).send({ message: 'Could not upload the file.', error: err.message });
        }
    });

    busboy.end(req.rawBody);
});

// --- BLOG POSTS ---
const postsCollection = db.collection('posts');

app.get('/posts', async (req, res) => {
    try {
        const { status } = req.query;
        let query = postsCollection.orderBy('createdAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        res.json(posts);
    } catch (error) {
        console.error("Error getting posts:", error);
        res.status(500).send("Error getting posts");
    }
});

app.get('/posts/:id', async (req, res) => {
    try {
        const doc = await postsCollection.doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).send('Post not found');
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error getting post:", error);
        res.status(500).send("Error getting post");
    }
});

app.get('/posts/slug/:slug', async (req, res) => {
    try {
        const snapshot = await postsCollection.where('slug', '==', req.params.slug).limit(1).get();
        if (snapshot.empty) {
            return res.status(404).send('Post not found');
        }
        const doc = snapshot.docs[0];
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error getting post by slug:", error);
        res.status(500).send("Error getting post by slug");
    }
});

app.post('/posts', authenticate, async (req, res) => {
    try {
        const { title, summary, content, imageUrl, status, tags, metaTitle, metaDescription } = req.body;
        if (!title || !content) {
            return res.status(400).send("Title and content are required.");
        }

        let imagePath = null;
        if (imageUrl) {
            try {
                imagePath = decodeURIComponent(new URL(imageUrl).pathname.split('/').slice(2).join('/'));
            } catch (e) { console.error('Invalid image URL:', imageUrl, e); }
        }

        const newPost = {
            title,
            slug: generateSlug(title),
            summary: summary || '',
            content,
            imageUrl: imageUrl || null,
            imagePath: imagePath,
            status: status || 'draft',
            tags: tags || [],
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || summary || '',
            authorUid: req.user.uid,
            createdAt: new Date().toISOString()
        };

        const docRef = await postsCollection.add(newPost);
        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send("Error creating post");
    }
});

app.put('/posts/:id', authenticate, async (req, res) => {
    try {
        const { title, summary, content, imageUrl, status, tags, metaTitle, metaDescription } = req.body;
        if (!title || !content) {
            return res.status(400).send("Title and content are required.");
        }

        const postRef = postsCollection.doc(req.params.id);
        const doc = await postRef.get();

        if (!doc.exists) {
            return res.status(404).send('Post not found');
        }

        if (doc.data().authorUid !== req.user.uid) {
            return res.status(403).send('Forbidden: You are not the author of this post.');
        }

        const oldImagePath = doc.data().imagePath;
        let newImagePath = null;
        if (imageUrl) {
            try {
                newImagePath = decodeURIComponent(new URL(imageUrl).pathname.split('/').slice(2).join('/'));
            } catch (e) { console.error('Invalid image URL:', imageUrl, e); }
        }

        if (oldImagePath && oldImagePath !== newImagePath) {
            try {
                const oldFile = bucket.file(oldImagePath);
                await oldFile.delete();
            } catch (err) { console.error("Error deleting old image:", err); }
        }

        const updatedPost = {
            title,
            slug: generateSlug(title),
            summary: summary || '',
            content,
            imageUrl: imageUrl,
            imagePath: newImagePath,
            status: status || 'draft',
            tags: tags || [],
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || summary || '',
            updatedAt: new Date().toISOString()
        };

        await postRef.update(updatedPost);
        res.status(200).json({ id: req.params.id, ...updatedPost });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send("Error updating post");
    }
});

app.delete('/posts/:id', authenticate, async (req, res) => {
    try {
        const postRef = postsCollection.doc(req.params.id);
        const doc = await postRef.get();

        if (!doc.exists) { return res.status(404).send('Post not found'); }
        if (doc.data().authorUid !== req.user.uid) { return res.status(403).send('Forbidden'); }

        const imagePath = doc.data().imagePath;
        if (imagePath) {
            try {
                const file = bucket.file(imagePath);
                await file.delete();
            } catch (err) { console.error("Error deleting image:", err); }
        }

        await postRef.delete();
        res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send("Error deleting post");
    }
});

// --- TESTIMONIALS ---
const testimonialsCollection = db.collection('testimonials');

app.get('/testimonials', async (req, res) => {
    try {
        const snapshot = await testimonialsCollection.orderBy('createdAt', 'desc').get();
        const testimonials = [];
        snapshot.forEach(doc => {
            testimonials.push({ id: doc.id, ...doc.data() });
        });
        res.json(testimonials);
    } catch (error) {
        console.error("Error getting testimonials:", error);
        res.status(500).send("Error getting testimonials");
    }
});

app.post('/testimonials', authenticate, async (req, res) => {
    try {
        const { content, user, rating, region, featured } = req.body;
        if (!content || !user) {
            return res.status(400).send("Content and user are required.");
        }

        const newTestimonial = {
            content,
            user,
            rating: rating || 5,
            region: region || '',
            featured: featured || false,
            createdAt: new Date().toISOString()
        };

        const docRef = await testimonialsCollection.add(newTestimonial);
        res.status(201).json({ id: docRef.id, ...newTestimonial });
    } catch (error) {
        console.error("Error creating testimonial:", error);
        res.status(500).send("Error creating testimonial");
    }
});

app.put('/testimonials/:id', authenticate, async (req, res) => {
    try {
        const { content, user, rating, region, featured } = req.body;
        if (!content || !user) {
            return res.status(400).send("Content and user are required.");
        }

        const testimonialRef = testimonialsCollection.doc(req.params.id);
        const doc = await testimonialRef.get();

        if (!doc.exists) { return res.status(404).send('Testimonial not found'); }

        const updatedTestimonial = {
            content,
            user,
            rating: rating || doc.data().rating,
            region: region || doc.data().region,
            featured: featured ?? doc.data().featured ?? false,
            updatedAt: new Date().toISOString()
        };

        await testimonialRef.update(updatedTestimonial);
        res.status(200).json({ id: req.params.id, ...updatedTestimonial });
    } catch (error) {
        console.error("Error updating testimonial:", error);
        res.status(500).send("Error updating testimonial");
    }
});

app.delete('/testimonials/:id', authenticate, async (req, res) => {
    try {
        const testimonialRef = testimonialsCollection.doc(req.params.id);
        await testimonialRef.delete();
        res.status(200).send({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        res.status(500).send("Error deleting testimonial");
    }
});

// --- SITEMAP ---
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://unlockpremium.store';
        const staticPages = [
            '',
            '/how-it-works',
            '/plans',
            '/guides',
            '/testimonials',
            '/faqs',
            '/contact-support',
            '/activation-warranty',
            '/legal-privacy-notice',
            '/refund-activation-policy'
        ];

        // Fetch all posts and filter out drafts
        const snapshot = await postsCollection.get();
        const postUrls = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Include everything that isn't explicitly a draft and has a slug
            if (data.status !== 'draft' && data.slug) {
                postUrls.push(`/guides/${data.slug}`);
            }
        });

        const allUrls = [...staticPages, ...postUrls];
        const date = new Date().toISOString().split('T')[0];

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        allUrls.forEach(url => {
            const priority = url === '' ? '1.0' : '0.8';
            sitemap += '  <url>\n';
            sitemap += `    <loc>${baseUrl}${url}</loc>\n`;
            sitemap += `    <lastmod>${date}</lastmod>\n`;
            sitemap += '    <changefreq>weekly</changefreq>\n';
            sitemap += `    <priority>${priority}</priority>\n`;
            sitemap += '  </url>\n';
        });

        sitemap += '</urlset>';

        res.set('Content-Type', 'text/xml');
        res.status(200).send(sitemap);
    } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Error generating sitemap");
    }
});

// App Login helper (optional for production but keeps consistency)
app.post('/login', async (req, res) => {
    const { idToken } = req.body;
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        res.json({ message: 'Token verified.', uid: decodedToken.uid });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);

/**
 * Trigger: onNewRequest
 * Sends a Discord notification whenever a new document is created in the 'requests' collection.
 * This runs on the backend, bypassing CORS and using the centralized Firestore settings.
 * Uses firebase-functions v2 Firestore trigger (required for firebase-functions >= v6)
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.onNewRequest = onDocumentCreated('requests/{requestId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const request = snapshot.data();
    const requestId = event.params.requestId;
    
    try {
        // 1. Get settings from Firestore (main_config)
        const settingsDoc = await db.collection('system_settings').doc('main_config').get();
        const webhookUrl = settingsDoc.exists 
            ? settingsDoc.data()?.notificationPreferences?.webhookUrl 
            : null;
        
        if (!webhookUrl) {
            console.log(`[Trigger] No webhook URL in system_settings. Skipping alert for ${requestId}`);
            return;
        }

        console.log(`[Trigger] Dispatching Discord Pulse for Request: ${requestId}`);

        // 2. Format the professional Discord embed
        const detailLink = `https://unlockpremium.store/unlock-world-26/requests/${requestId}`;

        const embed = {
            title: "🚨 New CRM Request",
            color: 0x6366f1,
            description: `A new ${request.status || 'request'} was received from the storefront.`,
            fields: [
                { name: "👤 Customer", value: request.fullName || 'Anonymous', inline: true },
                { name: "🛒 Product", value: `${request.subscriptionType || 'Service'} (${request.subscriptionPeriod || '1M'})`, inline: true },
                { name: "💰 Price", value: `${request.currency || 'USD'} ${Number(request.amount || 0).toFixed(2)}`, inline: true },
                { name: "🔗 Action", value: `[View in Admin Portal](${detailLink})` }
            ],
            footer: { text: "CRMSync Pulse • High-Urgency" },
            timestamp: new Date().toISOString()
        };

        // 3. Dispatch to Discord
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });

        if (!response.ok) {
            throw new Error(`Discord responded with status ${response.status}`);
        }
        
        console.log(`[Trigger] Successfully notified Discord for ${requestId}`);
    } catch (error) {
        console.error("[Trigger] Notification error:", error);
    }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Fetches the webhook URL from Firestore system_settings.
 * Returns null if not configured.
 */
async function getWebhookUrl() {
    const settingsDoc = await db.collection('system_settings').doc('main_config').get();
    if (!settingsDoc.exists) return null;
    return settingsDoc.data()?.notificationPreferences?.webhookUrl || null;
}

/**
 * Posts a rich embed to Discord webhook.
 */
async function postToDiscord(webhookUrl, embed) {
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    });
    if (!response.ok) {
        throw new Error(`Discord responded with status ${response.status}: ${await response.text()}`);
    }
}

/** Returns today's date string in YYYY-MM-DD format (UTC). */
function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/** Formats a number as GBP currency string. */
function gbp(amount) {
    return `£${Number(amount || 0).toFixed(2)}`;
}

// ─── SCHEDULED: MORNING ACTION CENTRE (7:00 AM UTC daily) ────────────────────

/**
 * Fires every morning at 07:00 UTC.
 * Posts a "Morning Action Centre" summary to Discord:
 *   - Pending requests count
 *   - Renewals due today
 *   - Available stock code count
 *   - Revenue received today (cash-on-hand from renewal_history)
 */
exports.morningActionCentre = onSchedule(
    { schedule: '0 7 * * *', timeZone: 'UTC', region: 'us-central1' },
    async () => {
        console.log('[Morning Report] Starting...');
        try {
            const webhookUrl = await getWebhookUrl();
            if (!webhookUrl) {
                console.log('[Morning Report] No webhook URL configured. Skipping.');
                return;
            }

            // Deduplication: only send once per day
            const settingsDoc = await db.collection('system_settings').doc('main_config').get();
            const lastSent = settingsDoc.data()?.notificationPreferences?.lastMorningReportDate || '';
            const today = todayStr();
            if (lastSent === today) {
                console.log('[Morning Report] Already sent today. Skipping.');
                return;
            }

            // 1. Pending requests count
            const pendingSnap = await db.collection('requests')
                .where('status', '==', 'Pending').get();
            const pendingCount = pendingSnap.size;

            // 2. Subscriptions with renewal date = today
            const subsSnap = await db.collection('subscriptions').get();
            const renewalsToday = subsSnap.docs.filter(d => {
                const data = d.data();
                if (!data.renewalDate) return false;
                const renewal = data.renewalDate.split('T')[0];
                return renewal === today && data.status !== 'Cancelled';
            }).length;

            // 3. Available stock codes
            const stockSnap = await db.collection('live_stock')
                .where('status', '==', 'Available').get();
            const stockCount = stockSnap.size;

            // 4. Revenue received today from renewal_history
            const histSnap = await db.collection('renewal_history').get();
            let todayRevenue = 0;
            histSnap.docs.forEach(d => {
                const data = d.data();
                const entryDate = (data.createdAt || data.renewedOn || '').split('T')[0];
                if (entryDate === today) {
                    todayRevenue += Number(data.amount || 0);
                }
            });

            const embed = {
                title: '🌅 Morning Action Centre',
                color: 0xf59e0b,
                description: `Here is your task list and business health for today.`,
                fields: [
                    { name: '📋 Pending leads',   value: `${pendingCount} requests`, inline: true },
                    { name: '🔄 Renewals Today',  value: `${renewalsToday} plans`,  inline: true },
                    { name: '📦 Stock Level',      value: `${stockCount} codes`,     inline: true },
                    { name: '💷 Cash-on-Hand',     value: gbp(todayRevenue),         inline: false }
                ],
                footer: { text: 'CRMSync Automation • Success starts now' },
                timestamp: new Date().toISOString()
            };

            await postToDiscord(webhookUrl, embed);

            // Mark as sent for today
            await db.collection('system_settings').doc('main_config').set(
                { notificationPreferences: { lastMorningReportDate: today } },
                { merge: true }
            );

            console.log('[Morning Report] Sent successfully.');
        } catch (err) {
            console.error('[Morning Report] Error:', err);
        }
    }
);

// ─── SCHEDULED: DAILY PULSE REPORT (8:00 PM UTC daily) ───────────────────────

/**
 * Fires every evening at 20:00 UTC.
 * Posts a "Daily Pulse Report" with today's financial summary:
 *   - Revenue, Costs, Profit from renewal_history
 *   - Number of orders processed
 *   - Profit margin %
 */
exports.dailyPulseReport = onSchedule(
    { schedule: '0 20 * * *', timeZone: 'UTC', region: 'us-central1' },
    async () => {
        console.log('[Daily Pulse] Starting...');
        try {
            const webhookUrl = await getWebhookUrl();
            if (!webhookUrl) {
                console.log('[Daily Pulse] No webhook URL configured. Skipping.');
                return;
            }

            // Deduplication: only once per day
            const settingsDoc = await db.collection('system_settings').doc('main_config').get();
            const lastSent = settingsDoc.data()?.notificationPreferences?.lastDailyReportDate || '';
            const today = todayStr();
            if (lastSent === today) {
                console.log('[Daily Pulse] Already sent today. Skipping.');
                return;
            }

            // Pull today's renewal_history entries
            const histSnap = await db.collection('renewal_history').get();
            let revenue = 0, costs = 0, profit = 0, orders = 0;

            histSnap.docs.forEach(d => {
                const data = d.data();
                const entryDate = (data.createdAt || data.renewedOn || '').split('T')[0];
                if (entryDate === today) {
                    const amt = Number(data.amount || 0);
                    const cst = Number(data.cost   || 0);
                    const pft = Number(data.profit !== undefined ? data.profit : (amt - cst));
                    revenue += amt;
                    costs   += cst;
                    profit  += pft;
                    orders++;
                }
            });

            const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

            const embed = {
                title: '☀️ Daily Pulse Report • CRMSync',
                color: 0x22c55e,
                description: `Financial summary for today, **${today}**.`,
                fields: [
                    { name: '💰 Revenue',  value: gbp(revenue), inline: true },
                    { name: '🔗 Costs',    value: gbp(costs),   inline: true },
                    { name: '💎 Profit',   value: gbp(profit),  inline: true },
                    { name: '📦 Orders',   value: `${orders}`,  inline: true },
                    { name: '✅ Margin',   value: `${margin}%`, inline: true }
                ],
                footer: { text: 'CRMSync Automation • Keep Growing' },
                timestamp: new Date().toISOString()
            };

            await postToDiscord(webhookUrl, embed);

            // Mark as sent for today
            await db.collection('system_settings').doc('main_config').set(
                { notificationPreferences: { lastDailyReportDate: today } },
                { merge: true }
            );

            console.log('[Daily Pulse] Sent successfully.');
        } catch (err) {
            console.error('[Daily Pulse] Error:', err);
        }
    }
);

// ─── SCHEDULED: WEEKLY PROFIT COMPASS (Monday 7:00 AM UTC) ───────────────────

/**
 * Fires every Monday at 07:00 UTC and reports on the PREVIOUS Mon–Sun week.
 * Posts the "Weekly Profit Compass" with:
 *   - Total Revenue, Link Costs, Net Profit
 *   - Total order count
 *   - Top seller (most orders)
 *   - Most profitable product (highest profit contribution)
 */
exports.weeklyProfitCompass = onSchedule(
    { schedule: '0 7 * * 1', timeZone: 'UTC', region: 'us-central1' },
    async () => {
        console.log('[Weekly Report] Starting...');
        try {
            const webhookUrl = await getWebhookUrl();
            if (!webhookUrl) {
                console.log('[Weekly Report] No webhook URL configured. Skipping.');
                return;
            }

            // Deduplication: store this Monday's date
            const settingsDoc = await db.collection('system_settings').doc('main_config').get();
            const lastSent = settingsDoc.data()?.notificationPreferences?.lastSundayReportDate || '';
            const today = todayStr();
            if (lastSent === today) {
                console.log('[Weekly Report] Already sent this week. Skipping.');
                return;
            }

            // Calculate previous Mon–Sun date range
            const now = new Date();
            const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
            const thisMonday = new Date(now);
            thisMonday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));

            const prevMonday = new Date(thisMonday);
            prevMonday.setUTCDate(thisMonday.getUTCDate() - 7);

            const prevSunday = new Date(thisMonday);
            prevSunday.setUTCDate(thisMonday.getUTCDate() - 1);

            const weekStart = prevMonday.toISOString().split('T')[0];
            const weekEnd   = prevSunday.toISOString().split('T')[0];

            // Pull all renewal_history for the past week
            const histSnap = await db.collection('renewal_history').get();
            let revenue = 0, costs = 0, profit = 0;
            const productStats = {}; // { label: { orders, profit } }

            histSnap.docs.forEach(d => {
                const data = d.data();
                const entryDate = (data.createdAt || data.renewedOn || '').split('T')[0];
                if (entryDate >= weekStart && entryDate <= weekEnd) {
                    const amt = Number(data.amount || 0);
                    const cst = Number(data.cost   || 0);
                    const pft = Number(data.profit !== undefined ? data.profit : (amt - cst));
                    revenue += amt;
                    costs   += cst;
                    profit  += pft;

                    // Extract product label from notes field
                    const notes = data.notes || '';
                    const match = notes.match(/Initial subscription:\s*(.+)/);
                    const key = (match ? match[1].trim() : '') || 'Service';
                    if (!productStats[key]) productStats[key] = { orders: 0, profit: 0 };
                    productStats[key].orders++;
                    productStats[key].profit += pft;
                }
            });

            const totalOrders = Object.values(productStats).reduce((s, v) => s + v.orders, 0);

            // Find top seller and most profitable
            let topSeller = 'N/A', mostProfitable = 'N/A';
            let topOrders = 0, topProfit = -Infinity;
            Object.entries(productStats).forEach(([name, { orders: o, profit: p }]) => {
                if (o > topOrders) { topOrders = o; topSeller = `${name} (${o})`; }
                if (p > topProfit) { topProfit = p; mostProfitable = `${name} (${gbp(p)})`; }
            });

            if (topSeller === 'N/A' && totalOrders === 0) {
                topSeller = '—';
                mostProfitable = '—';
            }

            const embed = {
                title: '📊 Weekly Profit Compass • CRMSync',
                color: 0x6366f1,
                description: `Financial performance for the week ending **${weekEnd}**.`,
                fields: [
                    { name: '💰 Total Revenue',    value: gbp(revenue),     inline: true },
                    { name: '🔗 Link Costs',        value: gbp(costs),       inline: true },
                    { name: '💎 Net Profit',        value: gbp(profit),      inline: true },
                    { name: '📦 Total Orders',      value: `${totalOrders}`, inline: true },
                    { name: '🏆 Top Seller',        value: topSeller,        inline: true },
                    { name: '🥇 Most Profitable',   value: mostProfitable,   inline: true }
                ],
                footer: { text: 'CRMSync Automation • Delivering Insights' },
                timestamp: new Date().toISOString()
            };

            await postToDiscord(webhookUrl, embed);

            // Mark as sent (store this Monday's date)
            await db.collection('system_settings').doc('main_config').set(
                { notificationPreferences: { lastSundayReportDate: today } },
                { merge: true }
            );

            console.log('[Weekly Report] Sent successfully.');
        } catch (err) {
            console.error('[Weekly Report] Error:', err);
        }
    }
);
