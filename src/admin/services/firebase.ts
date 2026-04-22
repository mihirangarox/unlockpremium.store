// We will now export the db from the main app's firebase configuration
import { db, app, auth } from "../../firebase";
import { getStorage } from "firebase/storage";

const storage = getStorage(app);

export { db, app, auth, storage };
