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
