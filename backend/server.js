
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');

// --- START: Firebase Initialization ---
try {
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "unlockpremium-372c9.firebasestorage.app"
    });
} catch (error) {
    console.error("Firebase Admin SDK initialization failed.", error);
    console.error("Please make sure you have a valid serviceAccountKey.json file in the backend directory.");
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
// --- END: Firebase Initialization ---

const app = express();
const port = 3001;

// --- START: Middleware ---
app.use(cors());
app.use(express.json());

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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // limit to 5MB
    },
});
// --- END: Middleware ---

// --- START: Image Upload Route ---
app.post('/upload-image', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const blob = bucket.file(`posts/${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    blobStream.on('error', (err) => {
        console.error('BlobStream Error:', err);
        res.status(500).send({ message: 'Could not upload the file.', error: err.message });
    });

    blobStream.on('finish', async () => {
        try {
            // Make the file public
            await blob.makePublic();

            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            res.status(200).send({ imageUrl: publicUrl });
        } catch (err) {
            console.error('Error making file public:', err);
            res.status(500).send({ message: 'File uploaded but could not make it public.' });
        }
    });

    blobStream.end(req.file.buffer);
});
// --- END: Image Upload Route ---

// --- START: Blog Post Routes ---
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
// --- END: Blog Post Routes ---

// --- START: Testimonials Routes ---
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
// --- END: Testimonials Routes ---

app.post('/login', async (req, res) => {
    const { idToken } = req.body;
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        res.json({ message: 'Token verified, user is logged in.', uid: decodedToken.uid });
    } catch (error) {
        console.error('Error verifying ID token:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
