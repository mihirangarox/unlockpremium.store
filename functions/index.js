const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Initialize Firebase Admin (no service account needed in Cloud Functions)
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication Middleware
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

// Image Upload Route (using Busboy for Cloud Functions)
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

// Blog Post Routes
const postsCollection = db.collection('posts');

app.get('/posts', async (req, res) => {
    try {
        const snapshot = await postsCollection.orderBy('createdAt', 'desc').get();
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

app.post('/posts', authenticate, async (req, res) => {
    try {
        const { title, summary, content, imageUrl } = req.body;
        if (!title || !summary || !content) {
            return res.status(400).send("Title, summary, and content are required.");
        }

        let imagePath = null;
        if (imageUrl) {
            try {
                imagePath = decodeURIComponent(new URL(imageUrl).pathname.split('/').slice(2).join('/'));
            } catch (e) {
                console.error('Invalid image URL:', imageUrl, e);
            }
        }

        const newPost = {
            title,
            summary,
            content,
            imageUrl: imageUrl || null,
            imagePath: imagePath,
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
        const { title, summary, content, imageUrl } = req.body;
        if (!title || !summary || !content) {
            return res.status(400).send("Title, summary, and content are required.");
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
            } catch (err) {
                console.error("Error deleting old image from storage:", err);
            }
        }

        const updatedPost = {
            title,
            summary,
            content,
            imageUrl: imageUrl,
            imagePath: newImagePath,
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

        if (!doc.exists) {
            return res.status(404).send('Post not found');
        }

        if (doc.data().authorUid !== req.user.uid) {
            return res.status(403).send('Forbidden: You are not the author of this post.');
        }

        const imagePath = doc.data().imagePath;
        if (imagePath) {
            try {
                const file = bucket.file(imagePath);
                await file.delete();
            } catch (err) {
                console.error("Error deleting image from storage:", err);
            }
        }

        await postRef.delete();
        res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send("Error deleting post");
    }
});

// Testimonials Routes
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
        const { content, user, rating, region } = req.body;
        if (!content || !user) {
            return res.status(400).send("Content and user are required.");
        }

        const newTestimonial = {
            content,
            user,
            rating: rating || 5,
            region: region || '',
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
        const { content, user, rating, region } = req.body;
        if (!content || !user) {
            return res.status(400).send("Content and user are required.");
        }

        const testimonialRef = testimonialsCollection.doc(req.params.id);
        const doc = await testimonialRef.get();

        if (!doc.exists) {
            return res.status(404).send('Testimonial not found');
        }

        const updatedTestimonial = {
            content,
            user,
            rating: rating || doc.data().rating,
            region: region || doc.data().region,
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

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);
