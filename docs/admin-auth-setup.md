# Admin authentication release checklist

The storefront remains publicly readable. Product changes now require a Firebase Authentication session.

Before deploying `firestore.rules`, complete these Firebase Console steps for the `the-emporium-b50e5` project:

1. Go to **Authentication** → **Sign-in method** and enable **Email/Password**.
2. Go to **Authentication** → **Users** and create the owner/admin email and a strong unique password. Do not build a public sign-up screen.
3. Deploy the updated static site, then sign in at `/admin.html` and verify that adding, changing, and deleting a test product works.
4. Publish the repository's `firestore.rules`. The public storefront should still load products; unauthenticated product writes must be denied.
5. Delete the test product and keep the admin credentials limited to trusted staff.

If more than one staff member needs admin access later, create a separate Firebase Authentication account for each person. Do not share the owner password.
