const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const postsCollection = db.collection('posts');

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
};

async function migrate() {
    console.log('Starting migration...');
    const snapshot = await postsCollection.get();
    
    if (snapshot.empty) {
        console.log('No posts found to migrate.');
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.slug) {
            const slug = generateSlug(data.title);
            console.log(`Generating slug for post: "${data.title}" -> ${slug}`);
            batch.update(doc.ref, { slug });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${count} posts.`);
    } else {
        console.log('All posts already have slugs.');
    }
}

migrate().then(() => {
    console.log('Migration finished.');
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
